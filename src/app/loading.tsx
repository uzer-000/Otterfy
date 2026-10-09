import OtterLoadingAnimation from '@/components/ui/OtterLoadingAnimation';

/**
 * Fallback global de carregamento de rotas raiz da Otterfy.
 */
export default function RootLoading() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-6 select-none animate-fadeIn"
      style={{
        backgroundColor: 'var(--otter-bg)',
      }}
      aria-busy="true"
      aria-label="Carregando Otterfy..."
    >
      <OtterLoadingAnimation size="compact" idPrefix="root-load" />
    </div>
  );
}
