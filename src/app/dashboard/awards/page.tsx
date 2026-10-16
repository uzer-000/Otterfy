'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { formatMZN } from '@/lib/utils';

// Lazy-loaded 3D WebGL Three.js Inspector (ultra lightweight until clicked)
const PlaqueViewer3D = dynamic(() => import('@/components/dashboard/PlaqueViewer3D'), {
  ssr: false,
});

export interface ModelVariant {
  name: string;
  modelGlb: string;
  color?: string;
}

export interface MilestoneData {
  id: number;
  level: string;
  name: string;
  badgeTag: string;
  heading: string;
  target: number;
  tag: string;
  category: string;
  description: string;
  imageSrc: string;
  badgeSrc?: string;
  modelGlb?: string;
  variants?: ModelVariant[];
  type: 'starter_community' | 'community' | 'bracelet' | 'plaque';
  format?: string;
  specifications: string;
  highlights: string[];
}

export const MILESTONES: MilestoneData[] = [
  {
    id: 1,
    level: '0 MT',
    name: 'Comunidade Otterfy',
    badgeTag: 'Comunidade',
    heading: 'Cresça junto com quem já fatura',
    target: 0,
    tag: 'Starter',
    category: 'Comunidade & Networking',
    description: 'WhatsApp e canal exclusivo, com quem já está vendendo todo dia na Otterfy. Networking em tempo real, suporte e avisos oficiais.',
    imageSrc: '/awards/phone_mockup_whatsapp.svg',
    type: 'starter_community',
    specifications: 'Acesso imediato à comunidade de sellers, canal de novidades da plataforma e suporte.',
    highlights: ['Networking Aberto', 'Canal de Avisos', 'Acesso Imediato'],
  },
  {
    id: 2,
    level: '25K',
    name: 'Grupo Network WhatsApp',
    badgeTag: 'VIP Club',
    heading: '25.000 MT faturados',
    target: 25000,
    tag: '1/7',
    category: 'Comunidade VIP',
    description: 'Sala exclusiva no WhatsApp com os outros sellers de alta performance da plataforma. Troca de estratégias de tráfego e fornecedores.',
    imageSrc: '/awards/phone_mockup_whatsapp.svg',
    type: 'community',
    specifications: 'Grupo restrito a sellers com faturamento comprovado acima de 25.000 MT, com moderação e suporte prioritário.',
    highlights: ['Networking com Apex Sellers', 'Estratégias de Escala', 'Avisos & Atualizações em Primeira Mão'],
  },
  {
    id: 3,
    level: '50K',
    name: 'Pulseiras Otterfy',
    badgeTag: 'Colecionável',
    heading: '50.000 MT faturados',
    target: 50000,
    tag: '2/7',
    category: 'Colecionável Físico',
    description: 'Kit com as 2 Pulseiras oficiais de silicone de alta densidade Otterfy (Roxa e Branca com o logo em relevo 3D). Entregues no seu endereço com frete grátis.',
    imageSrc: '/awards/wristbands_50k.png',
    modelGlb: '/awards/models/pulseira-50k-roxa.glb',
    variants: [
      { name: 'Roxa Imperial', modelGlb: '/awards/models/pulseira-50k-roxa.glb', color: '#8b5cf6' },
      { name: 'Branca Lunar', modelGlb: '/awards/models/pulseira-50k-branca.glb', color: '#f8fafc' },
    ],
    type: 'bracelet',
    specifications: 'Silicone hipoalergênico premium, gravação em alto-relevo 3D, acabamento aveludado, tamanho universal ajustável.',
    highlights: ['2 Pulseiras Exclusivas (Roxa + Branca)', 'Gravação em Alto-Relevo 3D', 'Frete 100% Gratuito em MZ'],
  },
  {
    id: 4,
    level: '100K',
    name: 'Placa Otterfy 100K',
    badgeTag: '100 MIL',
    heading: '100.000 MT faturados',
    target: 100000,
    tag: '3/7',
    category: 'Placa Emoldurada A4',
    format: 'Formato A4 (21 x 29.7 cm)',
    description: 'A primeira grande consagração com moldura de alumínio preto fosco, fundo dark texturizado e emblema em aço escovado prata gravado a laser com seu nome.',
    imageSrc: '/awards/placa_100k_frente.png',
    badgeSrc: '/awards/badge_silver.png',
    modelGlb: '/awards/models/placa-100k.glb',
    type: 'plaque',
    specifications: 'Moldura de alumínio laqueado preto, vidro antirreflexo de cristal, placa metálica com corte a laser e acabamento escovado prata.',
    highlights: ['Personalizada com seu Nome/Loja', 'Emblema Prata 3D Escovado', 'Certificado Oficial Apex Predator'],
  },
  {
    id: 5,
    level: '500K',
    name: 'Placa Otterfy 500K',
    badgeTag: '500 MIL',
    heading: '500.000 MT faturados',
    target: 500000,
    tag: '4/7',
    category: 'Placa Emoldurada A3',
    format: 'Formato A3 (29.7 x 42 cm)',
    description: 'Troféu comemorativo A3 de luxo com emblema 3D espelhado banhado a ouro metálico, celebrando meio milhão de Meticais faturados.',
    imageSrc: '/awards/placa_500k_frente.png',
    badgeSrc: '/awards/badge_gold.png',
    modelGlb: '/awards/models/placa-500k.glb',
    type: 'plaque',
    specifications: 'Moldura maciça A3 em madeira nobre laqueada, emblema dourado com efeito escovado espelhado, placa de identificação oficial.',
    highlights: ['Tamanho Gigante A3 de Luxo', 'Brasão Banhado a Ouro Metálico', 'Gravação a Laser de Alta Precisão'],
  },
  {
    id: 6,
    level: '1M',
    name: 'Placa Otterfy 1M',
    badgeTag: '1 MILHÃO',
    heading: '1.000.000 MT faturados',
    target: 1000000,
    tag: '5/7',
    category: 'Clube do Milhão A3',
    format: 'Formato A3 (29.7 x 42 cm)',
    description: 'A consagração no seleto Clube do Milhão Otterfy. Fundo velvet púrpura luxuoso, moldura A3 premium e condecoração máxima como multimilionário digital.',
    imageSrc: '/awards/placa_1m_frente.png',
    badgeSrc: '/awards/badge_purple.png',
    modelGlb: '/awards/models/placa-1m.glb',
    type: 'plaque',
    specifications: 'Moldura nobre laqueada preta fosca A3, fundo degradê royal violet, emblema metálico diamante e selo numerado de autenticidade.',
    highlights: ['Membro do Clube do Milhão', 'Fundo Imperial Violet & Diamante', 'Condecoração de Honra Máxima'],
  },
  {
    id: 7,
    level: '5M',
    name: 'Placa Otterfy 5M',
    badgeTag: '5 MILHÕES',
    heading: '5.000.000 MT faturados',
    target: 5000000,
    tag: '6/7',
    category: 'Titanium Black A3',
    format: 'Formato A3 (29.7 x 42 cm)',
    description: 'Placa ultra-exclusiva Otterfy Black para operações titânicas de escala massiva. Acabamento Black on Black com emblema em titânio escovado escurecido.',
    imageSrc: '/awards/placa_5m_frente.png',
    badgeSrc: '/awards/badge_black.png',
    modelGlb: '/awards/models/placa-5m.glb',
    type: 'plaque',
    specifications: 'Acabamento Black on Black em alumínio escovado anodizado escurecido, vidro duplo especial e selo de excelência e-commerce África.',
    highlights: ['Edição Restrita Black Titanium', 'Design Stealth Monocromático', 'Status de Elite Continental'],
  },
  {
    id: 8,
    level: '10M',
    name: 'Placa Otterfy 10M',
    badgeTag: '10 MILHÕES',
    heading: '10.000.000 MT faturados',
    target: 10000000,
    tag: '7/7',
    category: 'Titan Supremo A3',
    format: 'Formato A3 (29.7 x 42 cm)',
    description: 'A premiação máxima e o ápice da jornada digital na Otterfy. Emblema Titan Violet metálico 3D reservado exclusivamente para os maiores impérios do e-commerce.',
    imageSrc: '/awards/placa_10m_frente.png',
    badgeSrc: '/awards/badge_purple.png',
    modelGlb: '/awards/models/placa-10m.glb',
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
      'Assim que você atingir a meta de faturamento correspondente (50K para pulseiras, 100K a 10M para as placas), o botão "Resgatar Troféu" fica ativo. Você preenche o seu nome para personalização e o endereço de entrega, e nossa equipe inicia a confecção e despacho com frete 100% gratuito.',
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

function PlaqueCardThumbnail({
  imageSrc,
  name,
  hasModel3D,
}: {
  imageSrc: string;
  name: string;
  hasModel3D?: boolean;
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0, shineX: 50, shineY: 50 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const normX = (x - 0.5) * 2;
    const normY = (y - 0.5) * 2;
    setTilt({
      y: normX * 22,
      x: -normY * 18,
      shineX: Math.round(((normX + 1) / 2) * 100),
      shineY: Math.round(((normY + 1) / 2) * 100),
    });
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setTilt({ x: 0, y: 0, shineX: 50, shineY: 50 });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-20 h-24 sm:w-24 sm:h-28 shrink-0 rounded-2xl bg-slate-50 dark:bg-[#06050A] border border-slate-200/90 dark:border-white/10 overflow-hidden flex items-center justify-center relative p-2 shadow-inner select-none cursor-pointer"
      style={{ perspective: '800px' }}
    >
      <div
        className="relative w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateY(${tilt.y}deg) rotateX(${tilt.x}deg) scale3d(${
            hovered ? 1.08 : 1
          }, ${hovered ? 1.08 : 1}, 1)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={name}
          className="w-full h-full object-contain filter drop-shadow-md pointer-events-none"
        />

        {/* Specular shine on cursor move */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-150 mix-blend-overlay"
          style={{
            opacity: hovered ? 0.65 : 0,
            background: `radial-gradient(circle at ${tilt.shineX}% ${tilt.shineY}%, rgba(255,255,255,0.7) 0%, transparent 60%)`,
          }}
        />
      </div>

      {hasModel3D && (
        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[9px] font-mono font-bold text-white border border-white/15 z-10 pointer-events-none">
          3D
        </span>
      )}
    </div>
  );
}

export default function AwardsPage() {
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Modals state
  const [claimModalMilestone, setClaimModalMilestone] = useState<MilestoneData | null>(null);
  const [viewer3DMilestone, setViewer3DMilestone] = useState<MilestoneData | null>(null);
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
        setTotalRevenue(sum > 0 ? sum : 0);
      })
      .catch(() => {
        setTotalRevenue(0);
      });
  }, []);

  // Filtered milestones excluding starter for progress counting
  const progressiveMilestones = MILESTONES.filter((m) => m.target > 0);
  const conqueredCount = progressiveMilestones.filter((m) => totalRevenue >= m.target).length;
  const nextMilestone =
    progressiveMilestones.find((m) => totalRevenue < m.target) ||
    progressiveMilestones[progressiveMilestones.length - 1];

  const remainingAmount = Math.max(0, nextMilestone.target - totalRevenue);
  const progressToNext =
    nextMilestone.target > 0
      ? Math.min(100, Math.round((totalRevenue / nextMilestone.target) * 100))
      : 100;

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClaimSuccess(true);
    setTimeout(() => {
      setClaimSuccess(false);
      setClaimModalMilestone(null);
    }, 2800);
  };

  const handleMilestoneClick = (m: MilestoneData) => {
    setViewer3DMilestone(m);
  };

  return (
    <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. HERO TOP BAR: FATURAMENTO & STATUS DA PRÓXIMA PARADA (GG CHECKOUT)     */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-[#1E1B26] bg-white dark:bg-[#07060B] shadow-sm">
        {/* Glowing Decorative Stripes in Top Right (Otterfy Neon Accent) */}
        <div className="absolute top-0 right-0 w-80 h-32 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-bl from-violet-600/25 via-indigo-500/15 to-transparent rounded-full blur-2xl" />
          <div className="absolute top-0 right-8 w-2 h-24 bg-gradient-to-b from-blue-500 to-violet-600 rotate-45 transform origin-top-right opacity-70 blur-[1px]" />
          <div className="absolute top-0 right-14 w-1.5 h-20 bg-gradient-to-b from-purple-500 to-pink-500 rotate-45 transform origin-top-right opacity-60 blur-[1px]" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          {/* Lado Esquerdo: Faturamento Total */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#94A3B8]">
              FATURAMENTO TOTAL
            </span>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC] font-mono">
              {formatMZN(totalRevenue)}
            </div>
            <div className="text-xs text-slate-600 dark:text-[#94A3B8] flex items-center gap-2 pt-0.5">
              <span>
                Faltam <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatMZN(remainingAmount)}</strong> para {nextMilestone.name}
              </span>
              <span>•</span>
              <span className="font-mono text-violet-600 dark:text-violet-400 font-bold">
                {progressToNext}% do caminho
              </span>
            </div>
          </div>

          {/* Lado Direito: Conquistados e Próxima Parada */}
          <div className="sm:text-right space-y-1">
            <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-[#F8FAFC]">
              {conqueredCount} de {progressiveMilestones.length} conquistados
            </div>
            <div className="text-xs text-slate-500 dark:text-[#94A3B8]">
              próxima parada: <span className="text-violet-600 dark:text-violet-400 font-bold">{nextMilestone.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TÍTULO DA SESSÃO: SUA JORNADA DE CONQUISTAS                            */}
      {/* ========================================================================= */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F8FAFC] tracking-tight">
          Sua Jornada de Conquistas
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8]">
          Cada marco alcançado traz recompensas exclusivas para você
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 3. TIMELINE VERTICAL COM CARDS HORIZONTAIS (REVERSE ENG GG CHECKOUT)      */}
      {/* ========================================================================= */}
      <div className="relative pl-8 sm:pl-12 space-y-4 sm:space-y-5">
        {/* Linha vertical pontilhada / sólida do timeline */}
        <div className="absolute left-[13px] sm:left-[21px] top-8 bottom-8 w-[2px] border-l-2 border-dashed border-slate-200 dark:border-[#221D2F] pointer-events-none" />

        {MILESTONES.map((milestone) => {
          const isConquered = milestone.target === 0 || totalRevenue >= milestone.target;
          const isCurrentTarget = nextMilestone.id === milestone.id && !isConquered;
          const needed = Math.max(0, milestone.target - totalRevenue);
          const percent = milestone.target > 0 ? Math.min(100, Math.round((totalRevenue / milestone.target) * 100)) : 100;

          return (
            <div key={milestone.id} className="relative group">
              {/* Nó do Timeline à Esquerda */}
              <div
                className={`absolute -left-8 sm:-left-12 top-6 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all ${
                  isConquered
                    ? 'bg-blue-600 dark:bg-violet-600 text-white shadow-md ring-4 ring-white dark:ring-[#07060B]'
                    : isCurrentTarget
                    ? 'bg-blue-600 dark:bg-violet-600 text-white ring-4 ring-blue-500/30 dark:ring-violet-500/30 shadow-lg shadow-violet-600/30'
                    : 'bg-slate-100 dark:bg-[#121016] text-slate-400 dark:text-[#64748B] border border-slate-200 dark:border-[#1E1B26] ring-4 ring-white dark:ring-[#07060B]'
                }`}
              >
                {isConquered ? (
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isCurrentTarget ? (
                  <span>{milestone.id}</span>
                ) : (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                )}
              </div>

              {/* Card Horizontal Estilo GG Checkout */}
              <div
                onClick={() => handleMilestoneClick(milestone)}
                className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 cursor-pointer ${
                  isCurrentTarget
                    ? 'border-blue-500/90 dark:border-violet-500/90 ring-1 ring-blue-500/20 dark:ring-violet-500/25 bg-blue-50/20 dark:bg-[#0D0B14] shadow-lg shadow-violet-500/5'
                    : isConquered
                    ? 'border-slate-200 dark:border-[#1E1B26] bg-white dark:bg-[#0E0C15] hover:border-violet-400/50 shadow-xs'
                    : 'border-slate-200/90 dark:border-[#16131F] bg-white/80 dark:bg-[#090810] hover:border-violet-500/30 hover:bg-slate-50/40 dark:hover:bg-[#0C0A13]'
                }`}
              >
                {/* Lado Esquerdo: Imagem + Detalhes */}
                <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                  {/* Plaque Thumbnail with 3D Cursor-Tracking Parallax Tilt */}
                  <PlaqueCardThumbnail
                    imageSrc={milestone.imageSrc}
                    name={milestone.name}
                    hasModel3D={Boolean(milestone.modelGlb)}
                  />

                  {/* Textos & Botões de Ação */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-[#F8FAFC]">
                        {milestone.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-[#94A3B8]">
                        {milestone.badgeTag}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                      {milestone.heading}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed max-w-xl line-clamp-2">
                      {milestone.description}
                    </p>

                    {/* Botões Internos conforme o Screenshot GG Checkout */}
                    <div className="pt-1 flex items-center gap-2 flex-wrap">
                      {milestone.type === 'starter_community' ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setWhatsappModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer transition-all"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2" />
                            </svg>
                            <span>Entrar no WhatsApp</span>
                          </button>
                        </>
                      ) : isCurrentTarget ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-blue-600 dark:bg-violet-600 px-3 py-1 rounded-lg shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            Você está aqui
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewer3DMilestone(milestone);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-violet-600 hover:text-white dark:bg-white/5 dark:hover:bg-violet-600 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
                          >
                            <svg className="w-3 h-3 text-violet-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                            </svg>
                            <span>{milestone.modelGlb ? 'Ver em 3D (360°)' : 'Ver Prévia'}</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewer3DMilestone(milestone);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-violet-600 hover:text-white dark:bg-white/5 dark:hover:bg-violet-600 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
                        >
                          <svg className="w-3 h-3 text-violet-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                          </svg>
                          <span>{milestone.modelGlb ? 'Ver em 3D (360°)' : 'Ver Prévia'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Status / Faltam X MT */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-slate-200 dark:border-[#1E1B26] shrink-0 text-right">
                  {isConquered ? (
                    <div className="space-y-2 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Conquistado
                      </span>

                      {milestone.type !== 'starter_community' && milestone.type !== 'community' && (
                        <div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setClaimModalMilestone(milestone);
                            }}
                            className="block w-full text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 px-4 py-1.5 rounded-xl transition-all shadow-md shadow-violet-600/20 cursor-pointer"
                          >
                            Resgatar Troféu
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-[#64748B]">
                        FALTAM
                      </div>
                      <div className="text-base sm:text-lg font-black text-slate-900 dark:text-[#F8FAFC] font-mono">
                        {formatMZN(needed)}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#64748B]">
                        {percent}% concluído
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. SEÇÃO FAQ: DÚVIDAS FREQUENTES                                          */}
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
                className="rounded-2xl border border-slate-200 dark:border-[#1E1B26] bg-white dark:bg-[#0E0C15] overflow-hidden transition-colors shadow-xs"
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
      {/* 5. MODAL: ACESSO AO GRUPO VIP WHATSAPP (COM MOCKUP DE CELULAR)            */}
      {/* ========================================================================= */}
      {whatsappModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121018] border border-slate-200 dark:border-[#252033] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative text-slate-900 dark:text-[#F8FAFC]">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-[#252033] flex items-center justify-between bg-slate-50/70 dark:bg-[#0E0C15]/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.59 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.33C9.33 7.33 9 7.4 8.73 7.69C8.46 7.98 7.7 8.7 7.7 10.15C7.7 11.61 8.76 13.01 8.91 13.21C9.06 13.41 11 16.39 13.94 17.66C14.64 17.96 15.18 18.14 15.61 18.28C16.31 18.5 16.95 18.47 17.45 18.39C18.01 18.31 19.18 17.68 19.42 17C19.66 16.32 19.66 15.74 19.59 15.62C19.52 15.5 19.33 15.43 19.04 15.29C18.75 15.14 17.33 14.44 17.07 14.34C16.81 14.24 16.62 14.19 16.43 14.48C16.24 14.77 15.7 15.41 15.54 15.6C15.38 15.79 15.22 15.81 14.93 15.67C14.64 15.52 13.71 15.22 12.61 14.24C11.75 13.48 11.17 12.53 11 12.24C10.83 11.95 10.98 11.79 11.13 11.65C11.26 11.52 11.42 11.31 11.56 11.14C11.7 10.97 11.75 10.85 11.85 10.66C11.95 10.47 11.9 10.3 11.82 10.15C11.74 10.01 11.17 8.6 10.93 8.03C10.7 7.47 10.46 7.55 10.28 7.54C10.12 7.53 9.92 7.53 9.73 7.53Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
                    Comunidade VIP WhatsApp (25K Club)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                    Marco 25.000 MT • Networking Exclusivo de Sellers em Moçambique
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

            {/* Conteúdo em 2 Colunas */}
            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Coluna 1: Mockup de Celular com Contorno Suave */}
              <div className="md:col-span-5 flex items-center justify-center">
                <div className="w-full max-w-[210px] h-[320px] sm:h-[350px] rounded-3xl p-3 bg-gradient-to-b from-slate-100 to-slate-200/80 dark:from-[#0B0911] dark:to-[#171422] border border-slate-200 dark:border-white/10 shadow-xl flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-3xl blur-xl pointer-events-none" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/awards/phone_mockup_whatsapp.svg"
                    alt="Smartphone Mockup WhatsApp VIP Otterfy"
                    className="w-full h-full object-contain filter drop-shadow-xl relative z-10 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>

              {/* Coluna 2: Informações e Status Pendente */}
              <div className="md:col-span-7 space-y-4">
                {/* Aviso de Link Pendente Configurado pelo Administrador */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <span>Link em Preparação pelo Administrador</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-[#CBD5E1] leading-relaxed">
                    O link oficial de convite para a sala fechada no WhatsApp está em processo de validação pela administração da Otterfy e será liberado automaticamente aqui no painel.
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    O que você terá no grupo ao ser liberado:
                  </span>
                  <ul className="space-y-2 text-slate-600 dark:text-[#94A3B8]">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                      <span>Networking direto com os maiores operadores de e-commerce e afiliados em MZ.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                      <span>Novidades em primeira mão sobre taxas, gateways e atualizações do ecossistema.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                      <span>Estratégias validadas para otimização de campanhas e aprovação em M-Pesa & e-Mola.</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setWhatsappModalOpen(false)}
                    className="w-full py-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#1E1B26] dark:hover:bg-[#2A2438] text-slate-800 dark:text-white transition-all cursor-pointer"
                  >
                    Entendido, aguardar liberação
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: RESGATE DE TROFÉU / PULSEIRA (ENVIO FÍSICO)                     */}
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
      {/* 7. MODAL INTERATIVO 3D & PREVIEW (THREE.JS WEBGL + CURSOR TRACKING TILT)  */}
      {/* ========================================================================= */}
      {viewer3DMilestone && (
        <PlaqueViewer3D
          modelUrl={viewer3DMilestone.modelGlb}
          variants={viewer3DMilestone.variants}
          fallbackImage={viewer3DMilestone.imageSrc}
          title={viewer3DMilestone.name}
          level={viewer3DMilestone.level}
          format={viewer3DMilestone.format}
          category={viewer3DMilestone.category}
          specifications={viewer3DMilestone.specifications}
          targetAmount={viewer3DMilestone.target}
          currentRevenue={totalRevenue}
          isUnlocked={viewer3DMilestone.target === 0 || totalRevenue >= viewer3DMilestone.target}
          type={viewer3DMilestone.type}
          onClose={() => setViewer3DMilestone(null)}
          onOpenWhatsapp={() => setWhatsappModalOpen(true)}
          onClaim={() => {
            const target = viewer3DMilestone;
            setViewer3DMilestone(null);
            setClaimModalMilestone(target);
          }}
        />
      )}
    </div>
  );
}
