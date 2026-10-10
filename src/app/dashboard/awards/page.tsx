'use client';

import React, { useState, useEffect } from 'react';
import { formatMZN } from '@/lib/utils';

interface MilestoneData {
  id: number;
  level: string;
  name: string;
  heading: string;
  target: number;
  description: string;
  tag: string;
  imageSrc?: string;
  type: 'community' | 'whatsapp' | 'bracelet' | 'plaque';
  whatsappLink?: string;
  discordLink?: string;
}

const MILESTONES: MilestoneData[] = [
  {
    id: 1,
    level: 'Comunidade',
    name: 'Comunidade Otterfy',
    heading: 'Cresça junto com quem já fatura',
    target: 0,
    tag: '1/7',
    description: 'WhatsApp e Discord abertos, com gente vendendo todo dia. Você já tem acesso.',
    type: 'community',
    whatsappLink: 'https://chat.whatsapp.com',
    discordLink: 'https://discord.gg',
  },
  {
    id: 2,
    level: '5K',
    name: 'Grupo Network WhatsApp',
    heading: '5.000 MT faturados',
    target: 5000,
    tag: '2/7',
    description: 'Sala fechada no WhatsApp com os outros sellers da plataforma.',
    type: 'whatsapp',
  },
  {
    id: 3,
    level: '10K',
    name: 'Pulseira Otterfy',
    heading: '10.000 MT faturados',
    target: 10000,
    tag: '3/7',
    description: 'Peça de identidade da comunidade, entregue no seu endereço.',
    type: 'bracelet',
  },
  {
    id: 4,
    level: '50K',
    name: 'Placa 50K',
    heading: '50.000 MT faturados',
    target: 50000,
    tag: '4/7',
    description: 'Acrílico maciço com o seu marco gravado, entregue no seu endereço.',
    imageSrc: '/awards/50k.png',
    type: 'plaque',
  },
  {
    id: 5,
    level: '100K',
    name: 'Placa 100K',
    heading: '100.000 MT faturados',
    target: 100000,
    tag: '5/7',
    description: 'Acrílico maciço com o seu marco gravado, entregue no seu endereço.',
    imageSrc: '/awards/100k.png',
    type: 'plaque',
  },
  {
    id: 6,
    level: '500K',
    name: 'Placa 500K',
    heading: '500.000 MT faturados',
    target: 500000,
    tag: '6/7',
    description: 'Acrílico maciço com o seu marco gravado, entregue no seu endereço.',
    imageSrc: '/awards/500k.png',
    type: 'plaque',
  },
  {
    id: 7,
    level: '1M',
    name: 'Placa 1M',
    heading: '1.000.000 MT faturados',
    target: 1000000,
    tag: '7/7',
    description: 'A última parada. Acrílico maciço, entregue no seu endereço.',
    imageSrc: '/awards/1m.png',
    type: 'plaque',
  },
];

const FAQS = [
  {
    question: 'Como funciona o envio das placas e pulseiras?',
    answer:
      'Assim que você atingir a meta de faturamento correspondente, um botão de resgate será liberado para você preencher os dados de entrega. O troféu em acrílico maciço é fabricado artesanalmente e enviado diretamente para o seu endereço.',
  },
  {
    question: 'O frete de entrega é gratuito?',
    answer:
      'Sim! O envio é 100% gratuito para qualquer província de Moçambique e também para endereços em Portugal e Brasil.',
  },
  {
    question: 'O faturamento dos meus afiliados conta para as minhas conquistas?',
    answer:
      'Conta todo o faturamento aprovado gerado como produtor ou como afiliado na sua conta Otterfy.',
  },
  {
    question: 'Quanto tempo demora para a placa chegar?',
    answer:
      'O prazo médio de confecção e entrega é de 10 a 20 dias úteis após a solicitação do resgate no painel.',
  },
];

export default function AwardsPage() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [claimModalMilestone, setClaimModalMilestone] = useState<MilestoneData | null>(null);
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    phone: '',
    province: 'Maputo Cidade',
    address: '',
  });
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/payments?status=APPROVED')
      .then((res) => res.json())
      .then((json) => {
        const list = json.data || [];
        const sum = list.reduce((acc: number, o: any) => acc + (Number(o.amount) || 0), 0);
        setTotalRevenue(sum);
      })
      .catch(() => {});
  }, []);

  // Determina conquistas
  const conqueredCount = MILESTONES.filter((m) => totalRevenue >= m.target).length;
  // Próximo marco não atingido
  const nextMilestone = MILESTONES.find((m) => totalRevenue < m.target) || MILESTONES[MILESTONES.length - 1];
  const remainingAmount = Math.max(0, nextMilestone.target - totalRevenue);
  const progressToNext = nextMilestone.target > 0
    ? Math.min(100, Math.round((totalRevenue / nextMilestone.target) * 100))
    : 100;

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClaimSuccess(true);
    setTimeout(() => {
      setClaimSuccess(false);
      setClaimModalMilestone(null);
    }, 2500);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fadeIn text-[#F8FAFC]">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: FATURAMENTO TOTAL & PROXIMA PARADA                         */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
              FATURAMENTO TOTAL
            </span>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--text-primary)] mt-1">
              {formatMZN(totalRevenue)}
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-medium mt-1.5">
              {remainingAmount > 0 ? (
                <>
                  <strong className="text-[var(--text-primary)]">{formatMZN(remainingAmount)}</strong> para {nextMilestone.name} • {progressToNext}% do caminho
                </>
              ) : (
                'Todas as conquistas foram alcançadas! Parabéns!'
              )}
            </p>
          </div>

          <div className="text-left sm:text-right space-y-0.5">
            <span className="text-xs font-bold text-[#7C3AED] bg-[#7C3AED]/10 px-2.5 py-1 rounded-full border border-[#7C3AED]/20">
              {conqueredCount} de {MILESTONES.length} conquistadas
            </span>
            <p className="text-xs text-[var(--text-muted)] pt-1">
              próxima parada: <strong className="text-[var(--text-primary)]">{nextMilestone.name}</strong>
            </p>
          </div>
        </div>

        {/* Linha fina de progresso no topo */}
        <div className="w-full h-1 bg-[var(--border-color)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#7C3AED] to-blue-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.min(100, Math.max(2, (totalRevenue / 1000000) * 100))}%` }}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SECTION TITLE                                                          */}
      {/* ========================================================================= */}
      <div className="space-y-1 pt-2">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Sua Jornada de Conquistas
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
          Cada meta alcançada traz recompensas exclusivas para você
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 3. TIMELINE VERTICAL DE CONQUISTAS (DESIGN FIEL AOS PRINTS)               */}
      {/* ========================================================================= */}
      <div className="relative pl-6 sm:pl-10 space-y-6">
        {/* Linha vertical conectora */}
        <div className="absolute left-[11px] sm:left-[19px] top-6 bottom-6 w-[2px] bg-dashed border-l-2 border-dashed border-[var(--border-color)] pointer-events-none" />

        {MILESTONES.map((milestone) => {
          const isConquered = totalRevenue >= milestone.target;
          const isCurrentTarget = nextMilestone.id === milestone.id && !isConquered;
          const needed = Math.max(0, milestone.target - totalRevenue);
          const percent = milestone.target > 0 ? Math.min(100, Math.round((totalRevenue / milestone.target) * 100)) : 100;

          return (
            <div key={milestone.id} className="relative group">
              {/* NÓ DO TIMELINE (Ícone / Número à esquerda) */}
              <div
                className={`absolute -left-6 sm:-left-10 top-6 -translate-x-1/2 w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm z-10 transition-all ${
                  isConquered
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-4 ring-[var(--bg-main)]'
                    : isCurrentTarget
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 ring-4 ring-blue-500/20'
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-color)] ring-4 ring-[var(--bg-main)]'
                }`}
              >
                {isConquered ? (
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isCurrentTarget ? (
                  <span>{milestone.id}</span>
                ) : (
                  <span className="text-xs">🔒</span>
                )}
              </div>

              {/* CARD DE CONQUISTA */}
              <div
                className={`rounded-2xl border p-4 sm:p-6 transition-all relative overflow-hidden ${
                  isCurrentTarget
                    ? 'border-blue-500/70 bg-[var(--bg-surface)] shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/30'
                    : isConquered
                    ? 'border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-slate-600 shadow-sm'
                    : 'border-[var(--border-color)] bg-[var(--bg-surface)]/60 opacity-90'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  {/* LADO ESQUERDO: IMAGEM/MOCKUP + TEXTOS */}
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6 min-w-0">
                    {/* VISUAL MOCKUP DO MARCO */}
                    <div className="w-20 h-24 sm:w-24 sm:h-28 shrink-0 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] overflow-hidden flex items-center justify-center relative p-1.5 shadow-inner">
                      {milestone.type === 'community' && (
                        <div className="w-full h-full flex items-center justify-center relative">
                          {/* Miniatura representativa de dois celulares */}
                          <div className="w-9 h-16 bg-gray-950 rounded-lg border border-gray-700 shadow-md flex flex-col p-1 transform -rotate-6">
                            <div className="w-full h-1 bg-gray-800 rounded mb-1" />
                            <div className="w-full flex-1 bg-blue-950/60 rounded flex items-center justify-center text-[8px]">
                              👥
                            </div>
                          </div>
                          <div className="w-9 h-16 bg-gray-900 rounded-lg border border-gray-600 shadow-xl flex flex-col p-1 -ml-3 z-10">
                            <div className="w-full h-1 bg-gray-800 rounded mb-1" />
                            <div className="w-full flex-1 bg-emerald-950/60 rounded flex items-center justify-center text-[8px]">
                              💬
                            </div>
                          </div>
                        </div>
                      )}

                      {milestone.type === 'whatsapp' && (
                        <div className="w-11 h-20 bg-gray-950 rounded-xl border border-gray-700 shadow-lg flex flex-col p-1">
                          <div className="w-full h-1.5 bg-gray-800 rounded-full mb-1" />
                          <div className="w-full flex-1 bg-emerald-950/40 rounded flex flex-col justify-end p-1 space-y-1 text-[7px] text-emerald-400">
                            <div className="w-3/4 h-2 bg-emerald-900/60 rounded self-start" />
                            <div className="w-3/4 h-2 bg-emerald-600/60 rounded self-end" />
                          </div>
                        </div>
                      )}

                      {milestone.type === 'bracelet' && (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <div className="w-14 h-6 rounded-full border-4 border-blue-500 flex items-center justify-center transform -rotate-12 shadow-md">
                            <span className="text-[7px] font-black text-white tracking-widest">OTTER</span>
                          </div>
                        </div>
                      )}

                      {milestone.type === 'plaque' && (
                        <div className="w-full h-full flex items-center justify-center p-1">
                          {milestone.imageSrc ? (
                            <img
                              src={milestone.imageSrc}
                              alt={milestone.name}
                              className="w-full h-full object-contain drop-shadow-md"
                            />
                          ) : (
                            <div className="w-12 h-16 rounded-md bg-gradient-to-t from-gray-900 to-gray-800 border border-gray-600 flex flex-col items-center justify-center p-1 shadow-lg">
                              <span className="text-[8px] font-black text-amber-400">OTTERFY</span>
                              <span className="text-xs">🏆</span>
                              <span className="text-[7px] font-bold text-gray-300">{milestone.level}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* TEXTOS E INFORMAÇÕES */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--text-secondary)]">
                          {milestone.name}
                        </span>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-muted)]">
                          {milestone.tag}
                        </span>
                      </div>

                      <h3
                        className={`text-base sm:text-lg font-extrabold tracking-tight ${
                          isCurrentTarget
                            ? 'text-blue-400'
                            : isConquered
                            ? 'text-[var(--text-primary)]'
                            : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {milestone.heading}
                      </h3>

                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-xl">
                        {milestone.description}
                      </p>

                      {/* Botões para Comunidade (Milestone 1) */}
                      {milestone.type === 'community' && (
                        <div className="flex flex-wrap items-center gap-2.5 pt-2">
                          <a
                            href={milestone.whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] transition-all cursor-pointer shadow-sm"
                          >
                            <span className="text-emerald-400 text-sm">💬</span>
                            <span>Entrar no WhatsApp</span>
                          </a>
                          <a
                            href={milestone.discordLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] transition-all cursor-pointer shadow-sm"
                          >
                            <span className="text-indigo-400 text-sm">🎮</span>
                            <span>Entrar no Discord</span>
                          </a>
                        </div>
                      )}

                      {/* Pill "Você está aqui" no marco atual */}
                      {isCurrentTarget && (
                        <div className="pt-1.5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>Você está aqui</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* LADO DIREITO: STATUS OU FALTAM R$ / CONQUISTADO */}
                  <div className="md:text-right shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border-color)] flex md:flex-col justify-between items-center md:items-end">
                    {isConquered ? (
                      milestone.target === 0 ? (
                        <span className="px-3 py-1.5 rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-400 font-bold text-xs">
                          Conquistado
                        </span>
                      ) : (
                        <div className="space-y-1.5 md:text-right">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold text-xs">
                            <span>✓</span> Conquistado
                          </span>
                          <div>
                            <button
                              type="button"
                              onClick={() => setClaimModalMilestone(milestone)}
                              className="text-xs text-[#7C3AED] hover:underline font-semibold block"
                            >
                              Solicitar Envio 📦
                            </button>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-wider uppercase block">
                          FALTAM
                        </span>
                        <div className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                          {formatMZN(needed)}
                        </div>
                        <span className="text-xs text-[var(--text-muted)] block">
                          {percent}% do caminho
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. DÚVIDAS FREQUENTES (FAQ)                                              */}
      {/* ========================================================================= */}
      <div className="pt-6 border-t border-[var(--border-color)] space-y-5">
        <h3 className="text-lg font-bold text-[var(--text-primary)]">
          Dúvidas frequentes
        </h3>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-xs sm:text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors"
                >
                  <span>{faq.question}</span>
                  <span className={`text-xs text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                {isOpen && (
                  <div className="p-4 pt-1 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-color)] bg-[var(--bg-input)]/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: SOLICITAR RESGATE DE TROFÉU / PULSEIRA                            */}
      {/* ========================================================================= */}
      {claimModalMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1B26]">
              <div>
                <h3 className="text-base font-bold text-white">
                  Resgatar {claimModalMilestone.name}
                </h3>
                <p className="text-xs text-gray-400">
                  Parabéns pelo marco de {formatMZN(claimModalMilestone.target)} faturados!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setClaimModalMilestone(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {claimSuccess ? (
              <div className="py-8 text-center space-y-2">
                <span className="text-4xl">🎉</span>
                <h4 className="text-base font-bold text-white">Solicitação Recebida com Sucesso!</h4>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  Nossa equipe de logística preparará seu troféu e entrará em contato via WhatsApp para confirmar o rastreio.
                </p>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Nome completo para gravação</label>
                  <input
                    type="text"
                    required
                    placeholder="Pedro Filipe"
                    value={shippingAddress.name}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#0F0E14] border border-[#1E1B26] text-sm text-white focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Telefone para contato</label>
                    <input
                      type="text"
                      required
                      placeholder="+258 84 XXX XXXX"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#0F0E14] border border-[#1E1B26] text-sm text-white focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Província / Região</label>
                    <select
                      value={shippingAddress.province}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, province: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#0F0E14] border border-[#1E1B26] text-sm text-white focus:outline-none focus:border-[#7C3AED]"
                    >
                      <option value="Maputo Cidade">Maputo Cidade</option>
                      <option value="Maputo Província">Maputo Província</option>
                      <option value="Gaza">Gaza</option>
                      <option value="Inhambane">Inhambane</option>
                      <option value="Sofala">Sofala</option>
                      <option value="Manica">Manica</option>
                      <option value="Tete">Tete</option>
                      <option value="Zambézia">Zambézia</option>
                      <option value="Nampula">Nampula</option>
                      <option value="Cabo Delgado">Cabo Delgado</option>
                      <option value="Niassa">Niassa</option>
                      <option value="Portugal">Portugal (Envio Internacional)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Endereço de entrega completo</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Bairro, Rua, Número da casa ou Ponto de referência"
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#0F0E14] border border-[#1E1B26] text-sm text-white focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setClaimModalMilestone(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-white text-gray-900 font-bold text-xs hover:opacity-90 active:scale-95 cursor-pointer shadow-md"
                  >
                    Confirmar Envio Gratuito
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
