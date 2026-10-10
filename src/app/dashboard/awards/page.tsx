'use client';

import React, { useState, useEffect } from 'react';
import { formatMZN } from '@/lib/utils';

export interface MilestoneData {
  id: number;
  level: string;
  name: string;
  heading: string;
  target: number;
  description: string;
  tag: string;
  imageSrc: string;
  type: 'bracelet' | 'plaque';
}

export const MILESTONES: MilestoneData[] = [
  {
    id: 1,
    level: '50K',
    name: 'Pulseira Bronze',
    heading: '50.000 MT faturados',
    target: 50000,
    tag: '1/6',
    description: 'Pulseira oficial de faturamento Otterfy para o pulso, entregue no seu endereço.',
    imageSrc: '/awards/50k.png',
    type: 'bracelet',
  },
  {
    id: 2,
    level: '100K',
    name: 'Placa Prata',
    heading: '100.000 MT faturados',
    target: 100000,
    tag: '2/6',
    description: 'Troféu em acrílico maciço com o seu marco de 100.000 MT gravado, entregue no seu endereço.',
    imageSrc: '/awards/100k.png',
    type: 'plaque',
  },
  {
    id: 3,
    level: '500K',
    name: 'Placa Ouro',
    heading: '500.000 MT faturados',
    target: 500000,
    tag: '3/6',
    description: 'Troféu em acrílico maciço com o seu marco de 500.000 MT gravado, entregue no seu endereço.',
    imageSrc: '/awards/500k.png',
    type: 'plaque',
  },
  {
    id: 4,
    level: '1M',
    name: 'Placa Diamante',
    heading: '1.000.000 MT faturados',
    target: 1000000,
    tag: '4/6',
    description: 'Clube do Milhão Otterfy. Acrílico maciço exclusivo, entregue no seu endereço.',
    imageSrc: '/awards/1m.png',
    type: 'plaque',
  },
  {
    id: 5,
    level: '5M',
    name: 'Placa Black',
    heading: '5.000.000 MT faturados',
    target: 5000000,
    tag: '5/6',
    description: 'Operação de alta escala nacional. Acrílico maciço escurecido de alta densidade.',
    imageSrc: '/awards/5m.png',
    type: 'plaque',
  },
  {
    id: 6,
    level: '10M',
    name: 'Placa Titan',
    heading: '10.000.000 MT faturados',
    target: 10000000,
    tag: '6/6',
    description: 'A última parada e premiação máxima de escala digital da Otterfy.',
    imageSrc: '/awards/10m.png',
    type: 'plaque',
  },
];

const FAQS = [
  {
    question: 'Como funciona o envio das placas e pulseiras?',
    answer:
      'Assim que você atingir a meta de faturamento correspondente, o botão de resgate será liberado para preencher os dados de entrega. O troféu em acrílico maciço é fabricado artesanalmente e enviado diretamente para a sua morada.',
  },
  {
    question: 'O frete de entrega é gratuito?',
    answer:
      'Sim! O envio é 100% gratuito para qualquer província de Moçambique e também para endereços internacionais em Portugal e Brasil.',
  },
  {
    question: 'O faturamento dos meus afiliados conta para as minhas conquistas?',
    answer:
      'Sim, conta todo o faturamento aprovado gerado como produtor ou como afiliado na sua conta Otterfy.',
  },
  {
    question: 'Quanto tempo demora para o troféu ou pulseira chegar?',
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

  // Determina conquistas oficiais da Otterfy
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
      {/* 1. TOP HEADER: FATURAMENTO TOTAL & PRÓXIMA PARADA (ESTILO EXACTO DO PRINT 4) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-[#94A3B8] uppercase">
              FATURAMENTO TOTAL
            </span>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#F8FAFC] mt-1 font-mono">
              {formatMZN(totalRevenue)}
            </div>
            <p className="text-xs text-[#94A3B8] font-medium mt-1.5">
              {remainingAmount > 0 ? (
                <>
                  <strong className="text-[#F8FAFC]">{formatMZN(remainingAmount)}</strong> para {nextMilestone.name} — {progressToNext}% do caminho
                </>
              ) : (
                'Todas as premiações oficiais foram alcançadas! Parabéns pela escala máxima!'
              )}
            </p>
          </div>

          <div className="text-left sm:text-right space-y-0.5">
            <span className="text-xs font-bold text-violet-400 bg-violet-600/10 px-3 py-1 rounded-full border border-violet-500/20">
              {conqueredCount} de {MILESTONES.length} conquistadas
            </span>
            <p className="text-xs text-[#94A3B8] pt-1.5">
              próxima parada: <strong className="text-[#F8FAFC]">{nextMilestone.name}</strong>
            </p>
          </div>
        </div>

        {/* Linha fina de progresso no topo */}
        <div className="w-full h-1 bg-[#1E1B26] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-sky-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.min(100, Math.max(2, (totalRevenue / 10000000) * 100))}%` }}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TÍTULO DA SEÇÃO                                                         */}
      {/* ========================================================================= */}
      <div className="space-y-1 pt-2">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Sua Jornada de Conquistas
        </h2>
        <p className="text-xs sm:text-sm text-[#94A3B8]">
          Cada meta alcançada traz recompensas exclusivas para você
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 3. TIMELINE VERTICAL DE CONQUISTAS (DESIGN 100% FIEL AO PRINT 4 & 5)      */}
      {/* ========================================================================= */}
      <div className="relative pl-6 sm:pl-10 space-y-6">
        {/* Linha vertical conectora tracejada */}
        <div className="absolute left-[11px] sm:left-[19px] top-6 bottom-6 w-[2px] border-l-2 border-dashed border-[#1E1B26] pointer-events-none" />

        {MILESTONES.map((milestone) => {
          const isConquered = totalRevenue >= milestone.target;
          const isCurrentTarget = nextMilestone.id === milestone.id && !isConquered;
          const needed = Math.max(0, milestone.target - totalRevenue);
          const percent = Math.min(100, Math.round((totalRevenue / milestone.target) * 100));

          return (
            <div key={milestone.id} className="relative group">
              {/* NÓ DO TIMELINE (Check azul / Número com brilho / Cadeado escuro) */}
              <div
                className={`absolute -left-6 sm:-left-10 top-6 -translate-x-1/2 w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm z-10 transition-all ${
                  isConquered
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-4 ring-[#08070C]'
                    : isCurrentTarget
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 ring-4 ring-blue-500/20'
                    : 'bg-[#121016] text-[#64748B] border border-[#1E1B26] ring-4 ring-[#08070C]'
                }`}
              >
                {isConquered ? (
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isCurrentTarget ? (
                  <span>{milestone.id}</span>
                ) : (
                  <svg className="w-3.5 h-3.5 text-[#64748B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
              </div>

              {/* CARD DE CONQUISTA */}
              <div
                className={`rounded-2xl border p-4 sm:p-6 transition-all relative overflow-hidden ${
                  isCurrentTarget
                    ? 'border-blue-500/70 bg-[#0F0E14] shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/30'
                    : isConquered
                    ? 'border-[#262132] bg-[#121016] hover:border-violet-500/40 shadow-sm'
                    : 'border-[#1E1B26] bg-[#0E0B12]/80 opacity-90'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  {/* LADO ESQUERDO: FOTO OFICIAL DO TROFÉU + TEXTOS */}
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6 min-w-0">
                    {/* VISUAL MOCKUP DO MARCO COM ARTE OFICIAL DE /AWARDS/ */}
                    <div className="w-20 h-24 sm:w-24 sm:h-28 shrink-0 rounded-xl bg-[#08070C] border border-[#1E1B26] overflow-hidden flex items-center justify-center relative p-1.5 shadow-inner group-hover:scale-105 transition-transform">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={milestone.imageSrc}
                        alt={milestone.name}
                        className={
                          milestone.type === 'bracelet'
                            ? "w-full h-full object-cover scale-125"
                            : "w-full h-full object-contain"
                        }
                      />
                    </div>

                    {/* TEXTOS DESCRITIVOS */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm sm:text-base text-[#F8FAFC]">
                          {milestone.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#94A3B8]">
                          {milestone.tag}
                        </span>
                      </div>

                      <div className="text-sm sm:text-base font-extrabold text-blue-400 font-mono">
                        {milestone.heading}
                      </div>

                      <p className="text-xs text-[#94A3B8] leading-relaxed max-w-lg">
                        {milestone.description}
                      </p>

                      {/* BADGE "VOCÊ ESTÁ AQUI" NO MARCO ATUAL */}
                      {isCurrentTarget && (
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-blue-600/90 hover:bg-blue-600 px-3 py-1 rounded-full shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            Você está aqui
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* LADO DIREITO: PROGRESSO OU BOTÃO DE RESGATE */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-[#1E1B26] shrink-0 text-right">
                    {isConquered ? (
                      <div className="space-y-2 text-right">
                        <span className="inline-block text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                          ✓ Conquistado
                        </span>
                        <div>
                          <button
                            type="button"
                            onClick={() => setClaimModalMilestone(milestone)}
                            className="block w-full text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 px-4 py-2 rounded-xl transition-all shadow-md shadow-violet-600/20 cursor-pointer"
                          >
                            Resgatar Prêmio
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">
                          FALTAM
                        </div>
                        <div className="text-base sm:text-lg font-black text-[#F8FAFC] font-mono">
                          {formatMZN(needed)}
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          {percent}% do caminho
                        </div>
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
      {/* 4. SEÇÃO FAQ: DÚVIDAS FREQUENTES (ACCORDION EXPANSÍVEL)                   */}
      {/* ========================================================================= */}
      <div className="pt-8 space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC]">
          Dúvidas frequentes
        </h3>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-[#1E1B26] bg-[#121016] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-semibold text-xs sm:text-sm text-[#F8FAFC]">
                    {faq.question}
                  </span>
                  <span
                    className={`text-sm text-[#94A3B8] transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs text-[#94A3B8] leading-relaxed border-t border-[#1E1B26]/50 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL DE RESGATE DE TROFÉU / PULSEIRA                                    */}
      {/* ========================================================================= */}
      {claimModalMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative text-[#F8FAFC]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1B26]">
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">
                  Solicitar Envio do Troféu
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  {claimModalMilestone.name} ({claimModalMilestone.heading})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setClaimModalMilestone(null)}
                className="w-8 h-8 rounded-full bg-[#1A1820] flex items-center justify-center text-[#94A3B8] hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {claimSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center text-2xl font-bold">
                  ✓
                </div>
                <h4 className="text-base font-bold text-[#F8FAFC]">
                  Solicitação Recebida com Sucesso!
                </h4>
                <p className="text-xs text-[#94A3B8]">
                  Nossa equipe de logística preparará a sua premiação oficial da Otterfy com envio 100% gratuito.
                </p>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#94A3B8]">Nome do Destinatário</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.name}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                    placeholder="Nome completo gravado na placa"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#08070C] border border-[#1E1B26] text-xs text-[#F8FAFC] focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#94A3B8]">Telefone para Contato / Entrega</label>
                  <input
                    type="tel"
                    required
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                    placeholder="+258 84 000 0000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#08070C] border border-[#1E1B26] text-xs text-[#F8FAFC] focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#94A3B8]">Província / Região</label>
                  <select
                    value={shippingAddress.province}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, province: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#08070C] border border-[#1E1B26] text-xs text-[#F8FAFC] focus:outline-none focus:border-violet-500"
                  >
                    <option value="Maputo Cidade">Maputo Cidade</option>
                    <option value="Maputo Província (Matola)">Maputo Província (Matola)</option>
                    <option value="Sofala (Beira)">Sofala (Beira)</option>
                    <option value="Nampula">Nampula</option>
                    <option value="Zambézia (Quelimane)">Zambézia (Quelimane)</option>
                    <option value="Tete">Tete</option>
                    <option value="Cabo Delgado (Pemba)">Cabo Delgado (Pemba)</option>
                    <option value="Gaza (Xai-Xai)">Gaza (Xai-Xai)</option>
                    <option value="Inhambane">Inhambane</option>
                    <option value="Niassa (Lichinga)">Niassa (Lichinga)</option>
                    <option value="Portugal">Portugal (Envio Internacional)</option>
                    <option value="Brasil">Brasil (Envio Internacional)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#94A3B8]">Endereço Completo</label>
                  <textarea
                    required
                    rows={3}
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                    placeholder="Bairro, Rua, Número da casa ou ponto de referência"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#08070C] border border-[#1E1B26] text-xs text-[#F8FAFC] focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
                >
                  Confirmar Resgate com Frete Grátis
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
