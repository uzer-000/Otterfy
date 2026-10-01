'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const saved = (localStorage.getItem('otterfy-theme') as 'light' | 'dark') || 'light';
      setTheme(saved);
    } catch {
      setTheme('light');
    }
  }, []);

  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await signIn('credentials', {
        email: cleanEmail,
        password: password.trim(),
        redirect: false,
      });

      if (res?.error) {
        setError('Credenciais inválidas. Verifique o seu email e senha.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Ocorreu um erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex ${
        isDark ? 'bg-[#08070C]' : 'bg-gradient-to-br from-violet-50 via-white to-indigo-50'
      }`}
    >
      {/* ── LEFT HERO PANEL (desktop only) ── */}
      <div
        className={`hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-br from-violet-950/40 via-[#08070C] to-indigo-950/30'
            : 'bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-700'
        }`}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 ${
              isDark ? 'bg-violet-600' : 'bg-white'
            }`}
          />
          <div
            className={`absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-15 ${
              isDark ? 'bg-indigo-600' : 'bg-indigo-200'
            }`}
          />
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-10 ${
              isDark ? 'bg-violet-400' : 'bg-violet-100'
            }`}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Otterfy"
              width={40}
              height={40}
              className="object-contain drop-shadow-lg"
            />
          </div>
          <span className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-white'}`}>
            Otter<span className={isDark ? 'text-violet-400' : 'text-violet-200'}>fy</span>
          </span>
        </div>

        {/* Hero content */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-4">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                isDark
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'bg-white/20 text-white border border-white/30'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Plataforma de Pagamentos
            </div>
            <h1
              className={`text-4xl xl:text-5xl font-black leading-tight ${
                isDark ? 'text-white' : 'text-white'
              }`}
            >
              Gerencie seus
              <br />
              pagamentos em
              <br />
              <span className={isDark ? 'text-violet-400' : 'text-violet-200'}>Moçambique</span>
            </h1>
            <p className={`text-base leading-relaxed max-w-sm ${isDark ? 'text-slate-400' : 'text-violet-100'}`}>
              Aceite M-Pesa e e-Mola diretamente no seu negócio. Simples, rápido e seguro.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['Checkout Rápido', 'Links de Pagamento', 'Relatórios em Tempo Real'].map((feat) => (
              <span
                key={feat}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isDark
                    ? 'bg-white/10 text-slate-300 border border-white/10'
                    : 'bg-white/20 text-white border border-white/25'
                }`}
              >
                {feat}
              </span>
            ))}
          </div>
        </div>

        {/* Gateway logos footer */}
        <div className="relative z-10 space-y-3">
          <p className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-violet-200'}`}>
            Gateways suportados
          </p>
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center justify-center h-10 px-4 rounded-lg ${
                isDark ? 'bg-white/10 border border-white/10' : 'bg-white/20 border border-white/25'
              }`}
            >
              <Image
                src="/gateways/Mpesa.png"
                alt="M-Pesa"
                width={72}
                height={28}
                className="object-contain h-6 w-auto"
              />
            </div>
            <div
              className={`flex items-center justify-center h-10 px-4 rounded-lg ${
                isDark ? 'bg-white/10 border border-white/10' : 'bg-white/20 border border-white/25'
              }`}
            >
              <Image
                src="/gateways/emola.png"
                alt="e-Mola"
                width={72}
                height={28}
                className="object-contain h-6 w-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div
        className={`flex-1 flex flex-col items-center justify-center p-6 sm:p-12 ${
          isDark ? 'bg-[#08070C]' : 'bg-white/60 backdrop-blur-sm'
        }`}
      >
        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-10">
          <div className="w-12 h-12 flex items-center justify-center mb-2">
            <Image
              src="/logo.png"
              alt="Otterfy"
              width={48}
              height={48}
              className="object-contain drop-shadow-lg"
            />
          </div>
          <span className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Otter<span className="text-violet-600">fy</span>
          </span>
        </div>

        <div className="w-full max-w-md">
          {/* Form card */}
          <div
            className={`rounded-2xl p-8 sm:p-10 ${
              isDark
                ? 'bg-[#121016] border border-[#1E1B26] shadow-2xl shadow-black/50'
                : 'bg-white border border-gray-100 shadow-xl shadow-gray-200/60'
            }`}
          >
            {/* Header */}
            <div className="mb-8">
              <h2
                className={`text-2xl font-bold tracking-tight ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Bem-vindo de volta
              </h2>
              <p className={`mt-1.5 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Entre na sua conta para continuar
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className={`block text-sm font-medium mb-1.5 ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 text-sm border outline-none transition-all duration-200 ${
                    isDark
                      ? 'bg-[#0F0E14] border-[#1E1B26] text-white placeholder-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 focus:bg-white'
                  }`}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className={`block text-sm font-medium mb-1.5 ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full rounded-xl px-4 py-3 pr-11 text-sm border outline-none transition-all duration-200 ${
                      isDark
                        ? 'bg-[#0F0E14] border-[#1E1B26] text-white placeholder-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 focus:bg-white'
                    }`}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
                    } transition-colors`}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? (
                      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="laser-button w-full py-3 px-4 text-sm font-semibold text-white mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    A entrar...
                  </span>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className={`my-6 border-t ${isDark ? 'border-[#1E1B26]' : 'border-gray-100'}`} />

            {/* Sign up link */}
            <p className={`text-center text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              Não tem conta?{' '}
              <Link
                href="/auth/signup"
                className="text-violet-600 hover:text-violet-700 font-medium transition-colors"
              >
                Criar conta grátis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
