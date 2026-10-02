'use client';

import React, { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'payout' | 'notifications' | 'security'>('payout');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile States
  const [storeName, setStoreName] = useState('Minha Loja Digital');
  const [ownerName, setOwnerName] = useState('Administrador Otterfy');
  const [supportEmail, setSupportEmail] = useState('suporte@minhaloja.co.mz');
  const [supportPhone, setSupportPhone] = useState('+258 84 000 0000');

  // Payout States (Carteiras Moçambicanas)
  const [payoutMethod, setPayoutMethod] = useState<'MPESA' | 'EMOLA' | 'BANK'>('MPESA');
  const [mpesaNumber, setMpesaNumber] = useState('841234567');
  const [emolaNumber, setEmolaNumber] = useState('861234567');
  const [bankName, setBankName] = useState('Millennium BIM');
  const [bankHolder, setBankHolder] = useState('Administrador Otterfy');
  const [bankNib, setBankNib] = useState('0001 0000 1234 5678 9012 3');

  // Notifications
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(true);
  const [avatarImage, setAvatarImage] = useState<string>('');

  // Load from API & localStorage
  useEffect(() => {
    try {
      const savedAvatar = localStorage.getItem('otterfy_profile_avatar');
      if (savedAvatar) setAvatarImage(savedAvatar);

      fetch('/api/user/profile')
        .then((r) => r.json())
        .then((d) => {
          if (d.profile) {
            if (d.profile.avatarImage) {
              setAvatarImage(d.profile.avatarImage);
              localStorage.setItem('otterfy_profile_avatar', d.profile.avatarImage);
            }
            if (d.profile.name) setOwnerName(d.profile.name);
            if (d.profile.phone) setSupportPhone(d.profile.phone);
          }
        })
        .catch(() => {});

      const saved = localStorage.getItem('otterfy-settings-v1');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.storeName) setStoreName(data.storeName);
        if (data.ownerName) setOwnerName(data.ownerName);
        if (data.supportPhone) setSupportPhone(data.supportPhone);
        if (data.payoutMethod) setPayoutMethod(data.payoutMethod);
        if (data.mpesaNumber) setMpesaNumber(data.mpesaNumber);
        if (data.emolaNumber) setEmolaNumber(data.emolaNumber);
        if (data.bankNib) setBankNib(data.bankNib);
        if (data.soundEnabled !== undefined) setSoundEnabled(data.soundEnabled);
      }
    } catch {}
  }, []);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setToastMessage('A foto deve ter no máximo 2MB.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setAvatarImage(base64);
      localStorage.setItem('otterfy_profile_avatar', base64);

      try {
        await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarImage: base64, name: ownerName, phone: supportPhone }),
        });
      } catch {}

      window.dispatchEvent(new Event('profile_updated'));
      window.dispatchEvent(new Event('storage'));
      setToastMessage('Foto de perfil salva com sucesso!');
      setTimeout(() => setToastMessage(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    setAvatarImage('');
    localStorage.removeItem('otterfy_profile_avatar');
    try {
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarImage: '', name: ownerName, phone: supportPhone }),
      });
    } catch {}
    window.dispatchEvent(new Event('profile_updated'));
    window.dispatchEvent(new Event('storage'));
    setToastMessage('Foto de perfil removida.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = async () => {
    const data = {
      storeName,
      ownerName,
      supportEmail,
      supportPhone,
      payoutMethod,
      mpesaNumber,
      emolaNumber,
      bankName,
      bankHolder,
      bankNib,
      soundEnabled,
      browserNotifications,
      whatsappNotifications,
      avatarImage,
    };
    localStorage.setItem('otterfy-settings-v1', JSON.stringify(data));
    localStorage.setItem('otterfy_profile_avatar', avatarImage || '');

    try {
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarImage, name: ownerName, phone: supportPhone }),
      });
    } catch {}

    window.dispatchEvent(new Event('profile_updated'));
    window.dispatchEvent(new Event('storage'));
    setToastMessage('Configurações salvas com sucesso!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-[#121016] border border-emerald-500/50 shadow-2xl text-emerald-300 text-sm flex items-center gap-3 animate-fadeIn">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-[#94A3B8] hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-violet-600/15 border border-violet-500/25 flex items-center justify-center text-violet-400 text-lg">
          ⚙️
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight">Configurações da Conta</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Gerencie os dados da sua loja, contas de saque M-Pesa / e-Mola e preferências do sistema
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1E1B26] gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('payout')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'payout'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span>Conta para Saque & Liquidação</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300">Essencial</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'profile'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          Perfil & Loja
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'notifications'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          Sons & Notificações
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'security'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          Segurança
        </button>
      </div>

      {/* TAB: DADOS DE SAQUE (PAYOUT) */}
      {activeTab === 'payout' && (
        <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div>
            <h3 className="text-lg font-bold text-white">Onde você deseja receber os seus saques?</h3>
            <p className="text-xs text-[#94A3B8] mt-1">
              Os lucros de suas vendas em Meticais (MZN) serão transferidos automaticamente para esta conta quando solicitar um saque.
            </p>
          </div>

          {/* Payout Method Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: 'MPESA', name: 'M-Pesa (Vodacom)', sub: 'Transferência Instantânea', img: '/gateways/Mpesa.png' },
              { id: 'EMOLA', name: 'e-Mola (Movitel)', sub: 'Transferência Instantânea', img: '/gateways/emola.png' },
              { id: 'BANK', name: 'Conta Bancária (NIB)', sub: 'BIM, BCI, Standard Bank', isBank: true },
            ].map((method) => (
              <div
                key={method.id}
                onClick={() => setPayoutMethod(method.id as any)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                  payoutMethod === method.id
                    ? 'bg-violet-600/15 border-violet-500 text-white shadow-lg shadow-violet-500/10'
                    : 'bg-[#0F0E14] border-[#1E1B26] text-[#94A3B8] hover:border-violet-500/30'
                }`}
              >
                {method.img ? (
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                    <img src={method.img} alt={method.name} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-white">{method.name}</h4>
                  <span className="text-[11px] text-[#64748B] block mt-0.5">{method.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Conditional Input Fields */}
          <div className="pt-2 space-y-4">
            {payoutMethod === 'MPESA' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                  Número de Telemóvel M-Pesa Registado no seu BI/NUIT *
                </label>
                <div className="relative max-w-md">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-violet-400 font-bold text-xs">+258</span>
                  <input
                    type="text"
                    value={mpesaNumber}
                    onChange={(e) => setMpesaNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl pl-16 pr-4 py-3 text-sm text-white font-mono focus:outline-none"
                    placeholder="84 / 85 XXX XXXX"
                  />
                </div>
                <span className="text-[11px] text-[#64748B] block mt-1">
                  Saques mínimos: <strong className="text-white">500,00 MT</strong>. Crédito direto na carteira Vodacom.
                </span>
              </div>
            )}

            {payoutMethod === 'EMOLA' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                  Número de Telemóvel e-Mola Registado *
                </label>
                <div className="relative max-w-md">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-violet-400 font-bold text-xs">+258</span>
                  <input
                    type="text"
                    value={emolaNumber}
                    onChange={(e) => setEmolaNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl pl-16 pr-4 py-3 text-sm text-white font-mono focus:outline-none"
                    placeholder="86 / 87 XXX XXXX"
                  />
                </div>
                <span className="text-[11px] text-[#64748B] block mt-1">
                  Saques mínimos: <strong className="text-white">500,00 MT</strong>. Crédito direto na carteira Movitel.
                </span>
              </div>
            )}

            {payoutMethod === 'BANK' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                    Banco
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                  >
                    <option value="Millennium BIM">Millennium BIM</option>
                    <option value="BCI">BCI (Banco Comercial e de Investimentos)</option>
                    <option value="Standard Bank">Standard Bank Moçambique</option>
                    <option value="Moza Banco">Moza Banco</option>
                    <option value="Absa Bank">Absa Bank Moçambique</option>
                    <option value="FNB Moçambique">FNB Moçambique</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                    Nome do Titular da Conta
                  </label>
                  <input
                    type="text"
                    value={bankHolder}
                    onChange={(e) => setBankHolder(e.target.value)}
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                    NIB (Número de Identificação Bancária - 21 dígitos)
                  </label>
                  <input
                    type="text"
                    value={bankNib}
                    onChange={(e) => setBankNib(e.target.value)}
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none"
                    placeholder="0001 0000 1234 5678 9012 3"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#1E1B26]">
            <button
              type="button"
              onClick={handleSave}
              className="laser-button px-6 py-3 text-xs font-bold text-white rounded-xl cursor-pointer"
            >
              Salvar Dados de Saque
            </button>
          </div>
        </div>
      )}

      {/* TAB: PERFIL & LOJA */}
      {activeTab === 'profile' && (
        <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div>
            <h3 className="text-lg font-bold text-white">Informações da Loja e do Criador</h3>
            <p className="text-xs text-[#94A3B8] mt-1">
              Estes dados serão apresentados nos recibos e no topo do seu checkout personalizado.
            </p>
          </div>

          {/* Foto de Perfil do Usuário / Administrador */}
          <div className="p-5 rounded-2xl bg-[#0F0E14] border border-[#1E1B26] flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/30 to-violet-900/40 border-2 border-violet-500/40 flex items-center justify-center overflow-hidden shadow-xl">
                {avatarImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarImage} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-violet-300">AD</span>
                )}
              </div>
              <label 
                htmlFor="avatar-upload" 
                className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] font-bold text-white rounded-2xl cursor-pointer transition-opacity backdrop-blur-xs"
                title="Clique para alterar a foto"
              >
                <span>Alterar</span>
              </label>
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarUpload} 
              />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h4 className="text-sm font-bold text-white">Foto de Perfil Oficial</h4>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-600/20 text-violet-300 border border-violet-500/30">
                  Avatar
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed max-w-lg">
                Envie uma foto em formato JPG, PNG ou WEBP (máx. 2MB). A sua foto será exibida no topo do painel, no menu lateral e no seu perfil do administrador.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-1">
                <label 
                  htmlFor="avatar-upload-btn" 
                  className="px-3.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Carregar Nova Foto
                </label>
                <input 
                  id="avatar-upload-btn" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarUpload} 
                />
                {avatarImage && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Remover Foto
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Nome de Exibição da Loja
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Nome do Produtor / Responsável
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Email de Suporte ao Cliente
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                WhatsApp Oficial de Suporte
              </label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#1E1B26]">
            <button
              type="button"
              onClick={handleSave}
              className="laser-button px-6 py-3 text-xs font-bold text-white rounded-xl cursor-pointer"
            >
              Salvar Alterações do Perfil
            </button>
          </div>
        </div>
      )}

      {/* TAB: SONS & NOTIFICAÇÕES */}
      {activeTab === 'notifications' && (
        <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div>
            <h3 className="text-lg font-bold text-white">Alertas de Vendas e Sons</h3>
            <p className="text-xs text-[#94A3B8] mt-1">
              Personalize a sua experiência ao receber vendas aprovadas no painel.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0F0E14] border border-[#1E1B26]">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>Som de Venda Aprovada (Ka-Ching)</span>
                </h4>
                <p className="text-xs text-[#94A3B8]">
                  Toca o som característico de caixa registradora sempre que um pagamento M-Pesa/e-Mola for aprovado.
                </p>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-5 h-5 text-violet-600 rounded focus:ring-violet-500 cursor-pointer accent-violet-600"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0F0E14] border border-[#1E1B26]">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.301-.15-1.777-.877-2.052-.977-.276-.101-.477-.15-.678.15-.2.3-.778.977-.954 1.178-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.5-1.786-1.676-2.087-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.301-.501.101-.2.05-.376-.025-.526-.075-.15-.678-1.631-.93-2.235-.245-.589-.494-.509-.678-.519-.176-.01-.376-.01-.577-.01-.2 0-.527.075-.803.376s-1.054 1.029-1.054 2.509 1.079 2.91 1.229 3.111c.15.201 2.124 3.243 5.145 4.549.718.311 1.279.497 1.716.636.721.229 1.377.197 1.895.12.577-.087 1.777-.727 2.028-1.429.25-.702.25-1.303.175-1.429-.075-.126-.276-.201-.577-.351zM12 21.82c-1.782 0-3.48-.466-4.966-1.28l-.356-.197-3.69 1.018 1.002-3.582-.232-.37C3.003 16.035 2.5 14.07 2.5 12c0-5.238 4.262-9.5 9.5-9.5 2.538 0 4.924.988 6.718 2.782A9.444 9.444 0 0121.5 12c0 5.238-4.262 9.5-9.5 9.5z"/>
                  </svg>
                  <span>Disparar Notificação no WhatsApp do Produtor</span>
                </h4>
                <p className="text-xs text-[#94A3B8]">
                  Receba uma mensagem instantânea no seu número sempre que uma nova venda cair na sua conta.
                </p>
              </div>
              <input
                type="checkbox"
                checked={whatsappNotifications}
                onChange={(e) => setWhatsappNotifications(e.target.checked)}
                className="w-5 h-5 text-violet-600 rounded focus:ring-violet-500 cursor-pointer accent-violet-600"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0F0E14] border border-[#1E1B26]">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Notificações Push do Navegador</span>
                </h4>
                <p className="text-xs text-[#94A3B8]">
                  Exibe o pop-up nativo do Windows/Mac mesmo se estiver trabalhando em outra aba.
                </p>
              </div>
              <input
                type="checkbox"
                checked={browserNotifications}
                onChange={(e) => setBrowserNotifications(e.target.checked)}
                className="w-5 h-5 text-violet-600 rounded focus:ring-violet-500 cursor-pointer accent-violet-600"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#1E1B26]">
            <button
              type="button"
              onClick={handleSave}
              className="laser-button px-6 py-3 text-xs font-bold text-white rounded-xl cursor-pointer"
            >
              Salvar Preferências
            </button>
          </div>
        </div>
      )}

      {/* TAB: SEGURANÇA */}
      {activeTab === 'security' && (
        <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl max-w-xl">
          <div>
            <h3 className="text-lg font-bold text-white">Segurança & Acesso</h3>
            <p className="text-xs text-[#94A3B8] mt-1">
              Mantenha a sua conta Otterfy protegida.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Senha Atual
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Nova Senha
              </label>
              <input
                type="password"
                placeholder="Mínimo de 8 caracteres"
                className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#1E1B26]">
            <button
              type="button"
              onClick={handleSave}
              className="laser-button px-6 py-2.5 text-xs font-bold text-white rounded-xl cursor-pointer"
            >
              Atualizar Senha
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
