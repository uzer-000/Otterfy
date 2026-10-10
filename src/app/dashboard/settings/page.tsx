'use client';

import React, { useState, useEffect } from 'react';

interface DeviceItem {
  id: string;
  name: string;
  type: 'mobile' | 'desktop';
  browser: string;
  lastActive: string;
  ip: string;
}

export default function AccountSettingsPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Informações Pessoais
  const [fullName, setFullName] = useState('Pedro Filipe');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('nhacossfilipe@gmail.com');
  const [countryCode, setCountryCode] = useState('+258');
  const [phone, setPhone] = useState('84 000 0000');

  // Emails de Suporte
  const [supportEmails, setSupportEmails] = useState<string[]>([]);
  const [isAddEmailModalOpen, setIsAddEmailModalOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');

  // Idioma
  const [selectedLanguage, setSelectedLanguage] = useState<'pt-BR' | 'en-US' | 'es-ES'>('pt-BR');

  // Login Apple
  const [isAppleLinked, setIsAppleLinked] = useState(false);

  // Dispositivos conectados
  const [devices, setDevices] = useState<DeviceItem[]>([
    {
      id: 'dev-1',
      name: 'Android - Chrome',
      type: 'mobile',
      browser: 'Chrome Mobile',
      lastActive: '3d atrás',
      ip: '197.235.12.84 (Maputo, MZ)',
    },
    {
      id: 'dev-2',
      name: 'Windows - Chrome',
      type: 'desktop',
      browser: 'Chrome 122',
      lastActive: '15 de mar. de 2026',
      ip: '102.134.88.19 (Matola, MZ)',
    },
  ]);
  const [activeIpModal, setActiveIpModal] = useState<string | null>(null);

  // Alteração de Senha
  const [passwordSent, setPasswordSent] = useState(false);

  // Preferências de Notificação (Accordions)
  const [accordionOpen, setAccordionOpen] = useState<{ [key: string]: boolean }>({
    gateways: false,
    support: false,
    news: false,
  });

  const [notifSettings, setNotifSettings] = useState({
    gatewayErrors: { email: true, push: true, sms: false },
    supportTickets: { email: true, push: true, sms: false },
    newsAndPromos: { dashboard: true, email: true, sms: false },
  });

  // Zona Perigosa (Delete modal)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');

  // Sincronizar com perfil salvo
  useEffect(() => {
    try {
      const saved = localStorage.getItem('otterfy_user_account_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.nickname) setNickname(parsed.nickname);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.countryCode) setCountryCode(parsed.countryCode);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.supportEmails) setSupportEmails(parsed.supportEmails);
        if (parsed.selectedLanguage) setSelectedLanguage(parsed.selectedLanguage);
      } else {
        // Tentar obter da API
        fetch('/api/user/profile')
          .then((res) => res.json())
          .then((d) => {
            if (d.profile) {
              if (d.profile.name) setFullName(d.profile.name);
              if (d.profile.phone) setPhone(d.profile.phone);
            }
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSavePersonalInfo = async () => {
    try {
      const payload = {
        fullName,
        nickname,
        email,
        countryCode,
        phone,
        supportEmails,
        selectedLanguage,
      };
      localStorage.setItem('otterfy_user_account_settings', JSON.stringify(payload));

      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName, phone: `${countryCode} ${phone}` }),
      }).catch(() => {});

      window.dispatchEvent(new Event('profile_updated'));
      showToast('Alterações salvas com sucesso!');
    } catch {
      showToast('Erro ao salvar informações.');
    }
  };

  const handleCancelPersonalInfo = () => {
    try {
      const saved = localStorage.getItem('otterfy_user_account_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFullName(parsed.fullName || 'Pedro Filipe');
        setNickname(parsed.nickname || '');
        setEmail(parsed.email || 'nhacossfilipe@gmail.com');
        setCountryCode(parsed.countryCode || '+258');
        setPhone(parsed.phone || '84 000 0000');
      }
    } catch {}
    showToast('Alterações canceladas.');
  };

  const handleAddSupportEmail = () => {
    const clean = newEmailInput.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      showToast('Insira um e-mail válido.');
      return;
    }
    if (supportEmails.includes(clean)) {
      showToast('Este e-mail já foi adicionado.');
      return;
    }
    const updated = [...supportEmails, clean];
    setSupportEmails(updated);
    setNewEmailInput('');
    setIsAddEmailModalOpen(false);
    showToast('Email de suporte adicionado!');
  };

  const handleRemoveSupportEmail = (em: string) => {
    setSupportEmails(supportEmails.filter((item) => item !== em));
    showToast('Email de suporte removido.');
  };

  const handleRemoveDevice = (id: string) => {
    setDevices(devices.filter((d) => d.id !== id));
    showToast('Dispositivo desconectado com sucesso.');
  };

  const handlePasswordReset = () => {
    setPasswordSent(true);
    showToast(`Link de recuperação enviado para ${email}`);
    setTimeout(() => setPasswordSent(false), 5000);
  };

  const toggleAccordion = (key: string) => {
    setAccordionOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn text-[#F8FAFC]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#16141D] text-white px-5 py-3 rounded-2xl border border-[#7C3AED]/40 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <span className="text-emerald-400">✓</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HEADER DA PÁGINA                                                          */}
      {/* ========================================================================= */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Configurações da Conta
        </h1>
        <p className="text-sm text-[var(--text-secondary)] font-normal">
          Gerencie suas informações pessoais e de contato
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 1. SEÇÃO: INFORMAÇÕES PESSOAIS                                            */}
      {/* ========================================================================= */}
      <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-7 space-y-6 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
            Informações Pessoais
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            Atualize seus dados pessoais e de contato
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Nome completo */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Nome completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#7C3AED] transition-colors"
            />
          </div>

          {/* Apelido */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Apelido
            </label>
            <input
              type="text"
              placeholder="Como você gostaria de ser chamado"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#7C3AED] transition-colors"
            />
          </div>

          {/* E-mail */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#7C3AED] transition-colors"
            />
          </div>

          {/* Telefone com prefixo */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Telefone
            </label>
            <div className="flex rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] focus-within:border-[#7C3AED] overflow-hidden transition-colors">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-transparent px-3 text-xs sm:text-sm font-medium text-[var(--text-primary)] border-r border-[var(--border-color)] focus:outline-none cursor-pointer"
              >
                <option value="+258" className="bg-[#121016] text-white">🇲🇿 +258</option>
                <option value="+351" className="bg-[#121016] text-white">🇵🇹 +351</option>
                <option value="+55" className="bg-[#121016] text-white">🇧🇷 +55</option>
                <option value="+1" className="bg-[#121016] text-white">🇺🇸 +1</option>
              </select>
              <div className="flex items-center pl-3 pr-2 text-xs text-[var(--text-muted)]">
                <svg className="w-4 h-4 mr-1 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-11 px-3 bg-transparent text-sm text-[var(--text-primary)] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSavePersonalInfo}
            className="px-5 py-2.5 rounded-xl bg-white text-gray-900 dark:bg-white dark:text-gray-900 font-bold text-xs sm:text-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            Salvar alterações
          </button>
          <button
            type="button"
            onClick={handleCancelPersonalInfo}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] active:scale-95 transition-all cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SEÇÃO: EMAILS DE SUPORTE                                               */}
      {/* ========================================================================= */}
      <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-7 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              Emails de Suporte
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Gerencie os emails de contato que aparecem nos seus produtos
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddEmailModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white text-gray-900 dark:bg-white dark:text-gray-900 font-bold text-xs sm:text-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer self-start sm:self-auto shadow-sm"
          >
            <span>+</span>
            <span>Adicionar Email</span>
          </button>
        </div>

        {supportEmails.length === 0 ? (
          <div className="py-12 px-4 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-input)]/50 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] text-xl">
              ✉️
            </div>
            <div className="space-y-1 max-w-md">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                Nenhum email de suporte cadastrado
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Adicione emails de suporte para usar em seus produtos. Os clientes verão essas informações no email de entrega.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {supportEmails.map((em) => (
              <div
                key={em}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)]"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-base">✉️</span>
                  <span className="text-sm font-medium text-[var(--text-primary)] truncate">{em}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSupportEmail(em)}
                  className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/20 transition-colors"
                  title="Remover email"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. SEÇÃO: IDIOMA                                                          */}
      {/* ========================================================================= */}
      <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-7 space-y-5 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
            Idioma
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            Escolha o idioma de preferência para a interface
          </p>
        </div>

        <div className="space-y-2.5">
          {/* Português */}
          <button
            type="button"
            onClick={() => setSelectedLanguage('pt-BR')}
            className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all text-left cursor-pointer ${
              selectedLanguage === 'pt-BR'
                ? 'border-white/80 bg-white/5 text-[var(--text-primary)] ring-1 ring-white/20'
                : 'border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-color)]">
                BR
              </span>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">Português</p>
                <p className="text-xs text-[var(--text-muted)]">Português (Brasil)</p>
              </div>
            </div>
            {selectedLanguage === 'pt-BR' && (
              <span className="w-5 h-5 rounded-full bg-white text-gray-900 flex items-center justify-center text-xs font-bold">
                ✓
              </span>
            )}
          </button>

          {/* Inglês */}
          <button
            type="button"
            onClick={() => setSelectedLanguage('en-US')}
            className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all text-left cursor-pointer ${
              selectedLanguage === 'en-US'
                ? 'border-white/80 bg-white/5 text-[var(--text-primary)] ring-1 ring-white/20'
                : 'border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-color)]">
                US
              </span>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">English</p>
                <p className="text-xs text-[var(--text-muted)]">English (US)</p>
              </div>
            </div>
            {selectedLanguage === 'en-US' && (
              <span className="w-5 h-5 rounded-full bg-white text-gray-900 flex items-center justify-center text-xs font-bold">
                ✓
              </span>
            )}
          </button>

          {/* Espanhol */}
          <button
            type="button"
            onClick={() => setSelectedLanguage('es-ES')}
            className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all text-left cursor-pointer ${
              selectedLanguage === 'es-ES'
                ? 'border-white/80 bg-white/5 text-[var(--text-primary)] ring-1 ring-white/20'
                : 'border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-color)]">
                ES
              </span>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">Español</p>
                <p className="text-xs text-[var(--text-muted)]">Español (España)</p>
              </div>
            </div>
            {selectedLanguage === 'es-ES' && (
              <span className="w-5 h-5 rounded-full bg-white text-gray-900 flex items-center justify-center text-xs font-bold">
                ✓
              </span>
            )}
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SEÇÃO: MÉTODOS DE LOGIN CONECTADOS                                     */}
      {/* ========================================================================= */}
      <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-7 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              Métodos de login conectados
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Conecte serviços externos para entrar mais rápido. Sign in with Apple respeita sua privacidade. Você pode esconder seu e-mail real.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsAppleLinked(!isAppleLinked);
              showToast(isAppleLinked ? 'Conta Apple desconectada.' : 'Conta Apple vinculada com sucesso!');
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-gray-900 dark:bg-white dark:text-gray-900 font-bold text-xs sm:text-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer shrink-0 shadow-sm"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.73-7.98-12.12-14.7-6.2-9.48-11.05-20.5-14.54-33.05-3.5-12.55-5.25-24.3-5.25-35.25 0-14.93 3.65-27.46 10.95-37.59 7.3-10.13 16.63-15.34 27.99-15.63 4.89 0 10.19 1.25 15.89 3.75 5.71 2.5 9.77 3.8 12.18 3.91 2.07-.11 6.31-1.46 12.74-4.05 6.42-2.6 11.77-3.8 16.05-3.6 12.07.72 21.72 5.14 28.96 13.25-10.65 6.45-15.86 15.36-15.63 26.74.23 9.07 3.75 16.71 10.56 22.92 6.81 6.21 15.01 9.75 24.6 10.63-2.17 6.42-4.78 12.87-7.83 19.34zM119.22 31.85c0-7.39 2.65-14.18 7.95-20.37 5.3-6.19 11.95-10.02 19.95-11.48.23 1.09.35 2.17.35 3.26 0 7.39-2.76 14.28-8.28 20.67-5.52 6.39-12.18 10.15-19.97 11.28v-3.36z" />
            </svg>
            <span>{isAppleLinked ? 'Desvincular Apple' : 'Vincular com a Apple'}</span>
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          {isAppleLinked ? 'Vinculado com ID Apple' : 'Não vinculado'}
        </p>
      </section>

      {/* ========================================================================= */}
      {/* 5. SEÇÃO: VERIFICAÇÃO DA CONTA                                            */}
      {/* ========================================================================= */}
      <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-7 space-y-4 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
            Verificação da conta
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            Confirme email e telefone para publicar checkouts, lojas e quizzes.
          </p>
        </div>

        <div className="space-y-3 pt-1">
          {/* Email */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-[var(--text-secondary)]">Email</span>
              <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">{email}</span>
            </div>
            <span className="text-xs text-[var(--text-muted)] font-medium self-end sm:self-auto">
              Verificado em 22 de mai. de 2026
            </span>
          </div>

          {/* Telefone */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-[var(--text-secondary)]">Telefone</span>
              <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">{countryCode} {phone}</span>
            </div>
            <span className="text-xs text-[var(--text-muted)] font-medium self-end sm:self-auto">
              Verificado em 22 de mai. de 2026
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. GRID: NOTIFICAÇÕES (DISPOSITIVOS) & ALTERAÇÃO DE SENHA                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notificações / Dispositivos Conectados */}
        <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] p-6 space-y-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                Notificações
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                Gerencie os dispositivos que recebem notificações
              </p>
            </div>

            <div className="flex items-center justify-between pb-1 border-b border-[var(--border-color)]">
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)]">Dispositivos Conectados</h4>
                <p className="text-xs text-[var(--text-muted)]">
                  {devices.length} {devices.length === 1 ? 'dispositivo recebendo notificações' : 'dispositivos recebendo notificações'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined' && (window as any).triggerSaleNotification) {
                      (window as any).triggerSaleNotification(197);
                      showToast('Notificação enviada: Venda Aprovada | Valor : Mzn 197');
                    } else {
                      showToast('Notificação enviada!');
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 border border-violet-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                  title="Testar notificação no dispositivo"
                >
                  <span>🔔</span>
                  <span>Testar Notificação</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast('Lista de dispositivos atualizada!')}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                  title="Atualizar"
                >
                  🔄
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {devices.map((dev) => (
                <div
                  key={dev.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {dev.type === 'mobile' ? '📱' : '🖥️'}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">{dev.name}</p>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
                        <span>Última atividade: {dev.lastActive}</span>
                        <button
                          type="button"
                          onClick={() => setActiveIpModal(dev.ip)}
                          className="hover:underline text-[#7C3AED]"
                        >
                          &gt; Ver IP
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveDevice(dev.id)}
                    className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/20 transition-colors"
                    title="Remover dispositivo"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)]/70 text-xs text-[var(--text-secondary)] leading-relaxed">
            💡 <strong className="text-[var(--text-primary)]">Dica:</strong> Você receberá notificações em todos os dispositivos conectados. Remova dispositivos que não usa mais para evitar notificações duplicadas.
          </div>
        </section>

        {/* Alteração de Senha */}
        <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] p-6 space-y-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                Alteração de Senha
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                Receba um e-mail para redefinir sua senha
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] space-y-3">
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Ao clicar no botão abaixo, enviaremos um link de segurança para <strong className="text-[var(--text-primary)]">{email}</strong> com as instruções para definir sua nova senha.
              </p>

              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={passwordSent}
                className="w-full py-3 px-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] font-bold text-xs sm:text-sm text-[var(--text-primary)] active:scale-95 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {passwordSent ? 'E-mail enviado! Verifique sua caixa.' : 'Alterar Senha'}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)]/70 text-xs text-[var(--text-secondary)] leading-relaxed">
            🔒 Sua conta utiliza criptografia padrão bancário. Nunca compartilhe links de redefinição com terceiros.
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 7. SEÇÃO: PREFERÊNCIAS DE NOTIFICAÇÃO (ACCORDIONS)                        */}
      {/* ========================================================================= */}
      <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-7 space-y-5 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
            Preferências de notificação
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            Escolha quais alertas você quer receber
          </p>
        </div>

        <div className="space-y-3">
          {/* Erros de configuração de gateways */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAccordion('gateways')}
              className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  Erros de configuração de gateways
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {notifSettings.gatewayErrors.email && notifSettings.gatewayErrors.push ? 'Tudo ligado' : 'Personalizado'}
                </p>
              </div>
              <span className={`text-xs text-[var(--text-muted)] transition-transform duration-200 ${accordionOpen.gateways ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {accordionOpen.gateways && (
              <div className="p-4 pt-1 border-t border-[var(--border-color)] space-y-3 text-xs sm:text-sm">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[var(--text-secondary)]">Notificações por E-mail</span>
                  <input
                    type="checkbox"
                    checked={notifSettings.gatewayErrors.email}
                    onChange={(e) =>
                      setNotifSettings({
                        ...notifSettings,
                        gatewayErrors: { ...notifSettings.gatewayErrors, email: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-[#7C3AED]"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[var(--text-secondary)]">Push no Celular / Painel</span>
                  <input
                    type="checkbox"
                    checked={notifSettings.gatewayErrors.push}
                    onChange={(e) =>
                      setNotifSettings({
                        ...notifSettings,
                        gatewayErrors: { ...notifSettings.gatewayErrors, push: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-[#7C3AED]"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Chamados de suporte */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAccordion('support')}
              className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  Chamados de suporte
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {notifSettings.supportTickets.email && notifSettings.supportTickets.push ? 'Tudo ligado' : 'Personalizado'}
                </p>
              </div>
              <span className={`text-xs text-[var(--text-muted)] transition-transform duration-200 ${accordionOpen.support ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {accordionOpen.support && (
              <div className="p-4 pt-1 border-t border-[var(--border-color)] space-y-3 text-xs sm:text-sm">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[var(--text-secondary)]">Notificações por E-mail</span>
                  <input
                    type="checkbox"
                    checked={notifSettings.supportTickets.email}
                    onChange={(e) =>
                      setNotifSettings({
                        ...notifSettings,
                        supportTickets: { ...notifSettings.supportTickets, email: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-[#7C3AED]"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[var(--text-secondary)]">Push no Celular / Painel</span>
                  <input
                    type="checkbox"
                    checked={notifSettings.supportTickets.push}
                    onChange={(e) =>
                      setNotifSettings({
                        ...notifSettings,
                        supportTickets: { ...notifSettings.supportTickets, push: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-[#7C3AED]"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Novidades e promoções */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAccordion('news')}
              className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  Novidades e promoções
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  No painel e E-mail ligados
                </p>
              </div>
              <span className={`text-xs text-[var(--text-muted)] transition-transform duration-200 ${accordionOpen.news ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {accordionOpen.news && (
              <div className="p-4 pt-1 border-t border-[var(--border-color)] space-y-3 text-xs sm:text-sm">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[var(--text-secondary)]">Exibir avisos no Painel</span>
                  <input
                    type="checkbox"
                    checked={notifSettings.newsAndPromos.dashboard}
                    onChange={(e) =>
                      setNotifSettings({
                        ...notifSettings,
                        newsAndPromos: { ...notifSettings.newsAndPromos, dashboard: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-[#7C3AED]"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[var(--text-secondary)]">Receber novidades por E-mail</span>
                  <input
                    type="checkbox"
                    checked={notifSettings.newsAndPromos.email}
                    onChange={(e) =>
                      setNotifSettings({
                        ...notifSettings,
                        newsAndPromos: { ...notifSettings.newsAndPromos, email: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-[#7C3AED]"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. SEÇÃO: ZONA PERIGOSA                                                   */}
      {/* ========================================================================= */}
      <section className="bg-[#140D10]/80 rounded-2xl border border-red-950/60 p-6 sm:p-7 space-y-5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-red-500">
            Zona Perigosa
          </h2>
          <p className="text-xs sm:text-sm text-red-400/80">
            Ações nesta área são irreversíveis. Tenha certeza antes de prosseguir.
          </p>
        </div>

        <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
          Excluir sua conta é uma ação permanente. Após confirmação, sua conta será suspensa imediatamente e excluída em até 30 dias. Em caso de dúvida, contate o suporte.
        </p>

        <button
          type="button"
          onClick={() => setIsDeleteModalOpen(true)}
          className="w-full py-3.5 px-4 rounded-xl bg-[#8B1E22] hover:bg-[#72181B] active:scale-[0.99] font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-950/40"
        >
          <span>🗑️</span>
          <span>Deletar minha conta</span>
        </button>
      </section>

      {/* ========================================================================= */}
      {/* MODAL: ADICIONAR EMAIL DE SUPORTE                                         */}
      {/* ========================================================================= */}
      {isAddEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Adicionar Email de Suporte</h3>
            <p className="text-xs text-gray-400">
              Este e-mail será exibido aos seus compradores nos recibos e mensagens de suporte pós-venda.
            </p>
            <input
              type="email"
              placeholder="suporte@seunegocio.com"
              value={newEmailInput}
              onChange={(e) => setNewEmailInput(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[#0F0E14] border border-[#1E1B26] text-sm text-white focus:outline-none focus:border-[#7C3AED]"
              autoFocus
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddEmailModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddSupportEmail}
                className="px-5 py-2 rounded-xl bg-white text-gray-900 font-bold text-xs hover:opacity-90 cursor-pointer"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VER IP                                                            */}
      {/* ========================================================================= */}
      {activeIpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl">
            <span className="text-3xl">🌐</span>
            <h3 className="text-base font-bold text-white">Endereço IP do Dispositivo</h3>
            <p className="text-sm font-mono text-[#7C3AED] bg-[#0F0E14] p-3 rounded-xl border border-[#1E1B26]">
              {activeIpModal}
            </p>
            <button
              type="button"
              onClick={() => setActiveIpModal(null)}
              className="w-full py-2.5 rounded-xl bg-white text-gray-900 font-bold text-xs hover:opacity-90"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETAR CONTA                                                      */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121016] border border-red-950/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-red-950/40 text-red-500 flex items-center justify-center text-2xl mx-auto">
              ⚠️
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Excluir Conta Permanentemente?</h3>
              <p className="text-xs text-gray-400">
                Digite <strong className="text-red-400">DELETAR</strong> no campo abaixo para confirmar a exclusão da sua conta e de todos os produtos cadastrados.
              </p>
            </div>
            <input
              type="text"
              placeholder="Digite DELETAR"
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[#0F0E14] border border-[#1E1B26] text-sm text-center text-white focus:outline-none focus:border-red-500 uppercase font-bold"
            />
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationInput('');
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white border border-[#1E1B26]"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={deleteConfirmationInput !== 'DELETAR'}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  showToast('Solicitação de exclusão processada.');
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
