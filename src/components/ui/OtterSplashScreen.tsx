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
    try {
      // Se já abriu nesta sessão, libera imediatamente em 0ms para navegação instantânea
      if (sessionStorage.getItem('otterfy_booted') === '1') {
        setMounted(false);
        return;
      }
      sessionStorage.setItem('otterfy_booted', '1');
    } catch {
      // ignore sessionStorage errors
    }

    // Boot ultra-rápido (~480ms de entrada + 180ms de fade suave = ~0.65s total)
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 480);

    const unmountTimer = setTimeout(() => {
      setMounted(false);
    }, 660);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      id="otter-splash-screen"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-200 ease-out select-none otter-splash-container ${
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
