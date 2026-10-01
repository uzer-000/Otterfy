'use client';

import React, { useState, useEffect } from 'react';

export default function DashboardGreetingBanner() {
  const [avatar, setAvatar] = useState<string>('');

  useEffect(() => {
    const updateAvatar = () => {
      const saved = localStorage.getItem('otterfy_profile_avatar');
      setAvatar(saved || '');
    };
    updateAvatar();
    window.addEventListener('profile_updated', updateAvatar);
    window.addEventListener('storage', updateAvatar);
    return () => {
      window.removeEventListener('profile_updated', updateAvatar);
      window.removeEventListener('storage', updateAvatar);
    };
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/30 to-violet-900/40 border border-violet-500/30 flex items-center justify-center text-sm font-black text-violet-300 shadow-md overflow-hidden shrink-0">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="Pedro Hill" className="w-full h-full object-cover" />
          ) : (
            <span>PH</span>
          )}
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight">
            Olá, Pedro Hill
          </h1>
          <p className="text-xs text-[#64748B] mt-1 font-normal tracking-tight">
            Visão geral de sua operação e faturamento em tempo real
          </p>
        </div>
      </div>
    </div>
  );
}
