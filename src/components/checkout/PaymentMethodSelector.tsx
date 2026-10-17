'use client';

import Image from 'next/image';

type PaymentMethod = 'EMOLA' | 'MPESA';

interface Props {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
}

export default function PaymentMethodSelector({ selected, onSelect }: Props) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#94A3B8]">
        Método de Pagamento
      </label>
      <div className="grid grid-cols-2 gap-4">
        {/* e-Mola with official high-contrast visual container */}
        <button
          type="button"
          onClick={() => onSelect('EMOLA')}
          className={`group flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl border-2 transition-all duration-200 cursor-pointer select-none ${
            selected === 'EMOLA'
              ? 'border-orange-500 bg-orange-50/90 dark:bg-orange-950/30 shadow-[0_0_24px_rgba(249,115,22,0.25)] ring-2 ring-orange-500/30'
              : 'border-slate-200 dark:border-[#1E1B26] bg-white dark:bg-[#121016] hover:bg-slate-50 dark:hover:bg-[#1A1820] hover:border-slate-300 dark:hover:border-[#332E3F]'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-white shadow-xs border-2 border-slate-200/90 p-2.5 flex items-center justify-center mb-2.5 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
            <Image
              src="/gateways/emola.svg"
              alt="e-Mola"
              width={52}
              height={52}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-[#F8FAFC]">e-Mola</span>
          <span className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold mt-0.5">Movitel (86 • 87)</span>
        </button>

        {/* M-Pesa with official high-contrast visual container */}
        <button
          type="button"
          onClick={() => onSelect('MPESA')}
          className={`group flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl border-2 transition-all duration-200 cursor-pointer select-none ${
            selected === 'MPESA'
              ? 'border-red-500 bg-red-50/90 dark:bg-red-950/30 shadow-[0_0_24px_rgba(239,68,68,0.25)] ring-2 ring-red-500/30'
              : 'border-slate-200 dark:border-[#1E1B26] bg-white dark:bg-[#121016] hover:bg-slate-50 dark:hover:bg-[#1A1820] hover:border-slate-300 dark:hover:border-[#332E3F]'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-white shadow-xs border-2 border-slate-200/90 p-2.5 flex items-center justify-center mb-2.5 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
            <Image
              src="/gateways/mpesa.svg"
              alt="M-Pesa"
              width={52}
              height={52}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-[#F8FAFC]">M-Pesa</span>
          <span className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-0.5">Vodacom (84 • 85)</span>
        </button>
      </div>
    </div>
  );
}
