'use client';

import React, { useState, useId } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [simulatedRevenue, setSimulatedRevenue] = useState(100000); // 100K MT
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const revenueSliderId = useId();

  // Calculator estimations
  const averageTicket = 1500; // 1.500 MT
  const estimatedSales = Math.round(simulatedRevenue / averageTicket);
  const orderBumpExtra = Math.round(simulatedRevenue * 0.28); // +28% de faturamento com order bumps
  const totalWithOtterfy = simulatedRevenue + orderBumpExtra;

  const faqs = [
    {
      q: 'Preciso de ter empresa registada ou NUIT comercial para começar a vender?',
      a: 'Não! Pode começar a vender hoje mesmo como pessoa física ou criador independente. Só precisa de ter um número M-Pesa ou e-Mola ativo em seu nome para receber o valor das suas vendas instantaneamente.',
    },
    {
      q: 'Como é que o cliente paga e como recebo o dinheiro?',
      a: 'O cliente insere o número de telefone (Vodacom ou Movitel) no seu checkout. Em menos de 3 segundos, o telemóvel dele recebe um pop-up automático (USSD Push) solicitando o PIN. Assim que ele confirma com o PIN, o dinheiro cai imediatamente na sua carteira da Zenofy / Otterfy!',
    },
    {
      q: 'A Otterfy cobra alguma mensalidade fixa?',
      a: 'Zero! Não cobramos mensalidade, taxa de adesão nem custos de manutenção. Só paga uma pequena taxa percentual quando realiza vendas aprovadas. Se não vender, não paga absolutamente nada.',
    },
    {
      q: 'Como funciona a entrega do produto ao meu comprador?',
      a: 'A entrega é 100% automatizada! Ao cadastrar o seu produto (e-book, curso, mentoria, ficheiro PDF ou software), define o link ou ficheiro de entrega. Assim que o pagamento é aprovado pelo M-Pesa/e-Mola, o cliente é redirecionado para a página de acesso imediato e recebe a confirmação.',
    },
    {
      q: 'Como funcionam os prémios e placas comemorativas da Otterfy?',
      a: 'Recompensamos os infoprodutores que alcançam marcas de faturamento na plataforma! Ao atingir 50.000 MT ganha a Pulseira Oficial de Bronze, aos 100.000 MT a Placa Prata, aos 500.000 MT a Placa Ouro, até à Placa Titan de 10 Milhões de Meticais.',
    },
  ];

  const awards = [
    { level: '50K MT', name: 'Pulseira Bronze', img: '/awards/50k.png', color: 'from-amber-700/30 to-amber-900/10' },
    { level: '100K MT', name: 'Placa Prata', img: '/awards/100k.png', color: 'from-slate-400/30 to-slate-600/10' },
    { level: '500K MT', name: 'Placa Ouro', img: '/awards/500k.png', color: 'from-yellow-500/30 to-amber-600/10' },
    { level: '1M MT', name: 'Placa Diamante', img: '/awards/1m.png', color: 'from-cyan-400/30 to-blue-600/10' },
    { level: '5M MT', name: 'Placa Black', img: '/awards/5m.png', color: 'from-purple-500/30 to-indigo-900/10' },
    { level: '10M MT', name: 'Placa Titan', img: '/awards/10m.png', color: 'from-violet-400/30 to-fuchsia-800/10' },
  ];

  return (
    <div className="min-h-screen bg-[#08070C] text-[#F8FAFC] selection:bg-violet-600 selection:text-white relative overflow-x-hidden">
      {/* Background Glow Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-violet-600/20 via-purple-600/10 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[800px] left-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-[1800px] right-0 w-[600px] h-[600px] bg-violet-600/10 blur-[140px] pointer-events-none -z-10" />

      {/* ----------------- TOP NAVBAR ----------------- */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#08070C]/80 border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-500 p-0.5 shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-[#0E0C15] rounded-[10px] flex items-center justify-center overflow-hidden">
                <Image
                  src="/logo-icon.png"
                  alt="Otterfy Logo"
                  width={28}
                  height={28}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Otterfy
              </span>
              <span className="text-[10px] font-bold text-violet-400 tracking-wider uppercase -mt-1 flex items-center gap-1">
                Moçambique 🇲🇿
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#recursos" className="hover:text-white transition-colors">
              Recursos
            </a>
            <a href="#pagamentos" className="hover:text-white transition-colors">
              M-Pesa & e-Mola
            </a>
            <a href="#como-funciona" className="hover:text-white transition-colors">
              Como Funciona
            </a>
            <a href="#premiacoes" className="hover:text-white transition-colors">
              Premiações
            </a>
            <a href="#simulador" className="hover:text-white transition-colors">
              Simulador
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action Buttons: Entrar & Cadastro */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer"
            >
              Entrar
            </Link>
            <Link
              href="/auth/signup"
              className="relative group px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-violet-500 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Criar Conta Grátis</span>
              <span className="ml-1.5 inline-block group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
            aria-label="Abrir Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0D0B14] border-b border-white/10 px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
            <nav className="flex flex-col space-y-3 text-sm font-medium text-slate-300">
              <a href="#recursos" onClick={() => setMobileMenuOpen(false)} className="py-1">
                Recursos
              </a>
              <a href="#pagamentos" onClick={() => setMobileMenuOpen(false)} className="py-1">
                M-Pesa & e-Mola
              </a>
              <a href="#como-funciona" onClick={() => setMobileMenuOpen(false)} className="py-1">
                Como Funciona
              </a>
              <a href="#premiacoes" onClick={() => setMobileMenuOpen(false)} className="py-1">
                Premiações
              </a>
              <a href="#simulador" onClick={() => setMobileMenuOpen(false)} className="py-1">
                Simulador
              </a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-1">
                FAQ
              </a>
            </nav>
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
              <Link
                href="/auth/login"
                className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-slate-200 bg-white/5 border border-white/10"
              >
                Entrar na Conta
              </Link>
              <Link
                href="/auth/signup"
                className="w-full text-center py-2.5 rounded-xl text-sm font-bold text-white bg-violet-600 shadow-md shadow-violet-600/30"
              >
                Criar Conta Grátis
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ----------------- HERO SECTION ----------------- */}
      <section className="pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Announcement pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-600/10 border border-violet-500/25 text-violet-300 text-xs sm:text-sm font-semibold shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>A plataforma nº1 de pagamentos digitais em Moçambique</span>
            <span className="text-violet-400">✨</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white">
            Venda produtos digitais e receba em{' '}
            <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
              Meticais na hora.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed">
            A infraestrutura completa de checkout de alta conversão para infoprodutores, cursos e negócios digitais em Moçambique.
            Aceite <strong className="text-white font-semibold">M-Pesa e e-Mola</strong> em menos de 3 segundos, com zero burocracia.
          </p>

          {/* CTA Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-extrabold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-violet-500 hover:from-violet-500 hover:to-purple-500 shadow-xl shadow-violet-600/30 hover:shadow-violet-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>Começar a Vender Agora</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl text-base font-bold text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center cursor-pointer"
            >
              Já tenho conta (Entrar)
            </Link>
          </div>

          {/* Trust points */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span> Zero taxas de adesão
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span> Push automático de PIN no telemóvel
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span> Ativação imediata da conta
            </span>
          </div>
        </div>

        {/* ----------------- INTERACTIVE HERO SHOWCASE ----------------- */}
        <div className="mt-14 sm:mt-20 relative max-w-5xl mx-auto">
          {/* Outer glow frame */}
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/40 via-purple-600/30 to-emerald-500/30 rounded-3xl blur-xl opacity-75" />

          <div className="relative rounded-3xl bg-[#100E17] border border-white/10 p-4 sm:p-8 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Mockup: Dashboard Metrics Feed (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Visão Geral das Vendas (Hoje)
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30">
                  Moçambique • Tempo Real
                </span>
              </div>

              {/* KPI Cards inside mock */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#171422] border border-white/5 space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium">Faturamento Total</span>
                  <div className="text-xl sm:text-2xl font-black text-white">148.500,00 MT</div>
                  <span className="text-[10px] text-emerald-400 font-bold">↑ +34.2% esta semana</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#171422] border border-white/5 space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium">Taxa de Conversão</span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">89.4%</div>
                  <span className="text-[10px] text-slate-400 font-bold">M-Pesa & e-Mola</span>
                </div>
              </div>

              {/* Dynamic Notification Simulation Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/40 to-purple-950/30 border border-violet-500/30 flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Venda Aprovada - Otterfy</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="text-xs text-slate-300 font-mono font-bold mt-0.5">
                      Valor : MT 1.500,00 • <span className="text-emerald-400">M-Pesa Confirmado</span>
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">Agora</span>
              </div>
            </div>

            {/* Right Mockup: 1-Click Mobile Checkout Simulation (5 cols) */}
            <div className="lg:col-span-5 rounded-2xl bg-[#161322] border border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Checkout Otterfy</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  Seguro SSL
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Mentoria Tráfego Pro</span>
                  <span className="font-bold text-white">1.500 MT</span>
                </div>

                {/* Simulated Order Bump */}
                <div className="p-2.5 rounded-xl bg-violet-600/10 border border-violet-500/30 flex items-start gap-2">
                  <input type="checkbox" checked readOnly className="mt-0.5 accent-violet-600 rounded" />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold text-violet-300">+ Modelos de Anúncios Prontos</span>
                    <div className="text-slate-400 font-bold">+ 350 MT</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex justify-between font-bold text-sm">
                  <span>Total a Pagar</span>
                  <span className="text-emerald-400 font-mono">1.850,00 MT</span>
                </div>
              </div>

              {/* Simulated Mobile Number input & Pay button */}
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-[#0F0D17] border border-white/10 text-xs text-slate-300 flex items-center justify-between font-mono">
                  <span>🇲🇿 +258 84 123 4567</span>
                  <span className="text-[10px] text-emerald-400 font-bold">M-Pesa</span>
                </div>

                <div className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs text-center shadow-md shadow-emerald-500/20">
                  Pagar Agora com M-Pesa (PIN Automático)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- PAYMENT GATEWAYS BAR ----------------- */}
      <section id="pagamentos" className="py-12 border-y border-white/5 bg-[#0C0B12]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">
            Pagamentos móveis integrados diretamente com as maiores operadoras de Moçambique
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 opacity-90 grayscale-0">
            {/* M-Pesa */}
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/40 transition-colors">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white p-1">
                <Image src="/gateways/mpesa.png" alt="M-Pesa" width={32} height={32} className="object-contain" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white">M-Pesa</div>
                <div className="text-[10px] text-slate-400">Vodacom Moçambique</div>
              </div>
            </div>

            {/* e-Mola */}
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/40 transition-colors">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white p-1">
                <Image src="/gateways/emola.png" alt="e-Mola" width={32} height={32} className="object-contain" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white">e-Mola</div>
                <div className="text-[10px] text-slate-400">Movitel Moçambique</div>
              </div>
            </div>

            {/* Zenofy APIs Gateway */}
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/40 transition-colors">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-violet-600/30 p-1">
                <Image src="/gateways/zenofy.png" alt="Zenofy" width={32} height={32} className="object-contain" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white">Zenofy Engine</div>
                <div className="text-[10px] text-slate-400">Liquidação Instantânea</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- SUPERPOWERS / BENTO GRID ----------------- */}
      <section id="recursos" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-violet-400">
            Tudo o que precisa para escalar
          </h2>
          <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Criado sob medida para o mercado digital moçambicano
          </h3>
          <p className="text-slate-400 text-base sm:text-lg">
            Abandone os comprovativos manuais de WhatsApp e as planilhas confusas. A Otterfy automatiza todo o funil.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-7 rounded-3xl bg-[#121018] border border-white/10 hover:border-violet-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-5 text-xl group-hover:scale-110 transition-transform">
              ⚡
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Checkout de 1 Passo Ultra-Rápido</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Otimizado para telemóveis. Formulário simplificado que elimina toda a fricção e converte até 3x mais que checkouts comuns.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-7 rounded-3xl bg-[#121018] border border-white/10 hover:border-emerald-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 text-xl group-hover:scale-110 transition-transform">
              📲
            </div>
            <h4 className="text-xl font-bold text-white mb-2">USSD Push Direto no Telemóvel</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              O comprador digita o número e o ecrã do telemóvel acende imediatamente pedindo o PIN do M-Pesa ou e-Mola. Confirmação em 3 segundos.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-7 rounded-3xl bg-[#121018] border border-white/10 hover:border-purple-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5 text-xl group-hover:scale-110 transition-transform">
              🛍️
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Order Bumps & Upsells em 1 Clique</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Aumente o valor médio de cada venda oferecendo produtos complementares com uma única caixinha de seleção no checkout.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-7 rounded-3xl bg-[#121018] border border-white/10 hover:border-yellow-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-2xl bg-yellow-600/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400 mb-5 text-xl group-hover:scale-110 transition-transform">
              🔔
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Notificações Push com Som de Venda</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Receba o som icónico e notificações instantâneas no seu telemóvel e computador a cada venda aprovada, mesmo com a aba fechada.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-7 rounded-3xl bg-[#121018] border border-white/10 hover:border-blue-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-5 text-xl group-hover:scale-110 transition-transform">
              🎯
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Rastreamento com Meta Pixel & CAPI</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Integração nativa de alta precisão com Meta Conversions API (CAPI server-side), TikTok Pixel, Google Ads e Utmify.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-7 rounded-3xl bg-[#121018] border border-white/10 hover:border-pink-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-2xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-5 text-xl group-hover:scale-110 transition-transform">
              🔒
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Entrega Automática & Área de Membros</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              O seu e-book, curso, comunidade ou mentoria é entregue imediatamente após a confirmação. Segurança total contra pirataria.
            </p>
          </div>
        </div>
      </section>

      {/* ----------------- AWARDS / GAMIFICATION SHOWCASE ----------------- */}
      <section id="premiacoes" className="py-20 sm:py-28 bg-gradient-to-b from-[#0C0B12] via-[#100E17] to-[#08070C] border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-wider">
              🏆 Gamificação Oficial
            </div>
            <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Os seus marcos celebrados com placas físicas exclusivas
            </h3>
            <p className="text-slate-400 text-base sm:text-lg">
              À medida que escala as suas vendas, a Otterfy envia para si os prémios físicos oficiais comemorativos do seu sucesso.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {awards.map((award, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-[#161320] border border-white/10 hover:border-yellow-500/40 transition-all flex flex-col items-center text-center group"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 relative mb-3 group-hover:scale-105 transition-transform">
                  <Image
                    src={award.img}
                    alt={award.name}
                    fill
                    className="object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
                  />
                </div>
                <span className="text-xs font-extrabold text-yellow-400 font-mono tracking-wide">
                  {award.level}
                </span>
                <span className="text-xs font-bold text-white mt-0.5">{award.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------- INTERACTIVE CALCULATOR ----------------- */}
      <section id="simulador" className="py-20 sm:py-28 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#121019] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
              Simulador de Faturamento
            </span>
            <h3 className="text-2xl sm:text-4xl font-black text-white">
              Quanto pode faturar vendendo na Otterfy?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Arraste a barra para ver o impacto dos Order Bumps e a automação de checkout no seu negócio.
            </p>
          </div>

          {/* Slider */}
          <div className="space-y-4 max-w-xl mx-auto">
            <div className="flex justify-between items-center">
              <label htmlFor={revenueSliderId} className="text-xs text-slate-400 font-medium cursor-pointer">
                Faturamento Mensal Estimado:
              </label>
              <span className="text-2xl sm:text-3xl font-black text-violet-400 font-mono">
                {simulatedRevenue.toLocaleString('pt-MZ')} MT
              </span>
            </div>

            <input
              id={revenueSliderId}
              type="range"
              min={10000}
              max={1000000}
              step={10000}
              value={simulatedRevenue}
              onChange={(e) => setSimulatedRevenue(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-600"
              aria-label="Faturamento Mensal Estimado"
            />

            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>10.000 MT</span>
              <span>500.000 MT</span>
              <span>1.000.000 MT+</span>
            </div>
          </div>

          {/* Result Cards */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/10">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
              <span className="text-xs text-slate-400">Vendas Estimadas</span>
              <div className="text-2xl font-black text-white mt-1 font-mono">~{estimatedSales}</div>
              <span className="text-[10px] text-slate-500">com ticket de 1.500 MT</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-xs text-emerald-400 font-medium">Extra com Order Bumps (+28%)</span>
              <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                +{orderBumpExtra.toLocaleString('pt-MZ')} MT
              </div>
              <span className="text-[10px] text-slate-400">lucro adicional automático</span>
            </div>

            <div className="p-4 rounded-2xl bg-violet-600/15 border border-violet-500/30 text-center">
              <span className="text-xs text-violet-300 font-medium">Total Potencial com Otterfy</span>
              <div className="text-2xl font-black text-white mt-1 font-mono">
                {totalWithOtterfy.toLocaleString('pt-MZ')} MT
              </div>
              <span className="text-[10px] text-violet-300">sem custos fixos</span>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- COMPARISON TABLE ----------------- */}
      <section className="py-16 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <h3 className="text-2xl sm:text-4xl font-black text-white">
            Por que trocar o método manual pela Otterfy?
          </h3>
        </div>

        <div className="rounded-3xl bg-[#100E17] border border-white/10 overflow-hidden shadow-xl">
          <div className="grid grid-cols-12 bg-white/5 p-4 text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-white/10">
            <div className="col-span-6 sm:col-span-5">Critério</div>
            <div className="col-span-3 sm:col-span-3 text-red-400">Método Manual (WhatsApp)</div>
            <div className="col-span-3 sm:col-span-4 text-emerald-400">Com a Otterfy</div>
          </div>

          <div className="divide-y divide-white/5 text-xs sm:text-sm">
            <div className="grid grid-cols-12 p-4 items-center">
              <div className="col-span-6 sm:col-span-5 font-medium text-slate-300">Confirmação de Pagamento</div>
              <div className="col-span-3 sm:col-span-3 text-slate-400">Manual (conferir extrato)</div>
              <div className="col-span-3 sm:col-span-4 text-emerald-400 font-bold">Automática em 3 segundos</div>
            </div>

            <div className="grid grid-cols-12 p-4 items-center">
              <div className="col-span-6 sm:col-span-5 font-medium text-slate-300">Entrega do Produto</div>
              <div className="col-span-3 sm:col-span-3 text-slate-400">Enviar link no privado</div>
              <div className="col-span-3 sm:col-span-4 text-emerald-400 font-bold">Imediata e Protegida</div>
            </div>

            <div className="grid grid-cols-12 p-4 items-center">
              <div className="col-span-6 sm:col-span-5 font-medium text-slate-300">Vendas na Madrugada</div>
              <div className="col-span-3 sm:col-span-3 text-slate-400">Perdidas enquanto dorme</div>
              <div className="col-span-3 sm:col-span-4 text-emerald-400 font-bold">Vende 24h/7 dias</div>
            </div>

            <div className="grid grid-cols-12 p-4 items-center">
              <div className="col-span-6 sm:col-span-5 font-medium text-slate-300">Order Bumps & Upsells</div>
              <div className="col-span-3 sm:col-span-3 text-slate-400">Inexistente</div>
              <div className="col-span-3 sm:col-span-4 text-emerald-400 font-bold">+28% faturamento médio</div>
            </div>

            <div className="grid grid-cols-12 p-4 items-center">
              <div className="col-span-6 sm:col-span-5 font-medium text-slate-300">Notificação no Telemóvel</div>
              <div className="col-span-3 sm:col-span-3 text-slate-400">Mensagens desorganizadas</div>
              <div className="col-span-3 sm:col-span-4 text-emerald-400 font-bold">Push com som oficial</div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- FAQ SECTION ----------------- */}
      <section id="faq" className="py-20 sm:py-28 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-violet-400">Dúvidas Frequentes</span>
          <h3 className="text-3xl sm:text-4xl font-black text-white">Tudo o que precisa de saber</h3>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#121018] border border-white/10 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left font-bold text-sm sm:text-base text-white flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className={`text-violet-400 text-xl transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3 animate-in fade-in duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ----------------- FINAL CTA BANNER ----------------- */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-violet-900/60 via-purple-900/40 to-slate-900 border border-violet-500/30 p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/30 border border-violet-500/40 mx-auto flex items-center justify-center text-3xl shadow-lg">
            🚀
          </div>

          <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-2xl mx-auto">
            Pronto para transformar o seu conhecimento em vendas diárias?
          </h3>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Crie a sua conta gratuita em menos de 2 minutos e comece a receber pagamentos automáticos com M-Pesa e e-Mola hoje mesmo.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto px-9 py-4 rounded-2xl text-base font-extrabold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-violet-500 hover:from-violet-500 hover:to-purple-500 shadow-xl shadow-violet-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              Criar Conta Grátis na Otterfy →
            </Link>

            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl text-base font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
            >
              Aceder ao Painel
            </Link>
          </div>
        </div>
      </section>

      {/* ----------------- FOOTER ----------------- */}
      <footer className="border-t border-white/10 bg-[#06050A] py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-violet-600/30 flex items-center justify-center p-1">
              <Image src="/logo-icon.png" alt="Otterfy" width={20} height={20} className="object-contain" />
            </div>
            <span className="font-bold text-slate-300 text-sm">Otterfy Moçambique</span>
            <span className="text-[10px] text-slate-500">© {new Date().getFullYear()} Todos os direitos reservados.</span>
          </div>

          <div className="flex items-center flex-wrap justify-center gap-6 text-slate-400">
            <Link href="/termos" className="hover:text-white transition-colors">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-white transition-colors">
              Privacidade
            </Link>
            <Link href="/reembolso" className="hover:text-white transition-colors">
              Política de Reembolso
            </Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">
              Login
            </Link>
            <Link href="/auth/signup" className="hover:text-white transition-colors">
              Cadastro
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
