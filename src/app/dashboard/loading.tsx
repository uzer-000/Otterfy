import OtterLoadingAnimation from '@/components/ui/OtterLoadingAnimation';

/**
 * Fallback suave de carregamento do painel (Mobile & Desktop).
 * Exibe a animação do mascote Otterfy com iluminação e desenho de linhas,
 * eliminando os skeletons quadrados e secos antigos.
 */
export default function DashboardLoading() {
  return (
    <div
      className="min-h-[55vh] sm:min-h-[65vh] w-full flex flex-col items-center justify-center p-6 select-none animate-fadeIn"
      aria-busy="true"
      aria-label="Carregando painel Otterfy..."
    >
      <OtterLoadingAnimation size="compact" idPrefix="dash-load" />
    </div>
  );
}
