'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import OtterLoadingAnimation from './OtterLoadingAnimation';

/**
 * Splash Screen inicial ao abrir o site ou aplicativo PWA.
 * Renderiza imediatamente no boot/carregamento inicial com a animação oficial da lontra,
 * com fade de saída suave assim que a aplicação estiver pronta.
 * No checkout (/pay), é DESATIVADA para carregamento instantâneo e máxima conversão.
 */
export default function OtterSplashScreen() {
  const pathname = usePathname();
  const isCheckout = pathname?.startsWith('/pay');

  const [mounted, setMounted] = useState(!isCheckout);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (isCheckout) {
      setMounted(false);
      return;
    }

    // Tempo da nova logo animada oficial (3.9s) antes de abrir
    const fullAnimationMs = 3900;
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
  }, [isCheckout]);

  if (!mounted || isCheckout) return null;

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
