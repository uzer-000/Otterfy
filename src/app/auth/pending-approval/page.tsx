'use client';

import Link from 'next/link';

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-[#08070C] dark:via-[#0E0C15] dark:to-[#171422]">
      <div className="w-full max-w-md bg-white dark:bg-[#121017] border border-gray-100 dark:border-[#221F2D] rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
        {/* Animated Badge Icon */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-inner">
          <div className="absolute inset-0 rounded-2xl bg-amber-400/20 blur-xl animate-pulse"></div>
          <svg className="w-10 h-10 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            Acesso Restrito &bullet; Fase Privada
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Conta em Análise
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Obrigado pelo seu registo no <strong>Otterfy</strong>! Atualmente, o acesso à plataforma é liberado gradualmente sob aprovação manual da administração.
          </p>
          <div className="p-4 rounded-xl bg-violet-50 dark:bg-[#1A1626] border border-violet-100 dark:border-violet-900/30 text-xs text-violet-700 dark:text-violet-300 text-left space-y-1.5">
            <p className="font-semibold">O que acontece agora?</p>
            <p>1. O administrador foi notificado do seu pedido de acesso.</p>
            <p>2. Assim que aprovado, receberá um e-mail de confirmação.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Link
            href="/auth/login"
            className="laser-button w-full block py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-lg text-center"
          >
            Ir para a Tela de Login
          </Link>
          <Link
            href="/"
            className="block w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Voltar para a Página Inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
