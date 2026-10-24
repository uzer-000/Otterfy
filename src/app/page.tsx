'use client';

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode: 'login' | 'signup'
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  // Form states - Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Form states - Signup
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Floating ping animation simulator
  const [recentSale, setRecentSale] = useState({ amount: '1.500,00', method: 'M-Pesa', city: 'Maputo' });
  const [pingVisible, setPingVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setPingVisible(false);
      setTimeout(() => {
        const amounts = ['1.250,00', '1.500,00', '2.500,00', '850,00', '3.000,00', '500,00'];
        const methods = ['M-Pesa', 'e-Mola', 'M-Pesa'];
        const cities = ['Maputo', 'Matola', 'Beira', 'Nampula'];
        setRecentSale({
          amount: amounts[Math.floor(Math.random() * amounts.length)],
          method: methods[Math.floor(Math.random() * methods.length)],
          city: cities[Math.floor(Math.random() * cities.length)],
        });
        setPingVisible(true);
      }, 600);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const cleanEmail = loginEmail.trim().toLowerCase();
      const res = await signIn('credentials', {
        email: cleanEmail,
        password: loginPassword.trim(),
        redirect: false,
      });

      if (res?.error) {
        try {
          const checkRes = await fetch('/api/auth/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password: loginPassword.trim() }),
          });
          const checkData = await checkRes.json();
          if (checkData?.status === 'PENDING') {
            router.push('/auth/pending-approval');
            return;
          }
          if (checkData?.status === 'REJECTED' || checkData?.status === 'BLOCKED') {
            setError('A sua conta foi recusada ou suspensa pela administração da Otterfy.');
            return;
          }
        } catch {
          // ignore
        }
        setError('Credenciais inválidas. Verifique o seu email e senha.');
      } else {
        setSuccessMsg('Login com sucesso! Redirecionando para a dashboard...');
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Ocorreu um erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Signup submission
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (signupName.trim().length < 2) {
      setError('O seu nome deve ter pelo menos 2 caracteres.');
      return;
    }
    if (!signupEmail.includes('@')) {
      setError('Insira um endereço de email válido.');
      return;
    }
    if (signupPassword.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!acceptedTerms) {
      setError('Deve aceitar os Termos e a Política de Privacidade para criar a sua conta.');
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = signupEmail.trim().toLowerCase();
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName.trim(),
          email: cleanEmail,
          password: signupPassword.trim(),
          acceptedTerms,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao criar conta.');
        return;
      }

      if (data.status === 'PENDING') {
        router.push('/auth/pending-approval');
        return;
      }

      // Auto sign-in
      const loginRes = await signIn('credentials', {
        email: cleanEmail,
        password: signupPassword.trim(),
        redirect: false,
      });

      if (loginRes?.error) {
        setSuccessMsg('Conta criada com sucesso! Por favor faça login.');
        setMode('login');
        setLoginEmail(cleanEmail);
      } else {
        setSuccessMsg('Conta criada com sucesso! Acedendo à dashboard...');
        router.push('/dashboard');
      }
    } catch {
      setError('Erro de conexão ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08070C] text-[#F8FAFC] flex flex-col justify-between relative overflow-hidden selection:bg-violet-600 selection:text-white">
      {/* Dynamic Ambient Background Lights */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-violet-600/25 via-purple-600/15 to-transparent blur-[140px] pointer-events-none -z-10 animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[130px] pointer-events-none -z-10" />

      {/* Floating Animated Sale Ping Badge (Top Right Desktop) */}
      <div
        className={`fixed top-6 right-6 z-40 hidden md:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#14121D]/90 border border-violet-500/30 backdrop-blur-md shadow-2xl transition-all duration-500 ${
          pingVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'
        }`}
      >
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute" />
          <svg className="w-4 h-4 text-emerald-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-left leading-tight">
          <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
            <span>Venda Aprovada!</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-violet-600/20 text-violet-300 font-mono">
              {recentSale.city}
            </span>
          </div>
          <div className="text-[11px] text-slate-300 font-mono mt-0.5">
            <strong className="text-emerald-400">MT {recentSale.amount}</strong> via {recentSale.method}
          </div>
        </div>
      </div>

      {/* Floating Speed Badge (Bottom Left Desktop) */}
      <div className="fixed bottom-6 left-6 z-40 hidden lg:flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#14121D]/80 border border-white/10 backdrop-blur-md text-[11px] text-slate-300 shadow-xl">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Aprovação instantânea via USSD Push em &lt; 3s</span>
        <span className="text-violet-400 font-bold">🇲🇿</span>
      </div>

      {/* ── TOP HEADER / BRAND ── */}
      <header className="w-full pt-8 sm:pt-10 px-4 text-center">
        <div className="inline-flex items-center gap-2.5 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-500 p-0.5 shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform flex items-center justify-center">
            <div className="w-full h-full bg-[#0E0C15] rounded-[14px] flex items-center justify-center overflow-hidden">
              <Image
                src="/logo-icon.png"
                alt="Otterfy"
                width={30}
                height={30}
                className="object-contain drop-shadow"
                priority
              />
            </div>
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-none">
              Otterfy
            </h1>
            <span className="text-[10px] font-bold text-violet-400 tracking-wider uppercase">
              Checkout Moçambique 🇲🇿
            </span>
          </div>
        </div>
      </header>

      {/* ── MAIN AUTH CARD ── */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[440px] relative">
          {/* Subtle Outer Card Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-emerald-500/10 rounded-3xl blur-xl opacity-75" />

          <div className="relative rounded-3xl bg-[#121017]/95 border border-white/10 backdrop-blur-xl p-6 sm:p-9 shadow-2xl space-y-6">
            {/* Header info */}
            <div className="text-center space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {mode === 'login' ? 'Bem-vindo de volta' : 'Crie a sua conta grátis'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                {mode === 'login'
                  ? 'Aceda ao seu painel e acompanhe as suas vendas'
                  : 'Comece a vender e receba com M-Pesa e e-Mola hoje'}
              </p>
            </div>

            {/* Segmented Switcher Toggle: [ Entrar ] | [ Criar Conta ] */}
            <div className="p-1 rounded-2xl bg-[#0B0910] border border-white/10 grid grid-cols-2 gap-1 relative">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccessMsg('');
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  mode === 'login'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Entrar na Conta
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                  setSuccessMsg('');
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  mode === 'signup'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Criar Nova Conta
              </button>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-150">
                <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Success Message Alert */}
            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email de Acesso
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="exemplo@gmail.com"
                    autoComplete="email"
                    className="w-full px-4 py-3 rounded-2xl bg-[#09080E] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Senha
                    </label>
                    <span className="text-[11px] text-violet-400 hover:underline cursor-pointer" title="Contacte o suporte oficial para recuperação">
                      Esqueceu a senha?
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                      className="w-full px-4 py-3 pr-11 rounded-2xl bg-[#09080E] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showLoginPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-violet-500 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 pt-3"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Entrando...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar no Painel</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* ── SIGNUP FORM ── */
              <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Seu Nome ou Nome do Negócio"
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#09080E] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="seuemail@gmail.com"
                    autoComplete="email"
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#09080E] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Criar Senha (mínimo 8 caracteres)
                  </label>
                  <div className="relative">
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-2.5 pr-11 rounded-2xl bg-[#09080E] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showSignupPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirmar Senha
                  </label>
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#09080E] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all font-mono"
                  />
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 accent-violet-600 rounded cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-[11px] text-slate-400 leading-tight cursor-pointer">
                    Concordo com os{' '}
                    <Link href="/termos" target="_blank" className="text-violet-400 hover:underline">
                      Termos de Uso
                    </Link>{' '}
                    e a{' '}
                    <Link href="/privacidade" target="_blank" className="text-violet-400 hover:underline">
                      Política de Privacidade
                    </Link>.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-violet-500 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 pt-3"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Criando conta...</span>
                    </>
                  ) : (
                    <>
                      <span>Criar Conta Grátis</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ── GATEWAYS TRUST FOOTER ── */}
            <div className="pt-4 border-t border-white/5 space-y-2.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Pagamentos Móveis Integrados
              </span>
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-5 h-5 rounded-md bg-white p-0.5 flex items-center justify-center">
                    <Image src="/gateways/mpesa.png" alt="M-Pesa" width={20} height={20} className="object-contain" />
                  </div>
                  <span className="text-xs font-bold text-white">M-Pesa</span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-5 h-5 rounded-md bg-white p-0.5 flex items-center justify-center">
                    <Image src="/gateways/emola.png" alt="e-Mola" width={20} height={20} className="object-contain" />
                  </div>
                  <span className="text-xs font-bold text-white">e-Mola</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-center gap-4 text-[11px]">
          <Link href="/termos" className="hover:text-white transition-colors">
            Termos de Uso
          </Link>
          <span>•</span>
          <Link href="/privacidade" className="hover:text-white transition-colors">
            Privacidade
          </Link>
          <span>•</span>
          <Link href="/reembolso" className="hover:text-white transition-colors">
            Reembolso
          </Link>
        </div>
        <p className="text-[10px] text-slate-400">
          Otterfy © {new Date().getFullYear()} • A infraestrutura de pagamentos digitais para Moçambique 🇲🇿
        </p>
      </footer>
    </div>
  );
}
