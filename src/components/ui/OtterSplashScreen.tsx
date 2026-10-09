'use client';

import React, { useEffect, useState } from 'react';
import OtterLoadingAnimation from './OtterLoadingAnimation';

/**
 * Splash Screen inicial ao abrir o site ou aplicativo PWA.
 * Renderiza imediatamente no boot, respeitando o tema (dark/light),
 * safe-areas do celular e preferências de movimento reduzido.
 * Desaparece com um fade-out suave assim que os recursos essenciais carregam.
 */
export default function OtterSplashScreen() {
  const [mounted, setMounted] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Remove qualquer splash estático de fallback que possa ter sido injetado no HTML SSR
    const fallback = document.getElementById('otter-ssr-splash');
    if (fallback) {
      fallback.remove();
    }

    // Tempo mínimo para a animação do mascote completar sua montagem (1.4s)
    // ou aguardar window.onload se demorar mais.
    const startTime = Date.now();
    const minDisplayMs = 1400;

    const handleReady = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDisplayMs - elapsed);

      setTimeout(() => {
        setIsFadingOut(true);
        // Desmonta após a transição de fade-out (450ms)
        setTimeout(() => {
          setMounted(false);
          // Marca no sessionStorage para conhecimento da sessão
          try {
            sessionStorage.setItem('otterfy_splash_shown', 'true');
          } catch {}
        }, 450);
      }, remaining);
    };

    if (document.readyState === 'complete') {
      handleReady();
    } else {
      window.addEventListener('load', handleReady, { once: true });
      // Fallback de segurança se o evento load demorar
      const safetyTimer = setTimeout(handleReady, 3500);
      return () => {
        window.removeEventListener('load', handleReady);
        clearTimeout(safetyTimer);
      };
    }
  }, []);

  if (!mounted) return null;

  return (
    <div
      id="otter-splash-screen"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-[450ms] ease-out select-none otter-splash-container ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundColor: 'var(--otter-bg)',
      }}
      aria-hidden={isFadingOut}
    >
      <OtterLoadingAnimation size="splash" idPrefix="splash" />
    </div>
  );
}
