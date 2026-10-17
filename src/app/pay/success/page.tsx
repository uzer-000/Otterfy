import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import dbStore from '@/lib/store';
import prisma from '@/lib/prisma';
import { zenofyProvider } from '@/services/payment/zenofy';
import { formatMZN } from '@/lib/utils';
import { LegalFooter } from '@/components/legal/LegalFooter';
import { BUSINESS_INFO } from '@/lib/legal';
import PaymentMethodBadge from '@/components/ui/PaymentMethodBadge';

interface PageProps {
  searchParams: Promise<{
    ref?: string;
    orderId?: string;
    order_id?: string;
    id?: string;
    checkout_id?: string;
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

async function SuccessContent({ orderId }: { orderId?: string }) {
  if (!orderId) {
    return (
      <div className="bg-white dark:bg-[#121016] border border-gray-200 dark:border-[#1E1B26] rounded-3xl p-8 max-w-lg w-full mx-auto text-center space-y-4 shadow-xl text-gray-900 dark:text-[#F8FAFC]">
        <div className="w-14 h-14 bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-red-100 dark:border-red-500/30">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-[#F8FAFC]">Pedido não encontrado</h2>
        <p className="text-xs text-gray-600 dark:text-[#94A3B8]">Ocorreu um erro ao carregar os detalhes do pedido.</p>
        <Link href="/" className="otter-keep-colors inline-block px-5 py-2.5 bg-gray-900 hover:bg-black dark:bg-violet-600 dark:hover:bg-violet-500 text-xs font-semibold rounded-xl text-white transition-colors">
          Voltar ao início
        </Link>
      </div>
    );
  }

  let order = orderId ? await dbStore.getOrderById(orderId) : null;

  // If not found by direct ID, search by zenofyCheckoutId in all orders
  if (!order && orderId) {
    const allOrders = await dbStore.getOrders();
    order = allOrders.find(
      (o) =>
        o.id === orderId ||
        o.transaction?.zenofyCheckoutId === orderId ||
        o.transaction?.zenofyTransactionId === orderId
    ) || null;
  }

  // If found and status is PENDING, verify with Zenofy
  if (order && order.status !== 'APPROVED' && order.transaction?.zenofyCheckoutId) {
    try {
      const zStatus = await zenofyProvider.getOrderStatus(order.transaction.zenofyCheckoutId);
      if (zStatus.status === 'PAID') {
        order.status = 'APPROVED';
        await prisma.$transaction([
          prisma.order.update({ where: { id: order.id }, data: { status: 'APPROVED' } }),
          prisma.transaction.update({ where: { id: order.transaction.id }, data: { status: 'APPROVED' } }),
        ]).catch(() => {});
        await dbStore.updateOrderTransaction(order.id, { status: 'APPROVED' }).catch(() => {});
      }
    } catch {}
  }

  if (!order) {
    return (
      <div className="bg-white dark:bg-[#121016] border border-gray-200 dark:border-[#1E1B26] rounded-3xl p-8 max-w-lg w-full mx-auto text-center space-y-4 shadow-xl text-gray-900 dark:text-[#F8FAFC]">
        <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-amber-200 dark:border-amber-500/30">
          🔍
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-[#F8FAFC]">Pedido não localizado</h2>
        <p className="text-xs text-gray-600 dark:text-[#94A3B8]">Não foi possível localizar o código de referência: <strong className="text-purple-700 dark:text-purple-400 font-mono">{orderId || 'Desconhecido'}</strong></p>
        <Link href="/" className="otter-keep-colors inline-block px-5 py-2.5 bg-gray-900 hover:bg-black dark:bg-violet-600 dark:hover:bg-violet-500 text-xs font-semibold rounded-xl text-white transition-colors">
          Voltar ao início
        </Link>
      </div>
    );
  }

  if (order.status !== 'APPROVED') {
    return (
      <div className="bg-white dark:bg-[#121016] border border-gray-200 dark:border-[#1E1B26] rounded-3xl p-8 max-w-lg w-full mx-auto text-center space-y-4 shadow-xl text-gray-900 dark:text-[#F8FAFC]">
        <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-amber-200 dark:border-amber-500/30">…</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-[#F8FAFC]">Pagamento em confirmação</h2>
        <p className="text-sm text-gray-600 dark:text-[#94A3B8]">Ainda não recebemos a confirmação do pagamento. Atualize esta página daqui a pouco.</p>
      </div>
    );
  }

  const fullProduct = (await dbStore.getProductById(order.productId)) || order.product;
  const product = fullProduct;

  // Redirecionamento automático para Upsell se configurado no produto
  const configuredUpsellUrl =
    product?.checkoutSettings?.postPurchase?.upsellUrl?.trim() ||
    product?.checkoutSettings?.upsellUrl?.trim() ||
    '';
  const upsellUrl = safeHttpsUrl(configuredUpsellUrl);
  if (upsellUrl) {
    redirect(upsellUrl);
  }

  const transaction = order.transaction;
  const materials: { name: string; type: string; url?: string }[] =
    product?.materials && Array.isArray(product.materials) && product.materials.length > 0
      ? product.materials.map((material) => ({ ...material, url: safeHttpsUrl(material.url) }))
      : [{ name: `${product?.name || 'Material Oficial'} - Arquivo Completo.pdf`, type: 'pdf' }];
  const accessUrl = safeHttpsUrl(product?.contentUrl) || `https://conteudo.otterfy.co.mz/access/${order.id}`;

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Brand Header */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
          <img src="/logo.png" alt="Otterfy" className="w-full h-full object-contain" />
        </div>
        <span className="font-extrabold text-xl tracking-tight text-gray-900 dark:text-[#F8FAFC]">Otter<span className="text-purple-600 dark:text-purple-400">fy</span></span>
      </div>

      {/* Main Success Container */}
      <div className="bg-white dark:bg-[#121016] border border-gray-100 dark:border-[#1E1B26] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-gray-900 dark:text-[#F8FAFC]">
        {/* Animated Check & Congrats */}
        <div className="text-center space-y-3">
          <div className="relative inline-flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-emerald-400 opacity-20" />
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-[#059669] dark:text-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-[#059669] dark:text-emerald-400 inline-block mb-1.5">
              Pagamento Confirmado via {transaction?.method || 'M-Pesa'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-[#F8FAFC] tracking-tight">
              Parabéns pela sua compra!
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-[#94A3B8] max-w-md mx-auto mt-1">
              Olá, <strong className="text-gray-900 dark:text-[#F8FAFC]">{order.customerName}</strong>! Seu pedido foi aprovado e o seu acesso já está liberado.
            </p>
          </div>
        </div>

        {/* IMMEDIATE CONTENT DELIVERY CARD */}
        <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border-2 border-emerald-500/30 dark:border-emerald-500/40 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#059669] dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <h2 className="text-sm font-bold text-gray-900 dark:text-[#F8FAFC] uppercase tracking-wider">
                Seu Conteúdo Está Liberado
              </h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-[#059669] dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
              Acesso Imediato
            </span>
          </div>

          {/* Action 1: Link Direct Access Button */}
          <div className="space-y-2">
            <Link
              href={`/access/${order.id}`}
              className="otter-keep-colors w-full py-3.5 px-4 bg-[#059669] hover:bg-[#047857] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span className="text-white">Acessar Minha Área de Membros / Conteúdo</span>
              <span className="text-white">→</span>
            </Link>
            <p className="text-[11px] text-center text-gray-500 dark:text-[#94A3B8]">
              Um link direto também foi reservado para o seu número: <strong className="text-gray-800 dark:text-[#F8FAFC]">{order.customerPhone}</strong>
            </p>
          </div>

          {/* Action 2: Downloadable Materials */}
          {materials && materials.length > 0 && (
            <div className="pt-3 border-t border-emerald-500/20 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-[#94A3B8] block">
                Arquivos para Download Imediato:
              </span>
              <div className="space-y-2">
                {materials.map((mat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#16131F] border border-gray-200 dark:border-[#252033] hover:border-emerald-500 transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-[#059669] dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {mat.type === 'pdf' ? 'PDF' : mat.type === 'video' ? 'MP4' : mat.type === 'audio' ? 'MP3' : 'ZIP'}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-gray-900 dark:text-[#F8FAFC] truncate">{mat.name}</p>
                        <span className="text-[10px] text-gray-500 dark:text-[#94A3B8]">Download direto • Pronto para ler</span>
                      </div>
                    </div>

                    <a
                      href={mat.url || `/access/${order.id}`}
                      className="otter-keep-colors px-3 py-1.5 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <span className="text-white">Baixar</span>
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action 3: SaaS / Link on Delivery if specified */}
          {product?.contentUrl && (
            <div className="p-3 rounded-xl bg-white dark:bg-[#16131F] border border-gray-200 dark:border-[#252033] space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 block">
                Link de Entrega da Ferramenta / Plataforma:
              </span>
              <div className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-[#0F0E14] p-2 px-3 rounded-lg border border-gray-200 dark:border-[#252033]">
                <span className="text-xs text-gray-800 dark:text-[#CBD5E1] font-mono truncate">{product.contentUrl}</span>
                <a
                  href={safeHttpsUrl(product.contentUrl) || accessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-700 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-bold shrink-0 underline"
                >
                  Abrir Link
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Order Receipt Details */}
        <div className="bg-gray-50 dark:bg-[#0F0E14] rounded-2xl p-5 border border-gray-200 dark:border-[#1E1B26] space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-[#94A3B8] block">
            Resumo do Pedido
          </span>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-[#1E1B26]">
              <span className="text-gray-600 dark:text-[#94A3B8]">Item Principal</span>
              <span className="font-semibold text-gray-900 dark:text-[#F8FAFC]">{product?.name || 'Produto Otterfy'}</span>
            </div>

            {order.hasOrderBump && (
              <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-[#1E1B26] text-amber-700 dark:text-amber-400">
                <span className="flex items-center gap-1">
                  <span>⚡</span>
                  <span>{order.orderBumpTitle || 'Item Adicional (Order Bump)'}</span>
                </span>
                <span className="font-bold">+{formatMZN(order.orderBumpAmount || 250)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-[#1E1B26]">
              <span className="text-gray-600 dark:text-[#94A3B8]">Total Pago</span>
              <span className="text-base font-black text-[#059669] dark:text-emerald-400">
                {formatMZN(order.amount)}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-[#1E1B26]">
              <span className="text-gray-600 dark:text-[#94A3B8]">Método de Pagamento</span>
              <PaymentMethodBadge method={order.transaction?.method || 'MPESA'} size="sm" />
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-[#1E1B26]">
              <span className="text-gray-600 dark:text-[#94A3B8]">Código da Transação</span>
              <span className="font-mono text-gray-800 dark:text-[#CBD5E1] bg-white dark:bg-[#16131F] px-2 py-0.5 rounded border border-gray-200 dark:border-[#252033]">{order.id}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-[#94A3B8]">Data da Aprovação</span>
              <span className="text-gray-900 dark:text-[#F8FAFC] font-medium">
                {new Date(order.createdAt).toLocaleDateString('pt-MZ', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Support & Refund Rights Notice */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <svg aria-hidden="true" className="w-5 h-5 text-[#059669] dark:text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <div>
              <p className="font-bold text-gray-900 dark:text-[#F8FAFC]">Suporte ao Cliente &amp; Garantia de {BUSINESS_INFO.refundPeriodDays} Dias</p>
              <p className="text-[11px] text-gray-700 dark:text-[#94A3B8] leading-relaxed">
                Tem dúvidas ou pretende exercer o seu direito de reembolso? Consulte a nossa{' '}
                <Link href="/reembolso" className="font-bold text-[#047857] dark:text-emerald-400 underline">
                  Política de Reembolso
                </Link>{' '}
                ou contacte o suporte.
              </p>
            </div>
          </div>
          {product?.checkoutSettings?.whatsappSupport?.phone ? (
            <a
              href={`https://wa.me/${product.checkoutSettings.whatsappSupport.phone.replace(/\D/g, '')}?text=Ol%C3%A1!%20Acabei%20de%20comprar%20o%20produto%20${encodeURIComponent(product?.name || '')}%20(Pedido%20${order.id})`}
              target="_blank"
              rel="noopener noreferrer"
              className="otter-keep-colors px-3.5 py-2 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl transition-all shrink-0 text-center"
            >
              <span className="text-white">Falar com o Vendedor</span>
            </a>
          ) : (
            <a
              href={`mailto:${BUSINESS_INFO.supportEmail}?subject=${encodeURIComponent(`Suporte Pedido ${order.id}`)}`}
              className="otter-keep-colors px-3.5 py-2 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl transition-all shrink-0 text-center"
            >
              <span className="text-white">Contactar Suporte</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function SuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const resolvedOrderId = params.ref || params.orderId || params.order_id || params.id || params.checkout_id;
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F5F3FA] dark:bg-[#08070C] text-[#0F172A] dark:text-[#F8FAFC]">
      <main id="main-content" className="flex-1 py-10 px-4 flex flex-col items-center justify-center">
        <Suspense fallback={<div className="text-slate-700 dark:text-[#94A3B8] text-sm animate-pulse">A carregar os seus conteúdos...</div>}>
          <SuccessContent orderId={resolvedOrderId} />
        </Suspense>
      </main>
      <LegalFooter variant="auto" />
    </div>
  );
}
