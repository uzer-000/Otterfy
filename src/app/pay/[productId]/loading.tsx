import OtterLoadingAnimation from '@/components/ui/OtterLoadingAnimation';

/**
 * Fallback de abertura do checkout (Mobile & Desktop).
 * Exibe a animação da Otterfy durante a abertura do link de checkout.
 */
export default function CheckoutOpeningLoading() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] p-6 select-none animate-fadeIn">
      <div className="w-full max-w-[480px] flex flex-col items-center justify-center gap-5 text-center py-12 px-4">
        <OtterLoadingAnimation size="compact" idPrefix="pay-open-load" />
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Checkout Seguro Otterfy
          </p>
          <p className="text-sm text-gray-400 font-medium">
            Preparando ambiente de pagamento...
          </p>
        </div>
      </div>
    </main>
  );
}
