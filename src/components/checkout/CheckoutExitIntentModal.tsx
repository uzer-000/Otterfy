'use client';

import React, { useState, useEffect } from 'react';

interface CheckoutExitIntentModalProps {
  productName: string;
  defaultCouponCode?: string;
  onApplyCoupon: (code: string) => void;
}

export default function CheckoutExitIntentModal({
  productName,
  defaultCouponCode = 'ESPECIAL10',
  onApplyCoupon,
}: CheckoutExitIntentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    // Check if already shown in this browser session
    try {
      if (sessionStorage.getItem('otterfy_exit_intent_dismissed') === 'true') {
        return;
      }
    } catch {}

    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger when mouse moves towards top of browser (close tab / URL bar)
      if (e.clientY <= 15 && !hasTriggered) {
        setHasTriggered(true);
        setIsOpen(true);
        try {
          sessionStorage.setItem('otterfy_exit_intent_dismissed', 'true');
        } catch {}
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasTriggered]);

  const handleClaimDiscount = () => {
    onApplyCoupon(defaultCouponCode);
    setIsOpen(false);

    // Scroll smoothly to coupon / phone input
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
      phoneInput.focus();
      phoneInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Oferta Especial de Retenção"
    >
      <div className="bg-white dark:bg-[#121016] border border-amber-500/40 rounded-3xl max-w-sm sm:max-w-md w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden text-center text-slate-900 dark:text-[#F8FAFC] animate-in zoom-in-95 duration-200">
        {/* Top Gold Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />

        {/* Floating Discount Badge */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 text-amber-500 flex items-center justify-center mx-auto text-3xl mb-3 shadow-lg shadow-amber-500/10">
          🎁
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 mb-2">
          ⚡ Espere! Oferta Especial de Última Hora
        </span>

        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F8FAFC] leading-snug">
          Não perca o acesso a {productName}!
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] mt-2 leading-relaxed">
          Gere o seu acesso agora e ganhe um <strong className="text-emerald-600 dark:text-emerald-400">desconto exclusivo de 10%</strong> antes que esta condição expire.
        </p>

        {/* Voucher Box */}
        <div className="my-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0F0E14] border-2 border-dashed border-amber-500/50 flex items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] block">
              Cupom de Cortesia:
            </span>
            <span className="font-mono text-base font-black text-violet-600 dark:text-violet-400 tracking-wider">
              {defaultCouponCode}
            </span>
          </div>

          <div className="text-right">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-[#047857] dark:text-emerald-400 font-extrabold text-xs">
              -10% OFF
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleClaimDiscount}
            className="otter-keep-colors w-full py-4 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-700 hover:to-emerald-600 text-white font-black text-sm uppercase tracking-wide shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all cursor-pointer"
          >
            <span className="text-white">Quero Meu Desconto e Concluir Compra</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="text-xs text-slate-500 dark:text-[#94A3B8] hover:text-slate-800 dark:hover:text-white pt-2 transition-colors cursor-pointer block mx-auto underline"
          >
            Não quero desconto, prefiro pagar o valor integral
          </button>
        </div>
      </div>
    </div>
  );
}
