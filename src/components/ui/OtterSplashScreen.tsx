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
    // Tempo exato para a animação da logo processar 100% (encaixe das metades + flash na fenda + feixe de brilho + barra laser)
    const fullAnimationMs = 1900;
    const fadeDurationMs = 380;

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, fullAnimationMs);

    const unmountTimer = setTimeout(() => {
      setMounted(false);
    }, fullAnimationMs + fadeDurationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      id="otter-splash-screen"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-350 ease-out select-none otter-splash-container ${
        isFadingOut ? 'opacity-0 scale-[1.03] pointer-events-none' : 'opacity-100 scale-100'
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
