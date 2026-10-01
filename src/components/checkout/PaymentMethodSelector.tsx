'use client';

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
        {/* e-Mola with official 512x512 image */}
        <button
          type="button"
          onClick={() => onSelect('EMOLA')}
          className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
            selected === 'EMOLA'
              ? 'border-orange-500 bg-[#18141F] shadow-[0_0_20px_rgba(249,115,22,0.2)] ring-1 ring-orange-500'
              : 'border-[#1E1B26] bg-[#121016] hover:bg-[#1A1820] hover:border-[#332E3F]'
          }`}
        >
          <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 p-1 flex items-center justify-center mb-2.5 overflow-hidden">
            <img
              src="/gateways/emola.png"
              alt="e-Mola"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-bold text-sm text-[#F8FAFC]">e-Mola</span>
          <span className="text-[11px] text-[#94A3B8] mt-0.5">Movitel (86 / 87)</span>
        </button>

        {/* M-Pesa with official 512x512 image */}
        <button
          type="button"
          onClick={() => onSelect('MPESA')}
          className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
            selected === 'MPESA'
              ? 'border-red-500 bg-[#1A1318] shadow-[0_0_20px_rgba(239,68,68,0.2)] ring-1 ring-red-500'
              : 'border-[#1E1B26] bg-[#121016] hover:bg-[#1A1820] hover:border-[#332E3F]'
          }`}
        >
          <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 p-1 flex items-center justify-center mb-2.5 overflow-hidden">
            <img
              src="/gateways/Mpesa.png"
              alt="M-Pesa"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-bold text-sm text-[#F8FAFC]">M-Pesa</span>
          <span className="text-[11px] text-[#94A3B8] mt-0.5">Vodacom (84 / 85)</span>
        </button>
      </div>
    </div>
  );
}
