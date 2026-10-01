import { notFound } from 'next/navigation';
import Link from 'next/link';
import dbStore from '@/lib/store';
import { formatMZN } from '@/lib/utils';

interface PageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function AccessPortalPage({ params }: PageProps) {
  const { orderId } = await params;
  const order = await dbStore.getOrderById(orderId);

  // Fallback demo order if testing directly
  const currentOrder = order || {
    id: orderId,
    customerName: 'Comprador Otterfy',
    customerPhone: '+258 84 123 4567',
    customerEmail: 'cliente@exemplo.co.mz',
    amount: 1500,
    hasOrderBump: true,
    orderBumpTitle: 'Manual Secreto de Tráfego Pago + Modelos de Copy',
    orderBumpAmount: 250,
    createdAt: new Date().toISOString(),
    product: {
      id: 'demo-prod',
      name: 'Curso de Marketing Digital Pro & Vendas Online',
      description: 'Treinamento completo para faturar em Meticais na internet moçambicana.',
      category: 'Curso Online',
      price: 1500,
      contentUrl: 'https://membros.otterfy.co.mz',
      materials: [
        { name: 'E-book Principal - Estratégias Práticas 2026.pdf', type: 'pdf' },
        { name: 'Planilha de Gestão Financeira e ROI.xlsx', type: 'zip' },
        { name: 'Áudio-Aula: Mindset de Escala no M-Pesa.mp3', type: 'audio' }
      ]
    }
  };

  const product = currentOrder.product;
  const materials = product?.materials || [];

  return (
    <div className="min-h-screen bg-[#08070C] text-[#F8FAFC]">
      {/* Top Navbar */}
      <header className="border-b border-[#1E1B26] bg-[#100E15]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                <img src="/logo.png" alt="Otterfy" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
              </div>
              <span className="font-extrabold text-lg text-white">Otter<span className="text-purple-400">fy</span></span>
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-600/15 border border-violet-500/30 text-violet-300 font-medium">
              Área do Aluno & Conteúdo
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-[#94A3B8] hidden sm:inline">Pedido: <strong className="text-white font-mono">{currentOrder.id}</strong></span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
              ✓ Acesso Vitalício Ativo
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-violet-950/40 via-[#171324] to-[#100E15] border border-violet-500/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-600/20 text-violet-300 border border-violet-500/30">
                {product?.category || 'Treinamento'}
              </span>
              <span className="text-xs text-[#94A3B8]">Atualizado em 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {product?.name || 'Seu Produto Digital'}
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] max-w-xl leading-relaxed">
              Bem-vindo(a), <strong className="text-white">{currentOrder.customerName}</strong>! Todos os seus materiais, arquivos para download e vídeo-aulas foram liberados abaixo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 w-full sm:w-auto">
            <a
              href="#materiais"
              className="laser-button px-5 py-3 text-xs font-bold text-white rounded-xl text-center shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span>Baixar Materiais (.PDF / .ZIP)</span>
            </a>
            <a
              href={`https://wa.me/258840000000?text=Ol%C3%A1!%20Sou%20o%20aluno%20${encodeURIComponent(currentOrder.customerName)}%20do%20pedido%20${currentOrder.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-[#171420] hover:bg-[#201C2C] border border-[#2A2438] text-xs font-semibold text-emerald-400 rounded-xl text-center transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.301-.15-1.777-.877-2.052-.977-.276-.101-.477-.15-.678.15-.2.3-.778.977-.954 1.178-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.5-1.786-1.676-2.087-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.301-.501.101-.2.05-.376-.025-.526-.075-.15-.678-1.631-.93-2.235-.245-.589-.494-.509-.678-.519-.176-.01-.376-.01-.577-.01-.2 0-.527.075-.803.376s-1.054 1.029-1.054 2.509 1.079 2.91 1.229 3.111c.15.201 2.124 3.243 5.145 4.549.718.311 1.279.497 1.716.636.721.229 1.377.197 1.895.12.577-.087 1.777-.727 2.028-1.429.25-.702.25-1.303.175-1.429-.075-.126-.276-.201-.577-.351zM12 21.82c-1.782 0-3.48-.466-4.966-1.28l-.356-.197-3.69 1.018 1.002-3.582-.232-.37C3.003 16.035 2.5 14.07 2.5 12c0-5.238 4.262-9.5 9.5-9.5 2.538 0 4.924.988 6.718 2.782A9.444 9.444 0 0121.5 12c0 5.238-4.262 9.5-9.5 9.5z"/>
              </svg>
              <span>Suporte no WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Course Video Player & Module Navigator */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Screen */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl overflow-hidden shadow-xl">
              {/* Fake High-Quality Video Player */}
              <div className="relative aspect-video bg-[#0B0910] flex flex-col items-center justify-center border-b border-[#1E1B26] group">
                <div className="w-16 h-16 rounded-full bg-violet-600/90 group-hover:scale-110 group-hover:bg-violet-500 transition-all flex items-center justify-center shadow-2xl shadow-violet-500/50 cursor-pointer">
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-white mt-3 tracking-wide">
                  Aula 1: Boas-vindas e Visão Geral da Metodologia
                </span>
                <span className="text-[10px] text-[#64748B] mt-0.5">Duração: 14 min 30 seg • Alta Definição (1080p)</span>

                {/* Video controls bar mockup */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-3 px-4 flex items-center justify-between text-xs text-white">
                  <div className="flex items-center gap-3">
                    <span className="cursor-pointer">▶</span>
                    <span className="text-[11px] text-[#94A3B8]">03:15 / 14:30</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20">HD 1080p</span>
                    <span className="cursor-pointer">⛶</span>
                  </div>
                </div>
              </div>

              {/* Lesson Description */}
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Módulo 1 — Introdução & Estratégia Inicial</h3>
                  <button className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                    <span>✓</span>
                    <span>Marcar como Concluída</span>
                  </button>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Nesta primeira aula você vai aprender os fundamentos práticos de vendas no mercado de Moçambique, como estruturar o seu funil de pagamento via M-Pesa e e-Mola e quais os primeiros passos para ativar a sua operação online.
                </p>
              </div>
            </div>
          </div>

          {/* Module Playlist */}
          <div className="space-y-4">
            <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E1B26]">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Aulas do Treinamento</h4>
                <span className="text-xs text-violet-400 font-mono">1 de 6 concluídas</span>
              </div>

              <div className="space-y-2">
                {[
                  { id: 1, title: 'Aula 1: Boas-vindas e Visão Geral', dur: '14:30', active: true, done: true },
                  { id: 2, title: 'Aula 2: Criando sua Oferta Irresistível', dur: '22:15', active: false, done: false },
                  { id: 3, title: 'Aula 3: Checkout M-Pesa & e-Mola no Otterfy', dur: '18:40', active: false, done: false },
                  { id: 4, title: 'Aula 4: Tráfego Pago & Anúncios no Meta Ads', dur: '31:20', active: false, done: false },
                  { id: 5, title: 'Aula 5: Recuperação de Carrinho no WhatsApp', dur: '15:10', active: false, done: false },
                  { id: 6, title: 'Aula 6: Escala de Faturamento para 100K MT', dur: '28:00', active: false, done: false },
                ].map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      lesson.active
                        ? 'bg-violet-600/15 border-violet-500/50 text-white'
                        : 'bg-[#0F0E14] border-[#1E1B26] text-[#94A3B8] hover:border-violet-500/30 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        lesson.done ? 'bg-emerald-500 text-white' : 'bg-[#1E1B26] text-[#64748B]'
                      }`}>
                        {lesson.done ? '✓' : lesson.id}
                      </span>
                      <span className="text-xs font-medium truncate">{lesson.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#64748B] shrink-0 ml-2">{lesson.dur}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* MATERIALS & DOWNLOAD SECTION */}
        <div id="materiais" className="bg-[#121016] border border-[#1E1B26] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#1E1B26] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Materiais & Arquivos de Apoio</h3>
                <p className="text-xs text-[#94A3B8]">Faça download para o seu computador ou telemóvel</p>
              </div>
            </div>
            <span className="text-xs text-violet-400 font-semibold">{materials.length} ficheiros disponíveis</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((m, idx) => (
              <div
                key={idx}
                className="bg-[#0F0E14] border border-[#1E1B26] hover:border-violet-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 group transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-black text-xs shrink-0 group-hover:scale-105 transition-transform">
                    {m.type?.toUpperCase() || 'FILE'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-violet-300 transition-colors">
                      {m.name}
                    </h4>
                    <span className="text-[10px] text-[#64748B] block mt-0.5">Formato Oficial • 100% Livre de Vírus</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="laser-button w-full py-2 px-3 text-xs font-bold text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Baixar Arquivo</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Bonus / Order Bump Material if purchased */}
          {currentOrder.hasOrderBump && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 to-[#14101A] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-300">Bônus Exclusivo Liberado (Order Bump):</span>
                    <span className="px-2 py-0.2 rounded-full text-[9px] font-extrabold bg-amber-500/20 text-amber-400">VIP</span>
                  </div>
                  <p className="text-xs text-white font-medium mt-0.5">{currentOrder.orderBumpTitle}</p>
                </div>
              </div>

              <button
                type="button"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                Acessar Bônus VIP
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
