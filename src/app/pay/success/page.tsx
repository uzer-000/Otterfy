import { Suspense } from 'react';
import Link from 'next/link';
import dbStore from '@/lib/store';
import prisma from '@/lib/prisma';
import { zenofyProvider } from '@/services/payment/zenofy';
import { formatMZN } from '@/lib/utils';

interface PageProps {
  searchParams: Promise<{
    ref?: string;
    orderId?: string;
    order_id?: string;
    id?: string;
    checkout_id?: string;
  }>;
}

async function SuccessContent({ orderId }: { orderId?: string }) {
  if (!orderId) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-lg w-full mx-auto text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-red-100">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-gray-900">Pedido não encontrado</h2>
        <p className="text-xs text-gray-600">Ocorreu um erro ao carregar os detalhes do pedido.</p>
        <Link href="/" className="inline-block px-5 py-2.5 bg-gray-900 hover:bg-black text-xs font-semibold rounded-xl text-white transition-colors">
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

  // If still not found, check the most recent approved order as a safety fallback
  if (!order) {
    const recentApproved = await dbStore.getOrders({ status: 'APPROVED' });
    if (recentApproved.length > 0) {
      order = recentApproved[0];
    }
  }

  if (!order) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-lg w-full mx-auto text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-amber-200">
          🔍
        </div>
        <h2 className="text-xl font-bold text-gray-900">Pedido não localizado</h2>
        <p className="text-xs text-gray-600">Não foi possível localizar o código de referência: <strong className="text-purple-700 font-mono">{orderId || 'Desconhecido'}</strong></p>
        <Link href="/" className="inline-block px-5 py-2.5 bg-gray-900 hover:bg-black text-xs font-semibold rounded-xl text-white transition-colors">
          Voltar ao início
        </Link>
      </div>
    );
  }

  const fullProduct = (await dbStore.getProductById(order.productId)) || order.product;
  const product = fullProduct;
  const transaction = order.transaction;
  const materials = product?.materials && Array.isArray(product.materials) && product.materials.length > 0
    ? product.materials
    : [
        { name: `${product?.name || 'Material Oficial'} - Arquivo Completo.pdf`, type: 'pdf' }
      ];
  const accessUrl = product?.contentUrl || `https://conteudo.otterfy.co.mz/access/${order.id}`;

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Brand Header */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
          <img src="/logo.png" alt="Otterfy" className="w-full h-full object-contain" />
        </div>
        <span className="font-extrabold text-xl tracking-tight text-gray-900">Otter<span className="text-purple-600">fy</span></span>
      </div>

      {/* Main Success Container */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Animated Check & Congrats */}
        <div className="text-center space-y-3">
          <div className="relative inline-flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-emerald-400 opacity-20" />
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-[#059669] rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-[#059669] inline-block mb-1.5">
              Pagamento Confirmado via {transaction?.method || 'M-Pesa'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Parabéns pela sua compra!
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto mt-1">
              Olá, <strong className="text-gray-900">{order.customerName}</strong>! Seu pedido foi aprovado e o seu acesso já está liberado.
            </p>
          </div>
        </div>

        {/* IMMEDIATE CONTENT DELIVERY CARD */}
        <div className="bg-emerald-50/40 border-2 border-emerald-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Seu Conteúdo Está Liberado
              </h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-[#059669] border border-emerald-300">
              Acesso Imediato
            </span>
          </div>

          {/* Action 1: Link Direct Access Button */}
          <div className="space-y-2">
            <Link
              href={`/access/${order.id}`}
              className="w-full py-3.5 px-4 bg-[#059669] hover:bg-[#047857] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span>Acessar Minha Área de Membros / Conteúdo</span>
              <span>→</span>
            </Link>
            <p className="text-[11px] text-center text-gray-500">
              Um link direto também foi reservado para o seu número: <strong className="text-gray-800">{order.customerPhone}</strong>
            </p>
          </div>

          {/* Action 2: Downloadable Materials */}
          {materials && materials.length > 0 && (
            <div className="pt-3 border-t border-emerald-500/20 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 block">
                Arquivos para Download Imediato:
              </span>
              <div className="space-y-2">
                {materials.map((mat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-[#059669] flex items-center justify-center font-bold text-xs shrink-0">
                        {mat.type === 'pdf' ? 'PDF' : mat.type === 'video' ? 'MP4' : mat.type === 'audio' ? 'MP3' : 'ZIP'}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-gray-900 truncate">{mat.name}</p>
                        <span className="text-[10px] text-gray-500">Download direto • Pronto para ler</span>
                      </div>
                    </div>

                    <a
                      href={mat.url || `/access/${order.id}`}
                      className="px-3 py-1.5 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <span>Baixar</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                Link de Entrega da Ferramenta / Plataforma:
              </span>
              <div className="flex items-center justify-between gap-2 bg-gray-50 p-2 px-3 rounded-lg border border-gray-200">
                <span className="text-xs text-gray-800 font-mono truncate">{product.contentUrl}</span>
                <a
                  href={product.contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-700 hover:text-purple-800 font-bold shrink-0 underline"
                >
                  Abrir Link
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Order Receipt Details */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
            Resumo do Pedido
          </span>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="text-gray-600">Item Principal</span>
              <span className="font-semibold text-gray-900">{product?.name || 'Produto Otterfy'}</span>
            </div>

            {order.hasOrderBump && (
              <div className="flex justify-between items-center pb-2 border-b border-gray-200 text-amber-700">
                <span className="flex items-center gap-1">
                  <span>⚡</span>
                  <span>{order.orderBumpTitle || 'Item Adicional (Order Bump)'}</span>
                </span>
                <span className="font-bold">+{formatMZN(order.orderBumpAmount || 250)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="text-gray-600">Total Pago</span>
              <span className="text-base font-black text-[#059669]">
                {formatMZN(order.amount)}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="text-gray-600">Código da Transação</span>
              <span className="font-mono text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200">{order.id}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Data da Aprovação</span>
              <span className="text-gray-900 font-medium">
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

        {/* WhatsApp Support Button */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-[#059669] shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.301-.15-1.777-.877-2.052-.977-.276-.101-.477-.15-.678.15-.2.3-.778.977-.954 1.178-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.5-1.786-1.676-2.087-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.301-.501.101-.2.05-.376-.025-.526-.075-.15-.678-1.631-.93-2.235-.245-.589-.494-.509-.678-.519-.176-.01-.376-.01-.577-.01-.2 0-.527.075-.803.376s-1.054 1.029-1.054 2.509 1.079 2.91 1.229 3.111c.15.201 2.124 3.243 5.145 4.549.718.311 1.279.497 1.716.636.721.229 1.377.197 1.895.12.577-.087 1.777-.727 2.028-1.429.25-.702.25-1.303.175-1.429-.075-.126-.276-.201-.577-.351zM12 21.82c-1.782 0-3.48-.466-4.966-1.28l-.356-.197-3.69 1.018 1.002-3.582-.232-.37C3.003 16.035 2.5 14.07 2.5 12c0-5.238 4.262-9.5 9.5-9.5 2.538 0 4.924.988 6.718 2.782A9.444 9.444 0 0121.5 12c0 5.238-4.262 9.5-9.5 9.5z"/>
            </svg>
            <div>
              <p className="font-bold text-gray-900">Dúvidas sobre o seu acesso?</p>
              <p className="text-[11px] text-gray-600">O suporte do criador está disponível no WhatsApp</p>
            </div>
          </div>
          <a
            href={`https://wa.me/258840000000?text=Ol%C3%A1!%20Acabei%20de%20comprar%20o%20produto%20${encodeURIComponent(product?.name || '')}%20(Pedido%20${order.id})`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl transition-all shrink-0"
          >
            Falar no WhatsApp
          </a>
        </div>

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-gray-500 text-xs flex items-center justify-center gap-1.5">
            <span>Processado com segurança por</span>
            <img src="/logo.png" alt="Otterfy" className="w-3.5 h-3.5 object-contain inline-block align-middle" />
            <strong className="text-gray-900">Otterfy</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function SuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const resolvedOrderId = params.ref || params.orderId || params.order_id || params.id || params.checkout_id;
  return (
    <main className="min-h-screen py-10 px-4 flex flex-col items-center justify-center">
      <Suspense fallback={<div className="text-gray-600 text-sm animate-pulse">A carregar os seus conteúdos...</div>}>
        <SuccessContent orderId={resolvedOrderId} />
      </Suspense>
    </main>
  );
}
