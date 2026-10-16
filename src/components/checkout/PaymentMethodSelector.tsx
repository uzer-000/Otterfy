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
      <label className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
        Método de Pagamento
      </label>
      <div className="grid grid-cols-2 gap-4">
        {/* e-Mola with official high-contrast visual container */}
        <button
          type="button"
          onClick={() => onSelect('EMOLA')}
          className={`group flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none ${
            selected === 'EMOLA'
              ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_24px_rgba(249,115,22,0.25)] ring-2 ring-orange-500/30'
              : 'border-[#1E1B26] bg-[#121016] hover:bg-[#1A1820] hover:border-[#332E3F]'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200 p-2 flex items-center justify-center mb-2.5 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
            <Image
              src="/gateways/emola.png"
              alt="e-Mola"
              width={48}
              height={48}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-bold text-sm text-[#F8FAFC]">e-Mola</span>
          <span className="text-[11px] text-orange-400 font-medium mt-0.5">Movitel (86 • 87)</span>
        </button>

        {/* M-Pesa with official high-contrast visual container */}
        <button
          type="button"
          onClick={() => onSelect('MPESA')}
          className={`group flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none ${
            selected === 'MPESA'
              ? 'border-red-500 bg-red-500/10 shadow-[0_0_24px_rgba(239,68,68,0.25)] ring-2 ring-red-500/30'
              : 'border-[#1E1B26] bg-[#121016] hover:bg-[#1A1820] hover:border-[#332E3F]'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200 p-2 flex items-center justify-center mb-2.5 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
            <Image
              src="/gateways/Mpesa.png"
              alt="M-Pesa"
              width={48}
              height={48}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-bold text-sm text-[#F8FAFC]">M-Pesa</span>
          <span className="text-[11px] text-red-400 font-medium mt-0.5">Vodacom (84 • 85)</span>
        </button>
      </div>
    </div>
  );
}
