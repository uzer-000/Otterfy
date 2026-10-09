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

const DEBOUNCE_DELAY_MS = 300;

function RouteTracker({ onRouteFinish }: { onRouteFinish: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    onRouteFinish();
  }, [pathname, searchParams, onRouteFinish]);

  return null;
}

export default function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Conjunto de chaves de operações ativas (rotas, APIs, forms)
  const activeKeys = useRef<Set<string>>(new Set());
  const [isActive, setIsActive] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const updateActiveState = useCallback(() => {
    const hasActive = activeKeys.current.size > 0;
    setIsActive(hasActive);

    if (hasActive) {
      if (!debounceTimer.current && !isVisible) {
        // Só exibe o loader se demorar mais de 300ms para evitar piscar em operações rápidas
        debounceTimer.current = setTimeout(() => {
          setIsVisible(true);
        }, DEBOUNCE_DELAY_MS);
      }
    } else {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      setIsVisible(false);
    }
  }, [isVisible]);

  const startLoading = useCallback((key: string = 'op-default') => {
    activeKeys.current.add(key);
    updateActiveState();
  }, [updateActiveState]);

  const stopLoading = useCallback((key: string = 'op-default') => {
    activeKeys.current.delete(key);
    updateActiveState();
  }, [updateActiveState]);

  const withLoading = useCallback(async <T,>(promise: Promise<T>, key: string = `op-${Date.now()}`): Promise<T> => {
    startLoading(key);
    try {
      return await promise;
    } finally {
      stopLoading(key);
    }
  }, [startLoading, stopLoading]);

  // Limpa as rotas pendentes quando a navegação termina
  const handleRouteFinish = useCallback(() => {
    Array.from(activeKeys.current).forEach((key) => {
      if (key.startsWith('route-')) {
        activeKeys.current.delete(key);
      }
    });
    updateActiveState();
  }, [updateActiveState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detectar cliques em links internos para iniciar o tracking de navegação
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const isInternal =
        href &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        !target.getAttribute('target') &&
        !target.getAttribute('download') &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey;

      if (isInternal && href !== pathname) {
        const routeKey = `route-${href}-${Date.now()}`;
        startLoading(routeKey);

        // Fallback de segurança se a navegação falhar ou for cancelada
        setTimeout(() => {
          stopLoading(routeKey);
        }, 10000);
      }
    };

    const handlePopState = () => {
      const popKey = `route-popstate-${Date.now()}`;
      startLoading(popKey);
      setTimeout(() => stopLoading(popKey), 6000);
    };

    document.addEventListener('click', handleLinkClick, { capture: true });
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleLinkClick, { capture: true });
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, startLoading, stopLoading]);

  // 2. Interceptação Global de Chamadas de API (fetch)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    let fetchCounter = 0;

    window.fetch = async (...args) => {
      const input = args[0];
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : '';

      // Ignora requisições de background que não bloqueiam a tela (SW, manifest, polling em segundo plano)
      const isSilent =
        url.includes('/sw.js') ||
        url.includes('/manifest') ||
        url.includes('_next/static') ||
        url.includes('cdn.utmify.com') ||
        url.includes('connect.facebook.net') ||
        (args[1]?.headers && (args[1].headers as any)['x-silent']);

      if (isSilent) {
        return originalFetch.apply(window, args);
      }

      const fetchKey = `api-${++fetchCounter}-${Date.now()}`;
      startLoading(fetchKey);

      try {
        return await originalFetch.apply(window, args);
      } finally {
        stopLoading(fetchKey);
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [startLoading, stopLoading]);

  // 3. Interceptação de Formulários (Submit)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (!form) return;

      const formKey = `form-${Date.now()}`;
      startLoading(formKey);

      // Desativa após um tempo de segurança (caso o form seja validado via JS e não dispare fetch ou navegação)
      setTimeout(() => {
        stopLoading(formKey);
      }, 7000);
    };

    document.addEventListener('submit', handleSubmit, { capture: true });
    return () => {
      document.removeEventListener('submit', handleSubmit, { capture: true });
    };
  }, [startLoading, stopLoading]);

  return (
    <GlobalLoadingContext.Provider value={{ startLoading, stopLoading, isLoading: isActive, withLoading }}>
      <Suspense fallback={null}>
        <RouteTracker onRouteFinish={handleRouteFinish} />
      </Suspense>
      {children}

      {/* Overlay Global de Processamento — Só visível se demorar > 300ms */}
      <div
        className={`fixed inset-0 z-[9990] flex flex-col items-center justify-center transition-all duration-300 ease-out select-none otter-splash-container ${
          isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          backgroundColor: 'color-mix(in srgb, var(--otter-bg) 82%, transparent)',
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
