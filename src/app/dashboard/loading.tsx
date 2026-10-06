/**
 * Fallback instantâneo durante a navegação: o clique responde na hora
 * e o skeleton só fica visível se a página demorar (>140ms).
 */
export default function DashboardLoading() {
  return (
    <div className="otter-loading w-full max-w-[2000px] 2xl:max-w-full mx-auto space-y-6" aria-busy="true" aria-label="A carregar">
      <div className="space-y-2">
        <div className="otter-skeleton h-7 w-56 !rounded-lg" />
        <div className="otter-skeleton h-4 w-80 max-w-full !rounded-md" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="otter-skeleton h-28" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="otter-skeleton h-72 lg:col-span-2" />
        <div className="otter-skeleton h-72" />
      </div>
    </div>
  );
}
