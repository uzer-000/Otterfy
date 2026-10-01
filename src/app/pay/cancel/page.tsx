import { Suspense } from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';

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
    <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-8 max-w-lg w-full mx-auto text-center">
      <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      
      <h1 className="text-2xl font-bold text-[#F8FAFC] mb-4">
        Pagamento cancelado
      </h1>
      
      <p className="text-[#94A3B8] mb-8">
        O seu pagamento não foi concluído. Pode tentar novamente ou utilizar outro método de pagamento.
      </p>

      {productId ? (
        <Link 
          href={`/pay/${productId}`}
          className="block w-full py-4 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-colors mb-6"
        >
          Tentar novamente
        </Link>
      ) : (
        <div className="p-4 bg-[#0F0E14] border border-[#1E1B26] rounded-xl mb-6">
          <p className="text-[#94A3B8] text-sm">Contacte o suporte se continuar a ter problemas.</p>
        </div>
      )}

      <div className="text-center">
        <p className="text-[#64748B] text-xs">
          Powered by <span className="font-bold text-[#F8FAFC]">Otterfy</span>
        </p>
      </div>
    </div>
  );
}

export default async function CancelPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <main className="min-h-screen py-12 px-4 flex flex-col items-center justify-center">
      <Suspense fallback={<div className="text-[#F8FAFC]">A carregar...</div>}>
        <CancelContent orderId={params.ref} />
      </Suspense>
    </main>
  );
}
