'use client';

import React, { useState, useEffect } from 'react';

export default function DashboardGreetingBanner() {
  const [avatar, setAvatar] = useState<string>('');

  useEffect(() => {
    const updateAvatarFromStorage = () => {
      const saved = localStorage.getItem('otterfy_profile_avatar');
      setAvatar(saved || '');
    };
    updateAvatarFromStorage();

    const syncProfileFromCloud = () => {
      fetch('/api/user/profile', { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => {
          const cloudAvatar =
            d.avatarImage !== undefined
              ? d.avatarImage
              : d.profile?.avatarImage !== undefined
              ? d.profile.avatarImage
              : d.user?.avatarImage;
          if (cloudAvatar && typeof cloudAvatar === 'string' && cloudAvatar.length > 10) {
            setAvatar(cloudAvatar);
            localStorage.setItem('otterfy_profile_avatar', cloudAvatar);
          } else {
            const localSaved = localStorage.getItem('otterfy_profile_avatar');
            if (localSaved && localSaved.length > 10) {
              setAvatar(localSaved);
              fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatarImage: localSaved }),
              }).catch(() => {});
            } else {
              setAvatar('');
            }
          }
        })
        .catch(() => {});
    };

    // Fetch once on mount; updates propagate via profile_updated / storage events
    syncProfileFromCloud();

    window.addEventListener('profile_updated', updateAvatarFromStorage);
    window.addEventListener('storage', updateAvatarFromStorage);

    return () => {
      window.removeEventListener('profile_updated', updateAvatarFromStorage);
      window.removeEventListener('storage', updateAvatarFromStorage);
    };
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/20 to-violet-700/30 dark:from-violet-600/30 dark:to-violet-900/40 border border-violet-500/30 flex items-center justify-center text-sm font-black text-violet-700 dark:text-violet-300 shadow-md overflow-hidden shrink-0">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="Pedro Hill" className="w-full h-full object-cover" />
          ) : (
            <span>PH</span>
          )}
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#F8FAFC] tracking-tight">
            Olá, Pedro Hill
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#64748B] mt-1 font-normal tracking-tight">
            Visão geral de sua operação e faturamento em tempo real
          </p>
        </div>
      </div>
    </div>
  );
}
