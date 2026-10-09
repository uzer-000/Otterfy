import OtterLoadingAnimation from '@/components/ui/OtterLoadingAnimation';

export default function PayRouteLoading() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] p-6 select-none animate-fadeIn">
      <div className="w-full max-w-[480px] flex flex-col items-center justify-center gap-5 text-center py-12 px-4">
        <OtterLoadingAnimation size="compact" idPrefix="pay-route-load" />
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Carregando...
        </p>
      </div>
    </main>
  );
}
