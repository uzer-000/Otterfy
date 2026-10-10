'use client';

import React, { useEffect, useState } from 'react';
import OtterLoadingAnimation from './OtterLoadingAnimation';

/**
 * Splash Screen inicial ao abrir o site ou aplicativo PWA.
 * Renderiza imediatamente no boot/carregamento inicial com a animação oficial da lontra,
 * com fade de saída suave assim que a aplicação estiver pronta.
 * Como fica no RootLayout, não reaparece durante a navegação normal entre abas.
 */
export default function OtterSplashScreen() {
  const [mounted, setMounted] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Tempo para exibir o ciclo da animação do mascote (1.3s)
    const minDisplayMs = 1300;
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
      const safety = setTimeout(finishSplash, 2600);
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
