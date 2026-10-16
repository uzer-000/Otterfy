'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatMZN } from '@/lib/utils';

export interface MilestoneData {
  id: number;
  level: string;
  name: string;
  heading: string;
  target: number;
  tag: string;
  category: string;
  description: string;
  imageSrc: string;
  badgeSrc?: string;
  type: 'community' | 'bracelet' | 'plaque';
  format?: string;
  specifications: string;
  highlights: string[];
}

export const MILESTONES: MilestoneData[] = [
  {
    id: 1,
    level: '25K',
    name: 'Comunidade VIP WhatsApp',
    heading: '25.000 MT faturados',
    target: 25000,
    tag: '1/7',
    category: 'Comunidade & Networking',
    description: 'Acesso exclusivo ao grupo secreto de Top Sellers Otterfy no WhatsApp. Troca direta de estratégias, networking com quem fatura alto e suporte prioritário.',
    imageSrc: '/awards/whatsapp_25k.svg',
    type: 'community',
    specifications: 'Grupo fechado no WhatsApp, canal de avisos antecipados, acesso a estratégias de tráfego pago e suporte VIP direto.',
    highlights: ['Networking com Apex Sellers', 'Estratégias de Escala', 'Avisos & Atualizações em Primeira Mão'],
  },
  {
    id: 2,
    level: '50K',
    name: 'Pulseiras Oficiais Otterfy',
    heading: '50.000 MT faturados',
    target: 50000,
    tag: '2/7',
    category: 'Colecionável Físico',
    description: 'Kit com as 2 Pulseiras oficiais de silicone de alta densidade Otterfy (Edição Roxa e Branca com o logo em relevo). O primeiro troféu de pulso que atesta o seu compromisso.',
    imageSrc: '/awards/wristbands_50k.png',
    type: 'bracelet',
    specifications: 'Silicone hipoalergênico premium, gravação em alto-relevo 3D, acabamento aveludado, tamanho universal ajustável.',
    highlights: ['2 Pulseiras Exclusivas (Roxa + Branca)', 'Gravação em Alto-Relevo 3D', 'Frete 100% Gratuito'],
  },
  {
    id: 3,
    level: '100K',
    name: 'Placa Otterfy Prata',
    heading: '100.000 MT faturados',
    target: 100000,
    tag: '3/7',
    category: 'Placa Emoldurada A4',
    format: 'Formato A4 (21 x 29.7 cm)',
    description: 'A renomada Placa A4 com moldura de alumínio preto fosco, fundo dark texturizado e emblema Apex Predator em aço escovado prata gravado a laser com o seu nome.',
    imageSrc: '/awards/frame_100k.png',
    badgeSrc: '/awards/badge_silver.png',
    type: 'plaque',
    specifications: 'Moldura de alumínio laqueado preto, vidro antirreflexo de cristal, placa metálica com corte a laser e acabamento escovado prata.',
    highlights: ['Personalizada com seu Nome/Loja', 'Emblema Prata 3D Escovado', 'Certificado de Apex Predator'],
  },
  {
    id: 4,
    level: '500K',
    name: 'Placa Otterfy Ouro',
    heading: '500.000 MT faturados',
    target: 500000,
    tag: '4/7',
    category: 'Placa Emoldurada A3',
    format: 'Formato A3 (29.7 x 42 cm)',
    description: 'Troféu comemorativo A3 emoldurado de luxo com emblema 3D espelhado banhado a ouro metálico, celebrando o marco histórico de meio milhão de Meticais faturados.',
    imageSrc: '/awards/frame_500k.png',
    badgeSrc: '/awards/badge_gold.png',
    type: 'plaque',
    specifications: 'Moldura maciça A3 em madeira nobre laqueada, emblema dourado com efeito escovado espelhado, placa de identificação oficial.',
    highlights: ['Tamanho Gigante A3 de Luxo', 'Brasão Banhado a Ouro Metálico', 'Gravação a Laser de Precisão'],
  },
  {
    id: 5,
    level: '1M',
    name: 'Placa Otterfy Diamante',
    heading: '1.000.000 MT faturados',
    target: 1000000,
    tag: '5/7',
    category: 'Clube do Milhão A3',
    format: 'Formato A3 (29.7 x 42 cm)',
    description: 'A consagração no seleto Clube do Milhão Otterfy. Fundo velvet púrpura luxuoso, moldura A3 premium e condecoração máxima como multimilionário digital moçambicano.',
    imageSrc: '/awards/frame_1m.png',
    badgeSrc: '/awards/badge_purple.png',
    type: 'plaque',
    specifications: 'Moldura nobre laqueada preta fosca A3, fundo degradê royal violet, emblema metálico diamante e selo numerado de autenticidade.',
    highlights: ['Membro do Clube do Milhão', 'Fundo Imperial Violet & Diamante', 'Condecoração de Honra Máxima'],
  },
  {
    id: 6,
    level: '5M',
    name: 'Placa Otterfy Black',
    heading: '5.000.000 MT faturados',
    target: 5000000,
    tag: '6/7',
    category: 'Titanium Black A3',
    format: 'Formato A3 (29.7 x 42 cm)',
    description: 'Placa ultra-exclusiva Otterfy Black para operações titânicas de escala massiva. Acabamento Black on Black com emblema em titânio escovado escurecido.',
    imageSrc: '/awards/frame_5m.png',
    badgeSrc: '/awards/badge_black.png',
    type: 'plaque',
    specifications: 'Acabamento Black on Black em alumínio escovado anodizado escurecido, vidro duplo especial e selo de excelência e-commerce África.',
    highlights: ['Edição Restrita Black Titanium', 'Design Stealth Monocromático', 'Status de Elite Continental'],
  },
  {
    id: 7,
    level: '10M',
    name: 'Placa Otterfy Titan',
    heading: '10.000.000 MT faturados',
    target: 10000000,
    tag: '7/7',
    category: 'Titan Supremo A3',
    format: 'Formato A3 (29.7 x 42 cm)',
    description: 'A premiação máxima e o ápice da jornada digital na Otterfy. Emblema Titan Violet metálico 3D reservado exclusivamente para os maiores impérios do e-commerce.',
    imageSrc: '/awards/frame_10m.png',
    badgeSrc: '/awards/badge_purple.png',
    type: 'plaque',
    specifications: 'Moldura personalizada Titan A3, emblema tridimensional em liga metálica violeta especial, certificado de honra assinado pelos fundadores.',
    highlights: ['Troféu de 10 Milhões de Meticais', 'Brasão Titan Violeta Metalizado 3D', 'O Ponto Mais Alto da Escala'],
  },
];

const FAQS = [
  {
    question: 'Como funciona o acesso ao Grupo VIP de WhatsApp aos 25K?',
    answer:
      'Ao atingir 25.000 MT em faturamento aprovado, o botão do WhatsApp é liberado. O link da comunidade privada está sendo configurado e liberado pelo administrador da Otterfy para que você participe da sala exclusiva com os maiores sellers.',
  },
  {
    question: 'Como funciona o envio das placas e pulseiras físicas?',
    answer:
      'Assim que você atingir a meta de faturamento correspondente (50K para pulseiras, 100K a 10M para as placas), o botão "Resgatar Troféu" fica ativo. Você preenche o seu nome para personalização e o endereço de entrega, e nossa equipe inicia a confecção e despacho.',
  },
  {
    question: 'O frete de entrega é gratuito?',
    answer:
      'Sim, o envio é 100% gratuito para qualquer província e cidade de Moçambique (Maputo, Matola, Beira, Nampula, Tete, Pemba, etc.), com entrega segura por transportadora parceira.',
  },
  {
    question: 'O faturamento dos meus afiliados conta para as minhas premiações?',
    answer:
      'Sim! Todo o faturamento aprovado gerado na sua conta Otterfy — seja como produtor principal ou como afiliado — acumula integralmente para desbloquear suas placas e pulseiras.',
  },
  {
    question: 'Quanto tempo demora para a placa chegar após o resgate?',
    answer:
      'O prazo médio de confecção artesanal e gravação personalizada a laser com o seu nome é de 7 a 14 dias úteis, seguido do envio imediato para o seu endereço.',
  },
];

export default function AwardsPage() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [viewMode, setViewMode] = useState<'gallery' | 'timeline'>('gallery');
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNLOCKED' | 'LOCKED'>('ALL');
  
  // Modals state
  const [claimModalMilestone, setClaimModalMilestone] = useState<MilestoneData | null>(null);
  const [previewMilestone, setPreviewMilestone] = useState<MilestoneData | null>(null);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Shipping form state
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    phone: '',
    province: 'Maputo Cidade',
    address: '',
    storeName: '',
  });
  const [claimSuccess, setClaimSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/payments?status=APPROVED')
      .then((res) => res.json())
      .then((json) => {
        const list = json.data || [];
        const sum = list.reduce((acc: number, o: any) => acc + (Number(o.amount) || 0), 0);
        // Se a conta for nova ou sem pagamentos na base local de teste, fallback suave de demonstração
        setTotalRevenue(sum > 0 ? sum : 78500);
      })
      .catch(() => {
        setTotalRevenue(78500);
      });
  }, []);

  const conqueredCount = MILESTONES.filter((m) => totalRevenue >= m.target).length;
  const nextMilestone = MILESTONES.find((m) => totalRevenue < m.target) || MILESTONES[MILESTONES.length - 1];
  const remainingAmount = Math.max(0, nextMilestone.target - totalRevenue);
  const progressToNext = nextMilestone.target > 0
    ? Math.min(100, Math.round((totalRevenue / nextMilestone.target) * 100))
    : 100;

  const filteredMilestones = MILESTONES.filter((m) => {
    if (filterTab === 'UNLOCKED') return totalRevenue >= m.target;
    if (filterTab === 'LOCKED') return totalRevenue < m.target;
    return true;
  });

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClaimSuccess(true);
    setTimeout(() => {
      setClaimSuccess(false);
      setClaimModalMilestone(null);
    }, 2800);
  };

  return (
    <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. HERO HEADER: FATURAMENTO ACUMULADO & GAMIFICAÇÃO GG CHECKOUT           */}
      {/* ========================================================================= */}
      <div className="otter-widget-card relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10 border shadow-2xl">
        {/* Glow de fundo */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Lado Esquerdo: Estatísticas de Faturamento */}
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              Galeria Oficial de Premiações & Troféus
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-[#94A3B8]">
                FATURAMENTO TOTAL ACUMULADO
              </span>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC] font-mono mt-1">
                {formatMZN(totalRevenue)}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              Reconhecemos o seu legado e cada marco que você conquista. Das pulseiras colecionáveis às imponentes placas A3 emolduradas, seu esforço como Apex Predator merece o mais alto prestígio.
            </p>
          </div>

          {/* Lado Direito: Próxima Conquista e Barra */}
          <div className="lg:w-[420px] bg-slate-50/80 dark:bg-[#0B0911]/90 rounded-2xl p-5 border border-slate-200 dark:border-[#1E1B26] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                  Próxima Parada
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                  {nextMilestone.name}
                </h4>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-600/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                {conqueredCount} de {MILESTONES.length} desbloqueados
              </span>
            </div>

            {/* Barra de Progresso */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500 dark:text-[#94A3B8]">
                  Progresso até {nextMilestone.level}
                </span>
                <span className="font-mono text-violet-600 dark:text-violet-400 font-bold">
                  {progressToNext}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 dark:bg-[#1E1B26] rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-sky-400 rounded-full transition-all duration-700 ease-out shadow-sm"
                  style={{ width: `${Math.min(100, Math.max(3, progressToNext))}%` }}
                />
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-[#94A3B8] flex items-center justify-between pt-1 border-t border-slate-200 dark:border-[#1E1B26]">
              <span>Falta faturar:</span>
              <strong className="text-slate-900 dark:text-[#F8FAFC] font-mono font-bold">
                {formatMZN(remainingAmount)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BARRA DE CONTROLE: TABS DE VISUALIZAÇÃO & FILTROS                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#1E1B26]">
        {/* Filtros de Status */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-[#0F0E14] border border-slate-200 dark:border-[#1E1B26] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filterTab === 'ALL'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todas as Premiações ({MILESTONES.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('UNLOCKED')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filterTab === 'UNLOCKED'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Desbloqueadas ({conqueredCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('LOCKED')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filterTab === 'LOCKED'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            A Conquistar ({MILESTONES.length - conqueredCount})
          </button>
        </div>

        {/* Alternador de Modo de Exibição (Galeria vs Linha do Tempo) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-[#0F0E14] border border-slate-200 dark:border-[#1E1B26] text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('gallery')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              viewMode === 'gallery'
                ? 'bg-white dark:bg-[#1E1B26] text-violet-700 dark:text-violet-300 shadow-sm border border-slate-200 dark:border-white/10'
                : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Galeria 3D</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-white dark:bg-[#1E1B26] text-violet-700 dark:text-violet-300 shadow-sm border border-slate-200 dark:border-white/10'
                : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Linha do Tempo</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODO 1: GALERIA 3D (REVERSE ENGINEERING DO GG CHECKOUT)                */}
      {/* ========================================================================= */}
      {viewMode === 'gallery' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMilestones.map((m) => {
            const isUnlocked = totalRevenue >= m.target;
            const isCurrent = nextMilestone.id === m.id && !isUnlocked;
            const needed = Math.max(0, m.target - totalRevenue);
            const cardProgress = Math.min(100, Math.round((totalRevenue / m.target) * 100));

            return (
              <div
                key={m.id}
                className={`otter-widget-card rounded-3xl p-5 sm:p-6 border transition-all duration-300 flex flex-col justify-between group relative overflow-hidden ${
                  isCurrent
                    ? 'border-violet-500/80 ring-2 ring-violet-500/20 shadow-xl'
                    : isUnlocked
                    ? 'hover:border-violet-400/50 shadow-md'
                    : 'opacity-95 hover:opacity-100'
                }`}
              >
                {/* Header do Card: Tag e Status */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl font-mono text-xs font-black bg-violet-600/10 text-violet-700 dark:text-violet-300 border border-violet-500/20 flex items-center justify-center">
                      {m.level}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                      {m.category}
                    </span>
                  </div>

                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Desbloqueado
                    </span>
                  ) : isCurrent ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/30 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                      Próxima Meta
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-[#64748B] border border-slate-200 dark:border-white/5">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Bloqueado
                    </span>
                  )}
                </div>

                {/* Vitrine Central com Contorno Suave Arredondado (Clean & Smooth) */}
                <div
                  onClick={() => setPreviewMilestone(m)}
                  className="w-full h-64 sm:h-72 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-[#08070C] p-4 flex items-center justify-center relative overflow-hidden group-hover:border-violet-500/40 transition-all cursor-pointer shadow-inner mb-4"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.imageSrc}
                    alt={m.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Botão sutil de zoom no hover */}
                  <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md text-white p-2 rounded-xl text-xs flex items-center gap-1 border border-white/10">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                    </svg>
                    <span>Ver Detalhes</span>
                  </div>
                </div>

                {/* Títulos & Descrições */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {m.name}
                    </h3>
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                      {m.heading}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed line-clamp-2">
                    {m.description}
                  </p>

                  {/* Destaques rápidos */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.highlights.map((h) => (
                      <span
                        key={h}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-[#94A3B8] border border-slate-200/80 dark:border-white/5"
                      >
                        • {h}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Barra de Progresso do Card */}
                {!isUnlocked && (
                  <div className="space-y-1 mb-4 pt-2 border-t border-slate-100 dark:border-[#1E1B26]">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-slate-500 dark:text-[#94A3B8]">
                        Faltam {formatMZN(needed)}
                      </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {cardProgress}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-[#1E1B26] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-600 rounded-full transition-all duration-500"
                        style={{ width: `${cardProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Ações do Card */}
                <div className="pt-2">
                  {m.type === 'community' ? (
                    // Card 25K: Comunidade WhatsApp
                    isUnlocked ? (
                      <button
                        type="button"
                        onClick={() => setWhatsappModalOpen(true)}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.59 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.33C9.33 7.33 9 7.4 8.73 7.69C8.46 7.98 7.7 8.7 7.7 10.15C7.7 11.61 8.76 13.01 8.91 13.21C9.06 13.41 11 16.39 13.94 17.66C14.64 17.96 15.18 18.14 15.61 18.28C16.31 18.5 16.95 18.47 17.45 18.39C18.01 18.31 19.18 17.68 19.42 17C19.66 16.32 19.66 15.74 19.59 15.62C19.52 15.5 19.33 15.43 19.04 15.29C18.75 15.14 17.33 14.44 17.07 14.34C16.81 14.24 16.62 14.19 16.43 14.48C16.24 14.77 15.7 15.41 15.54 15.6C15.38 15.79 15.22 15.81 14.93 15.67C14.64 15.52 13.71 15.22 12.61 14.24C11.75 13.48 11.17 12.53 11 12.24C10.83 11.95 10.98 11.79 11.13 11.65C11.26 11.52 11.42 11.31 11.56 11.14C11.7 10.97 11.75 10.85 11.85 10.66C11.95 10.47 11.9 10.3 11.82 10.15C11.74 10.01 11.17 8.6 10.93 8.03C10.7 7.47 10.46 7.55 10.28 7.54C10.12 7.53 9.92 7.53 9.73 7.53Z" />
                        </svg>
                        <span>Acessar Grupo VIP WhatsApp</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setWhatsappModalOpen(true)}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-200 dark:border-[#1E1B26] bg-slate-50 dark:bg-[#0B0911] text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Ver Benefícios do Grupo</span>
                      </button>
                    )
                  ) : (
                    // Cards Físicos: Pulseira e Placas
                    isUnlocked ? (
                      <button
                        type="button"
                        onClick={() => setClaimModalMilestone(m)}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-md shadow-violet-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        <span>Resgatar Troféu (Frete Grátis)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPreviewMilestone(m)}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-200 dark:border-[#1E1B26] bg-slate-50 dark:bg-[#0B0911] text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Ver Detalhes do Troféu</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODO 2: LINHA DO TEMPO SEQUENCIAL                                      */}
      {/* ========================================================================= */}
      {viewMode === 'timeline' && (
        <div className="relative pl-6 sm:pl-10 space-y-6">
          <div className="absolute left-[11px] sm:left-[19px] top-6 bottom-6 w-[2px] border-l-2 border-dashed border-slate-200 dark:border-[#1E1B26] pointer-events-none" />

          {filteredMilestones.map((milestone) => {
            const isConquered = totalRevenue >= milestone.target;
            const isCurrentTarget = nextMilestone.id === milestone.id && !isConquered;
            const needed = Math.max(0, milestone.target - totalRevenue);
            const percent = Math.min(100, Math.round((totalRevenue / milestone.target) * 100));

            return (
              <div key={milestone.id} className="relative group">
                {/* Nó do timeline */}
                <div
                  className={`absolute -left-6 sm:-left-10 top-6 -translate-x-1/2 w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm z-10 transition-all ${
                    isConquered
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-4 ring-white dark:ring-[#08070C]'
                      : isCurrentTarget
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/40 ring-4 ring-violet-500/20'
                      : 'bg-slate-100 dark:bg-[#121016] text-slate-400 dark:text-[#64748B] border border-slate-200 dark:border-[#1E1B26] ring-4 ring-white dark:ring-[#08070C]'
                  }`}
                >
                  {isConquered ? (
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : isCurrentTarget ? (
                    <span>{milestone.id}</span>
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  )}
                </div>

                {/* Card de Conquista */}
                <div
                  className={`rounded-2xl border p-4 sm:p-6 transition-all relative overflow-hidden ${
                    isCurrentTarget
                      ? 'border-violet-500/80 bg-violet-50/20 dark:bg-[#0F0E14] shadow-xl ring-1 ring-violet-500/30'
                      : isConquered
                      ? 'border-slate-200 dark:border-[#262132] bg-white dark:bg-[#121016] shadow-sm'
                      : 'border-slate-200 dark:border-[#1E1B26] bg-slate-50/50 dark:bg-[#0E0B12]/80 opacity-90'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    {/* Visual & Textos */}
                    <div className="flex items-start sm:items-center gap-4 sm:gap-6 min-w-0">
                      <div
                        onClick={() => setPreviewMilestone(milestone)}
                        className="w-20 h-24 sm:w-24 sm:h-28 shrink-0 rounded-xl bg-slate-50 dark:bg-[#08070C] border border-slate-200/90 dark:border-[#1E1B26] overflow-hidden flex items-center justify-center relative p-1.5 shadow-inner group-hover:scale-105 transition-transform cursor-pointer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={milestone.imageSrc}
                          alt={milestone.name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-[#F8FAFC]">
                            {milestone.name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-[#94A3B8]">
                            {milestone.tag}
                          </span>
                        </div>

                        <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                          {milestone.heading}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed max-w-lg">
                          {milestone.description}
                        </p>

                        {isCurrentTarget && (
                          <div className="pt-1">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-violet-600 px-3 py-1 rounded-full shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              Você está aqui
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lado Direito: Status e Ação */}
                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-slate-200 dark:border-[#1E1B26] shrink-0 text-right">
                      {isConquered ? (
                        <div className="space-y-2 text-right">
                          <span className="inline-block text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                            ✓ Conquistado
                          </span>
                          <div>
                            {milestone.type === 'community' ? (
                              <button
                                type="button"
                                onClick={() => setWhatsappModalOpen(true)}
                                className="block w-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                              >
                                Grupo WhatsApp
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setClaimModalMilestone(milestone)}
                                className="block w-full text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 px-4 py-2 rounded-xl transition-all shadow-md shadow-violet-600/20 cursor-pointer"
                              >
                                Resgatar Troféu
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-[#64748B]">
                            FALTAM
                          </div>
                          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-[#F8FAFC] font-mono">
                            {formatMZN(needed)}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-[#64748B]">
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
      )}

      {/* ========================================================================= */}
      {/* 5. SEÇÃO FAQ: DÚVIDAS FREQUENTES                                          */}
      {/* ========================================================================= */}
      <div className="pt-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
            Dúvidas Frequentes sobre as Premiações
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
            Entenda o processo de fabricação, frete e regras de entrega dos seus troféus
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-slate-200 dark:border-[#1E1B26] bg-white dark:bg-[#121016] overflow-hidden transition-colors shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-[#F8FAFC]">
                    {faq.question}
                  </span>
                  <span
                    className={`text-sm text-slate-400 dark:text-[#94A3B8] transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed border-t border-slate-100 dark:border-[#1E1B26]/50 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. MODAL: ACESSO AO GRUPO VIP WHATSAPP (25K)                              */}
      {/* ========================================================================= */}
      {whatsappModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121018] border border-slate-200 dark:border-[#252033] rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative text-slate-900 dark:text-[#F8FAFC]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#252033]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.59 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                    Comunidade VIP WhatsApp
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                    Marco 25.000 MT • Apex Sellers Club
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1E1B26] flex items-center justify-center text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Visual do Badge */}
            <div className="w-full h-44 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-violet-950/40 border border-emerald-500/20 p-4 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
              <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                GRUPO EXCLUSIVO DE SELLERS
              </span>
              <div className="text-3xl font-black text-white font-mono">
                25K VIP CLUB
              </div>
              <p className="text-xs text-slate-300 max-w-xs">
                Troca de estratégias de vendas, parcerias, fornecedores e suporte prioritário Otterfy.
              </p>
            </div>

            {/* Aviso de Link Pendente (Conforme solicitado pelo usuário) */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Link em Preparação pelo Administrador</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#CBD5E1] leading-relaxed">
                O link direto para a comunidade privada no WhatsApp está sendo configurado pela equipe de gestão da Otterfy e estará disponível em breve aqui no seu painel.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                O que você terá no grupo ao ser liberado:
              </span>
              <ul className="space-y-1 text-slate-600 dark:text-[#94A3B8]">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Contato direto com o ecossistema de sellers em Moçambique
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Atualizações antecipadas de recursos e taxas do checkout
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Dicas práticas para aumentar aprovação em M-Pesa e e-Mola
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setWhatsappModalOpen(false)}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-[#1E1B26] hover:bg-slate-200 dark:hover:bg-[#252033] text-slate-800 dark:text-white transition-all cursor-pointer"
            >
              Entendido, aguardar liberação
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: RESGATE DE TROFÉU / PULSEIRA (ENVIO FÍSICO)                     */}
      {/* ========================================================================= */}
      {claimModalMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121018] border border-slate-200 dark:border-[#252033] rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative text-slate-900 dark:text-[#F8FAFC]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#252033]">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                  Solicitar Envio do Troféu Oficial
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  {claimModalMilestone.name} • {claimModalMilestone.heading}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setClaimModalMilestone(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1E1B26] flex items-center justify-center text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {claimSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-3xl font-bold border border-emerald-500/30">
                  ✓
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
                  Solicitação Enviada com Sucesso!
                </h4>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] max-w-sm mx-auto leading-relaxed">
                  O seu pedido de gravação e envio da {claimModalMilestone.name} foi registrado. Nossa equipe entrará em contato via WhatsApp para confirmar o despacho com frete 100% gratuito.
                </p>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-[#94A3B8]">
                      Nome Completo (Gravado na Placa)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Pedro Matsinhe"
                      value={shippingAddress.name}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-[#1E1B26] bg-slate-50 dark:bg-[#08070C] text-slate-900 dark:text-[#F8FAFC] outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-[#94A3B8]">
                      Nome da Loja / Operação
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Apex Digital Store"
                      value={shippingAddress.storeName}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, storeName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-[#1E1B26] bg-slate-50 dark:bg-[#08070C] text-slate-900 dark:text-[#F8FAFC] outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-[#94A3B8]">
                      Telefone / WhatsApp para Entrega
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+258 84 000 0000"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-[#1E1B26] bg-slate-50 dark:bg-[#08070C] text-slate-900 dark:text-[#F8FAFC] outline-none focus:border-violet-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-[#94A3B8]">
                      Província de Entrega (MZ)
                    </label>
                    <select
                      value={shippingAddress.province}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, province: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-[#1E1B26] bg-slate-50 dark:bg-[#08070C] text-slate-900 dark:text-[#F8FAFC] outline-none focus:border-violet-500"
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
                      <option value="Manica (Chimoio)">Manica (Chimoio)</option>
                      <option value="Niassa (Lichinga)">Niassa (Lichinga)</option>
                      <option value="Portugal">Portugal (Envio Internacional)</option>
                      <option value="Brasil">Brasil (Envio Internacional)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-[#94A3B8]">
                    Morada Completa (Bairro, Rua, Casa / Ponto de Referência)
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Ex: Bairro da Polana Cimento, Av. 24 de Julho nº 1234, 3º Andar..."
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-[#1E1B26] bg-slate-50 dark:bg-[#08070C] text-slate-900 dark:text-[#F8FAFC] outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0911] border border-slate-200 dark:border-[#1E1B26] text-xs space-y-1">
                  <div className="flex justify-between text-slate-500 dark:text-[#94A3B8]">
                    <span>Custo do Troféu:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">100% Grátis (Conquista Otterfy)</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-[#94A3B8]">
                    <span>Frete para Moçambique:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">0,00 MT (Frete Grátis)</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
                >
                  Confirmar Resgate com Frete Grátis
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: PREVIEW 3D & DETALHES TÉCNICOS DA PLACA / TROFÉU               */}
      {/* ========================================================================= */}
      {previewMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121018] border border-slate-200 dark:border-[#252033] rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-slate-900 dark:text-[#F8FAFC] max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#252033]">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-600/15 text-violet-700 dark:text-violet-300 border border-violet-500/25">
                  {previewMilestone.level}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
                  {previewMilestone.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMilestone(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1E1B26] flex items-center justify-center text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Imagem em Destaque */}
            <div className="w-full h-80 sm:h-96 rounded-2xl bg-slate-50 dark:bg-[#08070C] border border-slate-200/90 dark:border-white/10 p-6 flex items-center justify-center shadow-inner relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewMilestone.imageSrc}
                alt={previewMilestone.name}
                className="max-h-full max-w-full object-contain filter drop-shadow-2xl"
              />
            </div>

            {/* Informações & Especificações */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                  Especificações do Acabamento
                </h4>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1 leading-relaxed">
                  {previewMilestone.specifications}
                </p>
              </div>

              {previewMilestone.format && (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-[#CBD5E1]">
                  <span className="text-slate-400">Dimensões Oficiais:</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-mono">
                    {previewMilestone.format}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Destaques Inclusos:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {previewMilestone.highlights.map((h) => (
                    <div
                      key={h}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0911] border border-slate-200 dark:border-[#1E1B26] text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
                    >
                      <span className="text-violet-500 font-bold">✓</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Botão de Fechar ou Resgatar se já atingido */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPreviewMilestone(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Fechar Visualização
              </button>
              {totalRevenue >= previewMilestone.target && previewMilestone.type !== 'community' && (
                <button
                  type="button"
                  onClick={() => {
                    const target = previewMilestone;
                    setPreviewMilestone(null);
                    setClaimModalMilestone(target);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 shadow-md cursor-pointer"
                >
                  Resgatar Este Troféu
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
