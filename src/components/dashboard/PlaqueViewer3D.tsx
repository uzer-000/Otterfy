'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface PlaqueViewer3DProps {
  modelUrl: string;
  fallbackImage?: string;
  title: string;
  level: string;
  format?: string;
  category?: string;
  specifications?: string;
  targetAmount: number;
  currentRevenue: number;
  isUnlocked: boolean;
  onClose: () => void;
  onClaim?: () => void;
}

export default function PlaqueViewer3D({
  modelUrl,
  fallbackImage,
  title,
  level,
  format,
  category,
  specifications,
  targetAmount,
  currentRevenue,
  isUnlocked,
  onClose,
  onClaim,
}: PlaqueViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [cameraView, setCameraView] = useState<'perspective' | 'front' | 'side'>('perspective');

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const initialDistanceRef = useRef<number>(1.2);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.05, 50);
    cameraRef.current = camera;

    // 3. Renderer with antialias and tone mapping
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.8;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.minPolarAngle = Math.PI * 0.15;
    controls.enablePan = false;

    // 5. Studio Lighting Setup (Highlights metallic relief and reflective surfaces)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // Key Light (warm white from top-front-right)
    const keyLight = new THREE.DirectionalLight(0xfff8ed, 2.8);
    keyLight.position.set(2.5, 3.5, 3.0);
    scene.add(keyLight);

    // Fill Light (soft cool violet-blue from bottom-left)
    const fillLight = new THREE.DirectionalLight(0x818cf8, 1.8);
    fillLight.position.set(-3.0, -1.0, 2.5);
    scene.add(fillLight);

    // Top Rim Light (creates crisp specular edges on the frame)
    const rimLight = new THREE.DirectionalLight(0xffffff, 2.2);
    rimLight.position.set(0, 4.0, -2.5);
    scene.add(rimLight);

    // Dynamic front specular point light
    const frontGlow = new THREE.PointLight(0xffffff, 1.2, 10);
    frontGlow.position.set(0, 0.5, 2.0);
    scene.add(frontGlow);

    // 6. Load GLTF / GLB Model
    const loader = new GLTFLoader();
    setLoading(true);
    setLoadProgress(10);

    loader.load(
      modelUrl,
      (gltf) => {
        const root = gltf.scene;
        modelRef.current = root;

        // Traverse and enhance materials
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              // Make metallic parts pop
              if (mat.metalness !== undefined && mat.metalness > 0.1) {
                mat.roughness = Math.max(0.12, mat.roughness * 0.7);
                mat.needsUpdate = true;
              }
            }
          }
        });

        // Compute Bounding Box to Center and Scale Model
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Center object
        root.position.x = -center.x;
        root.position.y = -center.y;
        root.position.z = -center.z;

        const maxDim = Math.max(size.x, size.y, size.z);
        const radius = Math.max(maxDim * 0.7, 0.25);
        initialDistanceRef.current = radius * 2.3;

        // Position camera in 3/4 angle initially
        camera.position.set(radius * 0.6, radius * 0.35, radius * 2.1);
        camera.lookAt(0, 0, 0);

        controls.minDistance = radius * 0.8;
        controls.maxDistance = radius * 4.5;
        controls.target.set(0, 0, 0);
        controls.update();

        // Entrance scale animation
        root.scale.set(0.1, 0.1, 0.1);
        scene.add(root);

        let progress = 0;
        const entranceAnim = () => {
          progress += 0.05;
          const s = THREE.MathUtils.lerp(0.1, 1.0, Math.sin((progress * Math.PI) / 2));
          root.scale.set(s, s, s);
          if (progress < 1) {
            requestAnimationFrame(entranceAnim);
          } else {
            root.scale.set(1, 1, 1);
          }
        };
        entranceAnim();

        setLoading(false);
      },
      (xhr) => {
        if (xhr.total > 0) {
          const percent = Math.min(99, Math.round((xhr.loaded / xhr.total) * 100));
          setLoadProgress(percent);
        } else {
          setLoadProgress((prev) => Math.min(90, prev + 15));
        }
      },
      (err) => {
        console.warn('Erro ao carregar modelo 3D GLB:', err);
        setLoading(false);
        setLoadError(true);
      }
    );

    // 7. Render Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer?.render(scene, camera);
    };
    animate();

    // 8. Resize Handler
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
      controls.dispose();
      renderer?.dispose();
      scene.clear();
    };
  }, [modelUrl]);

  // Handle auto-rotate toggle
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating;
    }
  }, [isAutoRotating]);

  // Camera presets
  const handleSetView = (view: 'perspective' | 'front' | 'side') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const dist = initialDistanceRef.current;
    setCameraView(view);
    setIsAutoRotating(false);

    if (view === 'front') {
      cameraRef.current.position.set(0, 0, dist * 1.9);
    } else if (view === 'side') {
      cameraRef.current.position.set(dist * 1.8, 0, dist * 0.7);
    } else {
      cameraRef.current.position.set(dist * 0.7, dist * 0.4, dist * 1.8);
    }
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  const handleZoom = (delta: number) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    camera.position.addScaledVector(dir, delta);
    controlsRef.current.update();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#100E17] border border-slate-200 dark:border-[#221D2F] rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl relative text-slate-900 dark:text-[#F8FAFC]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#221D2F] flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#0C0A12]/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-xl text-xs font-black tracking-wider font-mono bg-violet-600/15 text-violet-700 dark:text-violet-300 border border-violet-500/25">
              {level}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
                  {title}
                </h3>
                {format && (
                  <span className="hidden sm:inline-block text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                    {format}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                {category || 'Troféu Oficial Emoldurado Otterfy'} • Renderização 3D WebGL Interativa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#1E1B26] hover:bg-slate-200 dark:hover:bg-[#2A2438] flex items-center justify-center text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-all text-sm font-bold cursor-pointer"
              title="Fechar Visualizador"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 3D WebGL Canvas Viewport */}
        <div
          ref={containerRef}
          className="relative w-full h-[380px] sm:h-[460px] bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-[#08070C] dark:via-[#0F0D16] dark:to-[#08070C] flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none"
        >
          {/* Subtle Studio Floor Grid / Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.12)_0%,transparent_70%)] pointer-events-none" />

          {/* Canvas */}
          <canvas ref={canvasRef} className="w-full h-full block relative z-10" />

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 dark:bg-[#08070C]/85 backdrop-blur-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Carregando Modelo 3D da Placa...
                </span>
                <div className="w-48 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mx-auto">
                  <div
                    className="h-full bg-violet-600 rounded-full transition-all duration-300"
                    style={{ width: `${loadProgress}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  {loadProgress}% concluído
                </span>
              </div>
            </div>
          )}

          {/* Fallback Error Overlay */}
          {loadError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-white/95 dark:bg-[#0B0911]/95">
              {fallbackImage && (
                <div className="w-48 h-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 p-2 bg-slate-50 dark:bg-[#08070C]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fallbackImage} alt={title} className="w-full h-full object-contain" />
                </div>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm">
                Exibindo visualização fotográfica em alta definição com moldura oficial.
              </p>
            </div>
          )}

          {/* Bottom Floating 3D Interaction Control Pill */}
          {!loading && !loadError && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-2xl bg-white/90 dark:bg-[#121018]/90 backdrop-blur-md border border-slate-200/90 dark:border-white/15 shadow-xl text-xs">
              {/* Auto rotate toggle */}
              <button
                type="button"
                onClick={() => setIsAutoRotating(!isAutoRotating)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  isAutoRotating
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
                title={isAutoRotating ? 'Pausar Rotação Automática' : 'Ativar Rotação Automática'}
              >
                <svg
                  className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">360° Giro</span>
              </button>

              <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-0.5" />

              {/* Angle presets */}
              <button
                type="button"
                onClick={() => handleSetView('front')}
                className={`px-2.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  cameraView === 'front' && !isAutoRotating
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                Frente
              </button>

              <button
                type="button"
                onClick={() => handleSetView('perspective')}
                className={`px-2.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  cameraView === 'perspective' && !isAutoRotating
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                3D Angulado
              </button>

              <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-0.5" />

              {/* Zoom Buttons */}
              <button
                type="button"
                onClick={() => handleZoom(0.25)}
                className="w-7 h-7 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center font-bold text-sm cursor-pointer"
                title="Aproximar (+)"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => handleZoom(-0.25)}
                className="w-7 h-7 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center font-bold text-sm cursor-pointer"
                title="Afastar (-)"
              >
                −
              </button>
            </div>
          )}

          {/* Hint Overlay (top right) */}
          <div className="absolute top-3 right-3 z-30 pointer-events-none hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-[11px] font-medium text-white/80 border border-white/10">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            <span>Arraste para girar 360°</span>
          </div>
        </div>

        {/* Footer Specifications & Action */}
        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-[#221D2F] bg-slate-50/50 dark:bg-[#0E0C15]/70 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                Especificações Técnicas:
              </span>
              {format && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-600/10 text-violet-700 dark:text-violet-300 font-bold border border-violet-500/20">
                  {format}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] max-w-lg leading-relaxed">
              {specifications ||
                'Moldura nobre de alumínio anodizado preto fosco, vidro de cristal antirreflexo e emblema tridimensional com corte e gravação a laser.'}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              Fechar
            </button>

            {isUnlocked ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onClaim?.();
                }}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-md shadow-violet-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span>Resgatar Troféu (Frete Grátis)</span>
              </button>
            ) : (
              <div className="flex-1 sm:flex-initial text-center sm:text-right">
                <span className="block text-[11px] font-mono font-bold text-violet-600 dark:text-violet-400">
                  Faltam {Math.max(0, targetAmount - currentRevenue).toLocaleString()} MT
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#64748B]">
                  Meta: {targetAmount.toLocaleString()} MT
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
