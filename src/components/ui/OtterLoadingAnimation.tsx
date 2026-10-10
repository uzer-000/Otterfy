'use client';

import React from 'react';

interface Props {
  size?: 'splash' | 'compact' | 'normal';
  idPrefix?: string;
  className?: string;
}

export default function OtterLoadingAnimation({
  size = 'normal',
  idPrefix = 'otter',
  className = '',
}: Props) {
  const sizeClasses =
    size === 'splash'
      ? 'w-[min(54vw,220px)] h-[min(54vw,220px)] sm:w-[220px] sm:h-[220px]'
      : size === 'compact'
      ? 'w-[130px] h-[130px] sm:w-[150px] sm:h-[150px]'
      : 'w-[min(46vw,180px)] h-[min(46vw,180px)] sm:w-[180px] sm:h-[180px]';

  return (
    <div
      className={`otter-new-wrap flex flex-col items-center justify-center gap-5 sm:gap-6 select-none ${className}`}
      role="img"
      aria-label="Carregando Otterfy"
    >
      <div className={`relative ${sizeClasses} flex items-center justify-center`}>
        {/* Soft Purple Backlight Aura */}
        <div className="otter-new-aura" aria-hidden="true" />

        {/* Animated Mascot Group */}
        <div className="otter-new-mascot-group">
          {/* Top Piece (Ears, eyes, snout) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/otter-top.png"
            alt="Otterfy Mascot Top"
            className="otter-new-top object-contain drop-shadow-[0_4px_14px_rgba(123,31,162,0.3)]"
            draggable={false}
          />

          {/* Bottom Piece (Jaw & Chin) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/otter-bot.png"
            alt="Otterfy Mascot Bottom"
            className="otter-new-bot object-contain drop-shadow-[0_4px_14px_rgba(123,31,162,0.3)]"
            draggable={false}
          />

          {/* Electric horizontal slit glow on snap */}
          <div className="otter-new-slit-glow" aria-hidden="true" />

          {/* Luxury Sheen / Light Sweep */}
          <div className="otter-new-shine-layer" aria-hidden="true" />
        </div>
      </div>

      {/* Modern Glowing Progress Bar */}
      <div className="otter-bar" aria-hidden="true">
        <i />
      </div>
    </div>
  );
}

