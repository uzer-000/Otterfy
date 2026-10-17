'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface ModelVariant {
  name: string;
  modelGlb: string;
  color?: string;
  image?: string;
}

interface PlaqueViewer3DProps {
  modelUrl?: string;
  variants?: ModelVariant[];
  fallbackImage: string;
  title: string;
  level: string;
  targetAmount: number;
  currentRevenue: number;
  isUnlocked: boolean;
  onClose: () => void;
  onClaim?: () => void;
  format?: string;
  category?: string;
  specifications?: string;
  perks?: string;
  type?: 'starter_community' | 'community' | 'bracelet' | 'plaque';
  onOpenWhatsapp?: () => void;
}

export default function PlaqueViewer3D({
  modelUrl,
  variants,
  fallbackImage,
  title,
  level,
  targetAmount,
  currentRevenue,
  isUnlocked,
  onClose,
  onClaim,
  format,
  category,
  specifications,
  perks,
  type = 'plaque',
  onOpenWhatsapp,
}: PlaqueViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeModelUrl, setActiveModelUrl] = useState<string | undefined>(
    modelUrl || variants?.[0]?.modelGlb
  );

  useEffect(() => {
    setActiveModelUrl(modelUrl || variants?.[0]?.modelGlb);
  }, [modelUrl, variants]);

  const [loading, setLoading] = useState(Boolean(activeModelUrl));
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [is3DReady, setIs3DReady] = useState(false);

  // 2D Card Tilt State for Fallback or 2D awards (Celular WhatsApp)
  const [cardTilt, setCardTilt] = useState({ rotateX: 0, rotateY: 0, shineX: 50, shineY: 50 });
  const [isHovered, setIsHovered] = useState(false);

  // Three.js internal references for 60fps lerp
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const specularLightRef = useRef<THREE.PointLight | null>(null);

  // Cursor Tracking Physics
  const targetTiltX = useRef(0);
  const targetTiltY = useRef(0);
  const currentTiltX = useRef(0);
  const currentTiltY = useRef(0);

  // Drag 360° Physics
  const baseRotationY = useRef(0);
  const baseRotationX = useRef(0);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Handle pointer tracking for 3D model & 2D fallback
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    // Normalized from -1 to +1
    const normX = (x / rect.width - 0.5) * 2;
    const normY = (y / rect.height - 0.5) * 2;

    // Target tilt angles for 3D GLB
    targetTiltY.current = normX * 0.45; // ~25 deg Y rotation towards mouse
    targetTiltX.current = -normY * 0.35; // ~20 deg X rotation towards mouse

    // 2D Card Parallax Tilt State
    setCardTilt({
      rotateY: normX * 22,
      rotateX: -normY * 18,
      shineX: Math.round(((normX + 1) / 2) * 100),
      shineY: Math.round(((normY + 1) / 2) * 100),
    });
    setIsHovered(true);
  }, []);

  const handlePointerLeave = useCallback(() => {
    targetTiltY.current = 0;
    targetTiltX.current = 0;
    setIsHovered(false);
    setCardTilt({ rotateX: 0, rotateY: 0, shineX: 50, shineY: 50 });
  }, []);

  // Pointer Drag handlers (360° Free Orbit)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) {
      handlePointerMove(e);
      return;
    }
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;

    baseRotationY.current += deltaX * 0.009;
    baseRotationX.current += deltaY * 0.009;
    // Limit vertical angle so plaque/bracelet doesn't invert
    baseRotationX.current = Math.max(-Math.PI * 0.35, Math.min(Math.PI * 0.35, baseRotationX.current));

    dragStart.current = { x: e.clientX, y: e.clientY };
    handlePointerMove(e);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Double click resets angle to front
  const handleResetAngle = () => {
    baseRotationY.current = 0;
    baseRotationX.current = 0;
    targetTiltX.current = 0;
    targetTiltY.current = 0;
  };

  // Initialize Three.js WebGL Scene if activeModelUrl exists
  useEffect(() => {
    if (!activeModelUrl) {
      setLoading(false);
      setIs3DReady(false);
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;

    setIs3DReady(false);
    setLoading(true);
    setLoadProgress(15);
    setLoadError(false);

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera (narrow FOV 38 for realistic luxury portrait view)
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 360;
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.05, 50);
    cameraRef.current = camera;

    // 3. Renderer with SRGB and Tone Mapping in Full HD Crisp Quality
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      precision: 'highp',
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    // 4. Studio Lighting Rig (Enhanced for Full HD Specular Highlights)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
    scene.add(ambientLight);

    // Key Light (warm studio accent)
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.7);
    keyLight.position.set(2.5, 3.5, 3.0);
    scene.add(keyLight);

    // Cool Rim Light (edge definition)
    const rimLight = new THREE.DirectionalLight(0x60a5fa, 2.1);
    rimLight.position.set(-2.5, -1.0, 2.0);
    scene.add(rimLight);

    // Top Specular Highlight
    const topLight = new THREE.DirectionalLight(0xffffff, 1.9);
    topLight.position.set(0, 4.0, -2.0);
    scene.add(topLight);

    // Dynamic Cursor-Tracking Specular Light
    const specularLight = new THREE.PointLight(0xffffff, 1.5, 8);
    specularLight.position.set(0, 0, 2.2);
    specularLightRef.current = specularLight;
    scene.add(specularLight);

    // 5. Load GLTF Model
    const loader = new GLTFLoader();

    loader.load(
      activeModelUrl,
      (gltf) => {
        const root = gltf.scene;
        modelRef.current = root;

        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat.metalness !== undefined && mat.metalness > 0.05) {
                mat.roughness = Math.max(0.08, mat.roughness * 0.65);
                mat.metalness = Math.min(1.0, mat.metalness * 1.15);
                mat.needsUpdate = true;
              }
            }
          }
        });

        // Center model
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        root.position.x = -center.x;
        root.position.y = -center.y;
        root.position.z = -center.z;

        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * (type === 'bracelet' ? 2.3 : 2.15);

        camera.position.set(0, 0, distance);
        camera.lookAt(0, 0, 0);

        scene.add(root);
        setIs3DReady(true);
        setLoading(false);
      },
      (xhr) => {
        if (xhr.total > 0) {
          setLoadProgress(Math.min(99, Math.round((xhr.loaded / xhr.total) * 100)));
        } else {
          setLoadProgress((prev) => Math.min(95, prev + 20));
        }
      },
      (err) => {
        console.warn('Erro ao carregar modelo 3D GLB:', err);
        setLoading(false);
        setLoadError(true);
      }
    );

    // 6. Smooth 60fps Render Loop with Lerp Cursor Tracking
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Lerp tilt towards cursor position
      currentTiltX.current += (targetTiltX.current - currentTiltX.current) * 0.09;
      currentTiltY.current += (targetTiltY.current - currentTiltY.current) * 0.09;

      if (modelRef.current) {
        modelRef.current.rotation.y = baseRotationY.current + currentTiltY.current;
        modelRef.current.rotation.x = baseRotationX.current + currentTiltX.current;
      }

      if (specularLightRef.current) {
        specularLightRef.current.position.set(
          currentTiltY.current * 3.5,
          -currentTiltX.current * 3.5,
          2.2
        );
      }

      renderer?.render(scene, camera);
    };
    animate();

    // 7. Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (modelRef.current) {
        modelRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry?.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              mesh.material?.dispose();
            }
          }
        });
      }
      renderer?.dispose();
      scene.clear();
    };
  }, [activeModelUrl, type]);

  const formattedTarget = targetAmount > 0 ? `${targetAmount.toLocaleString('pt-MZ')} MT` : '0 MT';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Modal Shell matching the reference screenshot */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[460px] sm:max-w-[490px] rounded-[28px] border border-white/10 bg-[#08070D] p-6 sm:p-7 flex flex-col items-center overflow-hidden shadow-2xl text-white"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 50px -10px rgba(56, 189, 248, 0.12)',
        }}
      >
        {/* Subtle Sunburst Radial Rays Emanating from Behind the Award */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
          {/* Radial Glow Center */}
          <div className="absolute w-[440px] h-[440px] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.18)_0%,rgba(14,165,233,0.06)_40%,transparent_70%)] blur-2xl" />

          {/* SVG Sunburst Rays */}
          <svg
            className="absolute w-[600px] h-[600px] opacity-25 mix-blend-screen"
            viewBox="0 0 500 500"
            fill="none"
          >
            <defs>
              <radialGradient id="sunburstFade" cx="50%" cy="45%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="35%" stopColor="#0284c7" stopOpacity="0.4" />
                <stop offset="65%" stopColor="#0369a1" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
              <mask id="sunburstMask">
                <circle cx="250" cy="225" r="230" fill="url(#sunburstFade)" />
              </mask>
            </defs>
            <g mask="url(#sunburstMask)" transform="translate(250, 225)">
              {Array.from({ length: 36 }).map((_, i) => (
                <path
                  key={i}
                  d={`M 0 0 L ${250 * Math.cos(((i * 10 - 2.5) * Math.PI) / 180)} ${
                    250 * Math.sin(((i * 10 - 2.5) * Math.PI) / 180)
                  } L ${250 * Math.cos(((i * 10 + 2.5) * Math.PI) / 180)} ${
                    250 * Math.sin(((i * 10 + 2.5) * Math.PI) / 180)
                  } Z`}
                  fill="#38bdf8"
                />
              ))}
            </g>
          </svg>
        </div>

        {/* Top Close Button (X) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-40 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-sm"
          title="Fechar"
        >
          ✕
        </button>

        {/* Top Status Pill: STILL LOCKED / DESBLOQUEADO */}
        <div className="relative z-20 mb-2">
          {isUnlocked ? (
            <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>DESBLOQUEADO</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-violet-500/10 border border-violet-500/30 text-violet-400 shadow-sm shadow-violet-500/15">
              <span>STILL LOCKED</span>
            </div>
          )}
        </div>

        {/* Color/Style Variant Switcher for 3D Wristbands (Roxa / Branca) */}
        {variants && variants.length > 1 && (
          <div className="relative z-30 flex items-center gap-1.5 p-1 rounded-full bg-white/10 dark:bg-white/5 border border-white/15 backdrop-blur-md mb-2">
            {variants.map((v) => {
              const isSelected = activeModelUrl === v.modelGlb;
              return (
                <button
                  key={v.modelGlb}
                  type="button"
                  onClick={() => setActiveModelUrl(v.modelGlb)}
                  className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-white text-black shadow-md shadow-white/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/20"
                    style={{
                      backgroundColor:
                        v.color ||
                        (v.name.toLowerCase().includes('roxa') ? '#8b5cf6' : '#ffffff'),
                    }}
                  />
                  <span>{v.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Center Award Viewport (with Mouse Cursor Tracking Parallax + 360° Drag) */}
        <div
          ref={containerRef}
          onPointerMove={handlePointerDragMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onDoubleClick={handleResetAngle}
          className="relative z-20 w-full h-[330px] sm:h-[350px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-visible"
        >
          {/* WebGL 3D Model Canvas (when activeModelUrl is present and loaded) */}
          {activeModelUrl && (
            <canvas
              ref={canvasRef}
              style={{ touchAction: 'none' }}
              className={`w-full h-full block relative z-10 transition-opacity duration-300 ${
                is3DReady && !loading ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {/* 3D Card Parallax (for 2D awards like celular whatsapp, or while 3D GLB is loading) */}
          {(!activeModelUrl || !is3DReady || loadError) && (
            <div
              className="relative w-64 h-80 flex items-center justify-center transition-transform duration-100 ease-out z-10"
              style={{
                perspective: '1000px',
                transformStyle: 'preserve-3d',
                transform: `rotateY(${cardTilt.rotateY}deg) rotateX(${cardTilt.rotateX}deg) scale3d(${
                  isHovered ? 1.04 : 1
                }, ${isHovered ? 1.04 : 1}, 1)`,
              }}
            >
              {/* Award Image with Soft Ambient Glow */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fallbackImage}
                alt={title}
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)] pointer-events-none"
              />

              {/* Dynamic Glossy Specular Shine that follows the cursor */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-200 mix-blend-overlay"
                style={{
                  opacity: isHovered ? 0.65 : 0.2,
                  background: `radial-gradient(circle at ${cardTilt.shineX}% ${cardTilt.shineY}%, rgba(255,255,255,0.7) 0%, transparent 60%)`,
                }}
              />
            </div>
          )}

          {/* Loading Indicator for 3D GLB */}
          {loading && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center space-y-3 pointer-events-none">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
              <span className="text-[11px] font-mono text-violet-300">
                Carregando 3D ({loadProgress}%)
              </span>
            </div>
          )}
        </div>

        {/* Title and Subtitle */}
        <div className="relative z-20 text-center mt-3 space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-[13px] text-slate-400">
            {targetAmount > 0 ? (
              <>
                Desbloqueia aos <strong className="text-white font-bold">{formattedTarget}</strong> em vendas
              </>
            ) : (
              <>Acesso liberado no primeiro dia na Otterfy</>
            )}
          </p>
        </div>

        {/* Horizontal Divider Line */}
        <div className="relative z-20 w-full border-t border-white/10 my-4" />

        {/* Two-Column Info Bar (MARCO & INSTAGRAM / BENEFÍCIO) */}
        <div className="relative z-20 w-full grid grid-cols-2 gap-4 text-left">
          {/* Left Column: MARCO */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block">
              MARCO
            </span>
            <div className="text-xs sm:text-[13px] text-slate-300">
              <strong className="text-white font-bold">{formattedTarget}</strong> em vendas
            </div>
          </div>

          {/* Right Column: INSTAGRAM & RECONHECIMENTO */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>{type === 'bracelet' ? 'ENVIO FÍSICO' : 'INSTAGRAM'}</span>
            </div>
            <div className="text-xs sm:text-[13px] text-slate-300">
              {type === 'bracelet' ? (
                <>
                  <strong className="text-white font-bold">2 Pulseiras Físicas</strong> entregues com frete grátis
                </>
              ) : (
                <>
                  <strong className="text-white font-bold">Repost garantido</strong> quando você chegar aqui
                </>
              )}
            </div>
          </div>
        </div>

        {/* Lower Horizontal Divider Line */}
        <div className="relative z-20 w-full border-b border-white/10 my-4" />

        {/* Bottom Centered Pill Button */}
        <div className="relative z-20 w-full flex items-center justify-center pt-1">
          {type === 'starter_community' || type === 'community' ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWhatsapp?.();
              }}
              className="px-6 py-2.5 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2" />
              </svg>
              <span>Entrar no WhatsApp</span>
            </button>
          ) : isUnlocked ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onClaim?.();
              }}
              className="px-7 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>Resgatar Troféu (Frete Grátis)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              Fechar prévia
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
