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

// O usuário especificou exatamente:
// "quando eu clicar em algum lugar do site e demorar mais de 1.90 segundo para abrir, nesse 1.90s entra a logo e boom o lugar onde cliquei abriu"
const DEBOUNCE_DELAY_MS = 1900;

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

  // Chaves de operações em andamento
  const activeKeys = useRef<Set<string>>(new Set());
  const [isActive, setIsActive] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const updateActiveState = useCallback(() => {
    const hasActive = activeKeys.current.size > 0;
    setIsActive(hasActive);

    if (hasActive) {
      if (!debounceTimer.current && !isVisible) {
        // Só exibe se demorar mais de 1.90s (1900ms) para não piscar em navegações rápidas
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

  const startLoading = useCallback(
    (key: string = 'op-default') => {
      activeKeys.current.add(key);
      updateActiveState();
    },
    [updateActiveState]
  );

  const stopLoading = useCallback(
    (key: string = 'op-default') => {
      activeKeys.current.delete(key);
      updateActiveState();
    },
    [updateActiveState]
  );

  const withLoading = useCallback(
    async <T,>(promise: Promise<T>, key: string = `op-${Date.now()}`): Promise<T> => {
      startLoading(key);
      try {
        return await promise;
      } finally {
        stopLoading(key);
      }
    },
    [startLoading, stopLoading]
  );

  // Conclusão de rota (quando o pathname/searchParams muda no cliente)
  const handleRouteFinish = useCallback(() => {
    if (activeKeys.current.size > 0) {
      Array.from(activeKeys.current).forEach((key) => {
        if (key.startsWith('route-')) {
          activeKeys.current.delete(key);
        }
      });
      updateActiveState();
    }
  }, [updateActiveState]);

  // 1. Detectar cliques em links internos e disparar verificação de 1.90s
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLinkClick = (e: MouseEvent) => {
      // Ignorar cliques com modificadores (abrir em nova aba, etc.)
      if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
        return;
      }

      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
      if (anchor.getAttribute('target') === '_blank' || anchor.hasAttribute('download')) return;

      try {
        const currentUrl = new URL(window.location.href);
        const targetUrl = new URL(href, window.location.href);

        // Somente links internos do mesmo domínio
        if (targetUrl.origin !== currentUrl.origin) return;

        // Se for a exata mesma página com mesma query e hash, não dispara navegação
        if (
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search &&
          targetUrl.hash
        ) {
          return;
        }

        const routeKey = `route-${targetUrl.pathname}-${Date.now()}`;
        startLoading(routeKey);

        // Fallback de segurança se o navegador cancelar ou se for navegação rápida abortada
        setTimeout(() => {
          stopLoading(routeKey);
        }, 12000);
      } catch {
        // Ignora URLs com formato desconhecido
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

  // 2. Interceptação de Formulários (Submit)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (!form) return;

      const formKey = `form-${Date.now()}`;
      startLoading(formKey);

      // Desativa após um tempo de segurança
      setTimeout(() => {
        stopLoading(formKey);
      }, 8000);
    };

    document.addEventListener('submit', handleSubmit, { capture: true });
    return () => {
      document.removeEventListener('submit', handleSubmit, { capture: true });
    };
  }, [startLoading, stopLoading]);

  // ATENÇÃO: NÃO interceptamos window.fetch de forma global e indiscriminada!
  // Isso causava flashes na tela a cada 4 segundos no PC por causa do polling em segundo plano de /api/payments.
  // O loader global agora responde exclusivamente a ações do usuário (cliques em links e envios de formulários)
  // que demorarem mais de 1.90 segundos, conforme solicitado.

  return (
    <GlobalLoadingContext.Provider value={{ startLoading, stopLoading, isLoading: isActive, withLoading }}>
      <Suspense fallback={null}>
        <RouteTracker onRouteFinish={handleRouteFinish} />
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
