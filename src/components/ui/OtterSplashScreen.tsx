'use client';

import React, { useEffect, useState } from 'react';
import OtterLoadingAnimation from './OtterLoadingAnimation';

/**
 * Splash Screen de inicialização.
 * Executa estritamente UMA ÚNICA VEZ por sessão no carregamento inicial (cold boot).
 * Nunca é exibido novamente durante navegação interna para garantir que nada pisque.
 */
export default function OtterSplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Verifica se já foi exibido nesta sessão do navegador
    try {
      if (sessionStorage.getItem('otterfy_splash_shown') === 'true') {
        return;
      }
      sessionStorage.setItem('otterfy_splash_shown', 'true');
    } catch {
      // Ignora erro em modo privado
    }

    setMounted(true);

    const minDisplayMs = 1200;
    const startTime = Date.now();

    const finishSplash = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDisplayMs - elapsed);

      setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
          setMounted(false);
        }, 350);
      }, remaining);
    };

    if (document.readyState === 'complete') {
      finishSplash();
    } else {
      window.addEventListener('load', finishSplash, { once: true });
      const safety = setTimeout(finishSplash, 2500);
      return () => {
        window.removeEventListener('load', finishSplash);
        clearTimeout(safety);
      };
    }
  }, []);

  if (!mounted) return null;

  return (
    <div
      id="otter-splash-screen"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-300 ease-out select-none otter-splash-container ${
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
