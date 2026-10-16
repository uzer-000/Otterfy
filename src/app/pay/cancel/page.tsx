import { Suspense } from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { LegalFooter } from '@/components/legal/LegalFooter';
import { BUSINESS_INFO } from '@/lib/legal';

interface PageProps {
  searchParams: Promise<{
    ref?: string;
  }>;
}

async function CancelContent({ orderId }: { orderId?: string }) {
  let productId = '';

  if (orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { productId: true }
    });
    if (order) {
      productId = order.productId;
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg w-full mx-auto text-center shadow-xl">
      {/* Brand Header */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
          <img src="/logo.png" alt="Logótipo da Otterfy" className="w-full h-full object-contain" />
        </div>
        <span className="font-extrabold text-xl tracking-tight text-slate-900">Otter<span className="text-emerald-700">fy</span></span>
      </div>

      <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200">
        <svg aria-hidden="true" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      
      <h1 className="text-2xl font-bold text-slate-900 mb-3">
        Pagamento cancelado
      </h1>
      
      <p className="text-slate-600 text-sm mb-6 leading-relaxed">
        O seu pagamento não foi concluído e nenhum valor foi debitado. Pode tentar novamente ou utilizar outra carteira móvel.
      </p>

      {productId ? (
        <Link 
          href={`/pay/${productId}`}
          className="block w-full py-3.5 px-4 bg-[#059669] hover:bg-[#047857] text-white rounded-xl font-bold text-sm transition-colors mb-6 shadow-md"
        >
          Voltar ao Checkout e Tentar Novamente
        </Link>
      ) : (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6">
          <p className="text-slate-700 text-sm">
            Precisa de ajuda? Contacte o nosso suporte em{' '}
            <a href={`mailto:${BUSINESS_INFO.supportEmail}`} className="font-bold text-emerald-700 underline">
              {BUSINESS_INFO.supportEmail}
            </a>.
          </p>
        </div>
      )}

      <div className="text-center pt-3 border-t border-slate-100">
        <p className="text-slate-600 text-xs flex items-center justify-center gap-1.5">
          <span>Processado por</span>
          <img src="/logo.png" alt="" aria-hidden="true" className="w-3.5 h-3.5 object-contain inline-block align-middle" />
          <strong className="text-slate-900">Otterfy</strong>
        </p>
      </div>
    </div>
  );
}

export default async function CancelPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8F9FA]">
      <main id="main-content" className="flex-1 py-12 px-4 flex flex-col items-center justify-center">
        <Suspense fallback={<div className="text-slate-700 text-sm">A carregar estado do pedido...</div>}>
          <CancelContent orderId={params.ref} />
        </Suspense>
      </main>
      <LegalFooter variant="light" />
    </div>
  );
}
