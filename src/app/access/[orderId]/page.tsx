import { notFound } from 'next/navigation';
import Link from 'next/link';
import dbStore from '@/lib/store';
import { LegalFooter } from '@/components/legal/LegalFooter';
import { BUSINESS_INFO } from '@/lib/legal';

interface PageProps {
  params: Promise<{
    orderId: string;
  }>;
}

function safeHttpsUrl(value?: string | null) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export default async function AccessPortalPage({ params }: PageProps) {
  const { orderId } = await params;
  const order = await dbStore.getOrderById(orderId);
  if (!order || order.status !== 'APPROVED') notFound();
  const currentOrder = order;

  const product = (await dbStore.getProductById(currentOrder.productId)) || currentOrder.product;
  const materials = product?.materials || [];
  const externalContentUrl = safeHttpsUrl(product?.contentUrl);
  const sellerWhatsapp = product?.checkoutSettings?.whatsappSupport?.phone?.replace(/\D/g, '');

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#08070C] text-[#F8FAFC]">
      {/* Top Navbar */}
      <header className="border-b border-[#1E1B26] bg-[#100E15]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                <img src="/logo.png" alt="Logótipo da Otterfy" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
              </div>
              <span className="font-extrabold text-lg text-white">Otter<span className="text-purple-400">fy</span></span>
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-600/15 border border-violet-500/30 text-violet-300 font-medium">
              Portal de Entrega do Produto
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-[#94A3B8] hidden sm:inline">Pedido: <strong className="text-white font-mono">{currentOrder.id}</strong></span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
              ✓ Pagamento Confirmado
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-violet-950/40 via-[#171324] to-[#100E15] border border-violet-500/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-600/20 text-violet-300 border border-violet-500/30">
                {product?.category || 'Produto Digital'}
              </span>
              <span className="text-xs text-[#94A3B8]">Acesso Liberado</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {product?.name || 'Seu Produto Digital'}
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] max-w-xl leading-relaxed">
              Olá, <strong className="text-white">{currentOrder.customerName}</strong>! Os ficheiros e ligações de acesso fornecidos pelo produtor para a sua compra encontram-se disponíveis abaixo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 w-full sm:w-auto">
            <a
              href="#materiais"
              className="laser-button px-5 py-3 text-xs font-bold text-white rounded-xl text-center shadow-lg flex items-center justify-center gap-2"
            >
              <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span>Ver Ficheiros Disponíveis</span>
            </a>
            {sellerWhatsapp ? (
              <a
                href={`https://wa.me/${sellerWhatsapp}?text=Ol%C3%A1!%20Sou%20comprador%20do%20pedido%20${encodeURIComponent(currentOrder.id)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-[#171420] hover:bg-[#201C2C] border border-[#2A2438] text-xs font-semibold text-emerald-400 rounded-xl text-center transition-colors flex items-center justify-center gap-2"
              >
                <span>Contactar Vendedor no WhatsApp</span>
              </a>
            ) : (
              <a
                href={`mailto:${BUSINESS_INFO.supportEmail}?subject=${encodeURIComponent(`Suporte Pedido ${currentOrder.id}`)}`}
                className="px-4 py-2.5 bg-[#171420] hover:bg-[#201C2C] border border-[#2A2438] text-xs font-semibold text-emerald-400 rounded-xl text-center transition-colors flex items-center justify-center gap-2"
              >
                <span>Contactar Suporte ({BUSINESS_INFO.supportEmail})</span>
              </a>
            )}
          </div>
        </div>

        {/* External Content Link if configured by the seller */}
        {externalContentUrl && (
          <section aria-labelledby="external-access-heading" className="bg-[#121016] border border-[#1E1B26] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <h2 id="external-access-heading" className="text-lg font-bold text-white">
              Ligação Direta ao Conteúdo do Produtor
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8]">
              O produtor disponibilizou o acesso principal a este produto através da ligação externa abaixo:
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0F0E14] border border-[#1E1B26]">
              <span className="text-xs font-mono text-violet-300 truncate">{externalContentUrl}</span>
              <a
                href={externalContentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="laser-button px-5 py-2.5 text-xs font-bold text-white rounded-xl shrink-0 text-center"
              >
                Abrir Conteúdo Externo
              </a>
            </div>
          </section>
        )}

        {/* MATERIALS & DOWNLOAD SECTION */}
        <section id="materiais" aria-labelledby="materials-heading" className="bg-[#121016] border border-[#1E1B26] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#1E1B26] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </div>
              <div>
                <h2 id="materials-heading" className="text-lg font-bold text-white">Materiais &amp; Ficheiros do Produto</h2>
                <p className="text-xs text-[#94A3B8]">Faça a transferência dos ficheiros incluídos no seu pedido</p>
              </div>
            </div>
            <span className="text-xs text-violet-400 font-semibold">{materials.length} ficheiro(s)</span>
          </div>

          {materials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((m, idx) => {
                const fileUrl = safeHttpsUrl(m.url);
                return (
                  <div
                    key={idx}
                    className="bg-[#0F0E14] border border-[#1E1B26] hover:border-violet-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 group transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-black text-xs shrink-0">
                        {m.type?.toUpperCase() || 'FILE'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-white truncate">
                          {m.name}
                        </h3>
                        <span className="text-[11px] text-[#94A3B8] block mt-0.5">
                          Disponibilizado pelo produtor
                        </span>
                      </div>
                    </div>

                    {fileUrl ? (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="laser-button w-full py-2 px-3 text-xs font-bold text-white rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <span>Transferir Ficheiro ({m.name})</span>
                      </a>
                    ) : (
                      <span className="text-xs text-[#94A3B8] block text-center py-2">
                        Ficheiro em preparação pelo produtor
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#0F0E14] border border-[#1E1B26] p-6 text-center space-y-2">
              <p className="text-sm font-semibold text-white">
                Nenhum ficheiro anexo diretamente a esta página.
              </p>
              <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                Caso o produtor entregue o produto por e-mail ou WhatsApp, verifique a sua caixa de entrada ou contacte o suporte em{' '}
                <a href={`mailto:${BUSINESS_INFO.supportEmail}`} className="text-violet-400 underline">
                  {BUSINESS_INFO.supportEmail}
                </a>.
              </p>
            </div>
          )}

          {/* Bonus / Order Bump Material if purchased */}
          {currentOrder.hasOrderBump && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 to-[#14101A] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="text-2xl">⭐</span>
                <div>
                  <span className="text-xs font-bold text-amber-300 block">Oferta Adicional Incluída no Pedido:</span>
                  <p className="text-xs text-white font-medium mt-0.5">{currentOrder.orderBumpTitle}</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <LegalFooter variant="dark" />
    </div>
  );
}
