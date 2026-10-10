'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import OtterLoadingAnimation from './OtterLoadingAnimation';

interface GlobalLoadingContextType {
  startLoading: (key?: string) => void;
  stopLoading: (key?: string) => void;
  isLoading: boolean;
  withLoading: <T>(promise: Promise<T>, key?: string) => Promise<T>;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType>({
  startLoading: () => {},
  stopLoading: () => {},
  isLoading: false,
  withLoading: (p) => p,
});

export function useGlobalLoading() {
  return useContext(GlobalLoadingContext);
}

// O usuário especificou rigorosamente:
// "quando eu clicar em algum lugar do site e demorar mais de 1.90 segundo para abrir, nesse 1.90s entra a logo e boom o lugar onde cliquei abriu"
const DEBOUNCE_DELAY_MS = 1900;

function RouteTracker({ onRouteFinish }: { onRouteFinish: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKey = useRef<string>('');

  useEffect(() => {
    const currentKey = `${pathname}?${searchParams?.toString() || ''}`;
    if (lastKey.current && lastKey.current !== currentKey) {
      onRouteFinish();
    }
    lastKey.current = currentKey;
  }, [pathname, searchParams, onRouteFinish]);

  return null;
}

export default function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const activeCount = useRef(0);

  const clearTimer = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
  }, []);

  const triggerLoadingWithDelay = useCallback(() => {
    activeCount.current += 1;
    if (!debounceTimer.current) {
      // Só torna visível se a ação do usuário demorar mais de 1.90s
      debounceTimer.current = setTimeout(() => {
        if (activeCount.current > 0) {
          setIsVisible(true);
        }
      }, DEBOUNCE_DELAY_MS);
    }
  }, []);

  const endLoading = useCallback(() => {
    activeCount.current = Math.max(0, activeCount.current - 1);
    if (activeCount.current === 0) {
      clearTimer();
      setIsVisible(false);
    }
  }, [clearTimer]);

  const forceEndAll = useCallback(() => {
    activeCount.current = 0;
    clearTimer();
    setIsVisible(false);
  }, [clearTimer]);

  const startLoading = useCallback(
    (_key?: string) => {
      triggerLoadingWithDelay();
    },
    [triggerLoadingWithDelay]
  );

  const stopLoading = useCallback(
    (_key?: string) => {
      endLoading();
    },
    [endLoading]
  );

  const withLoading = useCallback(
    async <T,>(promise: Promise<T>, _key?: string): Promise<T> => {
      triggerLoadingWithDelay();
      try {
        return await promise;
      } finally {
        endLoading();
      }
    },
    [triggerLoadingWithDelay, endLoading]
  );

  // Monitora cliques em links internos do usuário
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLinkClick = (e: MouseEvent) => {
      // Ignorar cliques secundários ou atalhos de nova aba
      if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
        return;
      }

      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href === '#' || href === '' || href.startsWith('#') || href.startsWith('javascript:')) {
        return;
      }
      if (anchor.getAttribute('target') === '_blank' || anchor.hasAttribute('download')) {
        return;
      }

      try {
        const currentUrl = new URL(window.location.href);
        const targetUrl = new URL(href, window.location.href);

        // Somente links internos do mesmo domínio
        if (targetUrl.origin !== currentUrl.origin) return;

        // Se for exatamente a mesma página e mesma query, NÃO dispara carregamento
        if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search) {
          return;
        }

        // Usuário clicou em um link que vai navegar para outra página:
        // Inicia a contagem de 1.90s. Se a página abrir antes de 1.90s, nada pisca!
        triggerLoadingWithDelay();

        // Fallback de segurança caso a navegação seja cancelada
        setTimeout(() => {
          endLoading();
        }, 10000);
      } catch {
        // Formato de link desconhecido
      }
    };

    const handlePopState = () => {
      triggerLoadingWithDelay();
      setTimeout(endLoading, 5000);
    };

    document.addEventListener('click', handleLinkClick, { capture: true });
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleLinkClick, { capture: true });
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, triggerLoadingWithDelay, endLoading]);

  return (
    <GlobalLoadingContext.Provider
      value={{
        startLoading,
        stopLoading,
        isLoading: isVisible,
        withLoading,
      }}
    >
      <Suspense fallback={null}>
        <RouteTracker onRouteFinish={forceEndAll} />
      </Suspense>
      {children}

      {/* Overlay Global de Processamento — Só visível se demorar > 1.90s */}
      <div
        className={`fixed inset-0 z-[9990] flex flex-col items-center justify-center transition-opacity duration-300 ease-out select-none otter-splash-container ${
          isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          backgroundColor: 'var(--otter-overlay-bg, rgba(14, 11, 18, 0.85))',
        }}
        aria-hidden={!isVisible}
        role="status"
        aria-live="polite"
        aria-label="Processando..."
      >
        <div className="flex flex-col items-center justify-center p-6 rounded-3xl animate-in zoom-in-95 duration-200">
          <OtterLoadingAnimation size="compact" idPrefix="global-loader" />
        </div>
      </div>
    </GlobalLoadingContext.Provider>
  );
}
