'use client';

import React, { useState, useEffect } from 'react';

interface Props {
  productId: string;
  timerMinutes?: number;
  timerText?: string;
}

export default function CheckoutUrgencyTimer({
  productId,
  timerMinutes = 10,
  timerText = 'Oferta expira em',
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
        return 0; // Trava em 00:00 se o tempo já tiver esgotado
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
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');
  const timeString = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;

  return (
    <div className="w-full bg-[#EF4444] text-white py-2.5 px-4 text-center text-xs sm:text-sm font-bold tracking-wide shadow-sm flex items-center justify-center gap-1.5 animate-fadeIn">
      <span>{timerText || 'Oferta expira em'}</span>
      <span className="font-mono font-black text-xs sm:text-sm tracking-wider">
        {timeString}
      </span>
    </div>
  );
}
