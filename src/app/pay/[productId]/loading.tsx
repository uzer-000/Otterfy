/**
 * Fallback de abertura rápida do checkout (Mobile & Desktop).
 * Efeito básico e limpo que surge instantaneamente, rápido e estável.
 */
export default function CheckoutOpeningLoading() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#F5F3FA] dark:bg-[#08070C] text-[#0F172A] dark:text-[#F8FAFC] py-6 sm:py-9 px-4 select-none animate-fadeIn">
      <div className="w-full max-w-[480px] mx-auto bg-white dark:bg-[#121016] rounded-[28px] border border-slate-200/80 dark:border-[#1E1B26] shadow-[0_16px_44px_-12px_rgba(15,23,42,0.06)] p-6 sm:p-7 space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-[#1E1B26]">
          <div className="h-6 w-28 bg-slate-100 dark:bg-white/10 rounded-full animate-pulse" />
          <div className="h-6 w-24 bg-slate-100 dark:bg-white/10 rounded-full animate-pulse" />
        </div>

        {/* Product card skeleton */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-[#0F0E14] border border-slate-100 dark:border-[#1E1B26]">
          <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-white/15 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-white/15 rounded animate-pulse" />
            <div className="h-5 w-24 bg-emerald-100 dark:bg-emerald-950/40 rounded animate-pulse" />
          </div>
        </div>

        {/* Form fields skeleton */}
        <div className="space-y-3 pt-1">
          <div className="h-11 bg-slate-50 dark:bg-[#0F0E14] border border-slate-100 dark:border-[#1E1B26] rounded-xl animate-pulse" />
          <div className="h-11 bg-slate-50 dark:bg-[#0F0E14] border border-slate-100 dark:border-[#1E1B26] rounded-xl animate-pulse" />
          <div className="h-11 bg-slate-50 dark:bg-[#0F0E14] border border-slate-100 dark:border-[#1E1B26] rounded-xl animate-pulse" />
        </div>

        {/* Button skeleton */}
        <div className="h-14 bg-emerald-600/20 rounded-xl animate-pulse" />
      </div>
    </main>
  );
}
