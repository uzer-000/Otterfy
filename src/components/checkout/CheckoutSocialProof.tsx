'use client';

import React, { useState, useEffect } from 'react';

interface BuyerNotification {
  name: string;
  city: string;
  timeAgo: string;
  method: 'M-Pesa' | 'e-Mola';
}

const RECENT_BUYERS: BuyerNotification[] = [
  { name: 'Celso M.', city: 'Maputo', timeAgo: 'há 3 minutos', method: 'M-Pesa' },
  { name: 'Amina B.', city: 'Matola', timeAgo: 'há 6 minutos', method: 'e-Mola' },
  { name: 'Tomás F.', city: 'Beira', timeAgo: 'há 11 minutos', method: 'M-Pesa' },
  { name: 'Sheila K.', city: 'Nampula', timeAgo: 'há 14 minutos', method: 'e-Mola' },
  { name: 'Edson P.', city: 'Tete', timeAgo: 'há 18 minutos', method: 'M-Pesa' },
  { name: 'Yara C.', city: 'Maputo', timeAgo: 'há 24 minutos', method: 'M-Pesa' },
  { name: 'Inácio D.', city: 'Chimoio', timeAgo: 'há 29 minutos', method: 'e-Mola' },
];

export function CheckoutSocialProofToast() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isDismissed) return;

    // Initial delay before first toast shows (5 seconds)
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    // Rotate every 11 seconds
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % RECENT_BUYERS.length);
        setIsVisible(true);
      }, 800);
    }, 11000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isDismissed]);

  if (isDismissed) return null;

  const currentBuyer = RECENT_BUYERS[currentIndex];

  return (
    <div
      className={`fixed bottom-4 left-4 z-40 max-w-xs sm:max-w-sm transition-all duration-500 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-white/95 dark:bg-[#14121B]/95 backdrop-blur-md border border-slate-200/90 dark:border-[#252033] shadow-xl rounded-2xl p-3 flex items-center gap-3 text-slate-900 dark:text-[#F8FAFC]">
        {/* Buyer avatar initials */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/30 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
          {currentBuyer.name.slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1 text-xs">
          <p className="font-semibold text-slate-800 dark:text-[#F8FAFC] truncate">
            <strong>{currentBuyer.name}</strong> ({currentBuyer.city})
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Comprou {currentBuyer.timeAgo}</span>
            <span>•</span>
            <span className="font-semibold text-slate-600 dark:text-[#CBD5E1]">{currentBuyer.method}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs p-1 cursor-pointer transition-colors"
          aria-label="Fechar notificação"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function CheckoutTrustSignals() {
  return (
    <div className="space-y-2 pt-1 text-center">
      {/* Live viewing badge */}
      <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-slate-100/90 dark:bg-[#0F0E14] border border-slate-200 dark:border-[#1E1B26] text-[11px] font-semibold text-slate-700 dark:text-[#94A3B8]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span>
          <strong className="text-slate-900 dark:text-[#F8FAFC]">14 pessoas</strong> a finalizar a compra agora
        </span>
      </div>

      {/* Reviews rating */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-[#94A3B8]">
        <div className="flex text-amber-400 tracking-tighter text-xs" aria-label="5 de 5 estrelas">
          ★★★★★
        </div>
        <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">4.9/5</span>
        <span>(mais de 280 avaliações de clientes satisfeitos)</span>
      </div>
    </div>
  );
}
