import React from 'react';
import Link from 'next/link';

export default function HelpPage() {
  const faqs = [
    {
      q: 'Como recebo os pagamentos dos meus clientes?',
      a: 'Os pagamentos via M-Pesa e e-Mola são processados de forma instantânea através dos gateways configurados (Zenofy / E2Payment). O saldo é creditado na sua carteira Otterfy assim que a transação é confirmada.',
    },
    {
      q: 'Como realizo saques para a minha conta móvel ou bancária?',
      a: 'Acesse o menu "Minhas faturas / Finanças" no menu lateral. Lá você poderá visualizar o saldo disponível e solicitar a transferência para a sua conta M-Pesa, e-Mola ou banco moçambicano.',
    },
    {
      q: 'Como cadastrar um novo produto para vender?',
      a: 'Vá em "Produtos" -> "Visão geral" e clique no botão "+ Criar Produto". Preencha o título, valor em MT, categoria, e faça o upload dos arquivos ou links que o cliente receberá após pagar.',
    },
    {
      q: 'Onde encontro meus links de Webhook e integrações de API?',
      a: 'No menu "Ferramentas" -> "Webhook" ou "MCP / Desenvolvedor". Lá você tem acesso às suas chaves de API secretas, endpoints de webhook e logs de requisições recebidas.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            Suporte & Documentação
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Central de Ajuda Otterfy
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Encontre respostas rápidas para as dúvidas mais comuns sobre pagamentos, produtos e saques.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-400 active:scale-95 transition-all w-fit"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Voltar
        </Link>
      </div>

      {/* Cards de Contato Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            💬
          </div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Suporte via WhatsApp Oficial
          </h2>
          <p className="text-xs md:text-sm text-[var(--text-secondary)]">
            Fale diretamente com a equipe técnica da Otterfy em Moçambique para atendimento prioritário.
          </p>
          <a
            href="https://wa.me/258840000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
          >
            Abrir conversa no WhatsApp &rarr;
          </a>
        </div>

        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center font-bold">
            ✉️
          </div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            E-mail de Suporte
          </h2>
          <p className="text-xs md:text-sm text-[var(--text-secondary)]">
            Envie sua dúvida por e-mail e nossa equipe retornará em até 24 horas úteis.
          </p>
          <a
            href="mailto:suporte@otterfy.co.mz"
            className="inline-flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline pt-1"
          >
            suporte@otterfy.co.mz &rarr;
          </a>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 space-y-4">
        <h2 className="text-base font-bold text-[var(--text-primary)] mb-2">
          Perguntas Frequentes (FAQ)
        </h2>
        <div className="space-y-4 divide-y divide-[var(--border-color)]">
          {faqs.map((f, i) => (
            <div key={i} className={i === 0 ? '' : 'pt-4'}>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                {f.q}
              </h3>
              <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
