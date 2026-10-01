'use client';

import React, { useState, useEffect } from 'react';

interface Props {
  productId: string;
  timerMinutes?: number;
  timerText?: string;
}

export default function CheckoutUrgencyTimer({
  productId,
  timerMinutes = 6,
  timerText = 'Esta oferta especial termina em:',
}: Props) {
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (typeof window === 'undefined') return timerMinutes * 60;
    try {
      const storageKey = `otterfy_timer_${productId}`;
      const savedEndTime = sessionStorage.getItem(storageKey);
      const now = Math.floor(Date.now() / 1000);

      if (savedEndTime) {
        const remaining = parseInt(savedEndTime, 10) - now;
        if (remaining > 0) return remaining;
        return 0; // Fica em 00:00 se o tempo já tiver esgotado, sem reiniciar
      }

      const newEndTime = now + timerMinutes * 60;
      sessionStorage.setItem(storageKey, newEndTime.toString());
      return timerMinutes * 60;
    } catch {
      return timerMinutes * 60;
    }
  });

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0; // Trava em 00:00 e permanece até o comprador finalizar
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  return (
    <div className="w-full rounded-2xl bg-gradient-to-r from-red-600/15 via-[#181014] to-red-600/15 border border-red-500/40 p-3 sm:p-3.5 shadow-[0_0_20px_rgba(239,68,68,0.12)] flex items-center justify-between gap-3 text-xs animate-fadeIn">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative flex items-center justify-center shrink-0 w-8 h-8 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm">
          <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping opacity-75" />
          <span className="absolute -top-1 -right-1 w-2 rounded-full h-2 bg-red-500" />
        </div>
        <div className="truncate">
          <span className="font-bold text-[#F8FAFC] tracking-tight block truncate">
            {timerText}
          </span>
          <span className="text-[11px] text-red-200/80 block truncate font-medium">
            {timeLeft === 0
              ? 'Tempo encerrado! Garanta antes que o estoque acabe.'
              : 'Garanta seu acesso com desconto antes que o tempo esgote'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 font-mono font-black text-red-400 bg-[#0F0E14] px-3.5 py-1.5 rounded-xl border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
        <span className="text-sm sm:text-base font-black">{formattedMinutes}</span>
        <span className="text-xs text-red-500 animate-pulse font-black">:</span>
        <span className="text-sm sm:text-base font-black">{formattedSeconds}</span>
      </div>
    </div>
  );
}
