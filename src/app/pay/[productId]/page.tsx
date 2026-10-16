import { Suspense } from 'react';
import dbStore from '@/lib/store';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import CheckoutUrgencyTimer from '@/components/checkout/CheckoutUrgencyTimer';
import { CheckoutTrackingScripts } from '@/components/checkout/CheckoutTrackingScripts';
import { LegalFooter } from '@/components/legal/LegalFooter';

interface PageProps {
  params: Promise<{
    productId: string;
  }>;
}

export default async function CheckoutPage({ params }: PageProps) {
  const resolvedParams = await params;
  const rawId = resolvedParams?.productId || '';
  const cleanProductId = decodeURIComponent(rawId).trim();

  let product = await dbStore.getProductById(cleanProductId);

  // If testing with 'demo'
  if (!product && cleanProductId.toLowerCase() === 'demo') {
    product = {
      id: 'demo',
      name: 'Curso de Marketing Digital Pro',
      description: 'Aprenda tráfego pago, funis de conversão e estratégias práticas de vendas online para Moçambique.',
      price: 1500,
      imageUrl: null,
      status: 'ACTIVE',
      userId: 'admin-user-otterfy',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  if (!product || product.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#F8F9FA]">
        <main id="main-content" className="flex-1 py-16 px-4 flex flex-col items-center justify-center text-center">
          <div className="max-w-md w-full p-8 rounded-3xl border border-gray-200 bg-white shadow-xl space-y-5 animate-fadeIn">
            <div aria-hidden="true" className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto text-3xl">
              🛍️
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-gray-900">
                {!product ? 'Produto Não Encontrado' : 'Produto Temporariamente Indisponível'}
              </h1>
              <p className="text-sm text-gray-600 leading-relaxed">
                {!product
                  ? 'O link de checkout que você tentou acessar não existe ou pode ter sido removido.'
                  : 'Este produto está temporariamente desativado pelo vendedor.'}
              </p>
            </div>
            <div className="pt-2">
              <a
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-semibold text-xs transition-colors shadow-md"
              >
                Voltar à Página Inicial
              </a>
            </div>
          </div>
        </main>
        <LegalFooter variant="light" />
      </div>
    );
  }

  const metaPixelId = /^\d{5,32}$/.test(product.tracking?.metaPixelId || '') ? product.tracking!.metaPixelId : undefined;
  const utmifyPixelId = /^[A-Za-z0-9_-]{3,80}$/.test(product.tracking?.utmifyPixelId || '') ? product.tracking!.utmifyPixelId : undefined;

  const bannerUrl = product.checkoutSettings?.customCheckout?.bannerUrl;
  // Opt-in only: do not display countdown timer unless explicitly enabled by seller
  const isUrgencyTimerEnabled = product.checkoutSettings?.customCheckout?.urgencyTimer === true;
  const timerMinutes = product.checkoutSettings?.customCheckout?.timerMinutes || 6;
  const timerText = product.checkoutSettings?.customCheckout?.timerText || 'Oferta promocional expira em';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8F9FA]">
      {/* Gated third-party tracking scripts (loaded ONLY after explicit marketing cookie consent) */}
      <CheckoutTrackingScripts metaPixelId={metaPixelId} utmifyPixelId={utmifyPixelId} />

      <main id="main-content" className="flex-1 flex flex-col items-center">
        {/* Urgency Timer across top only if explicitly enabled */}
        {isUrgencyTimerEnabled && (
          <CheckoutUrgencyTimer
            productId={product.id}
            timerMinutes={timerMinutes}
            timerText={timerText}
          />
        )}

        <div className="w-full max-w-[500px] py-6 sm:py-9 px-4 space-y-5">
          {/* Custom Banner if configured */}
          {bannerUrl && (
            <div className="w-full rounded-2xl overflow-hidden border border-gray-200/80 shadow-sm bg-white animate-fadeIn">
              <img
                src={bannerUrl}
                alt={`Banner de apresentação: ${product.name}`}
                className="w-full h-auto max-h-48 sm:max-h-60 object-cover"
              />
            </div>
          )}

          {/* Unified Checkout Form */}
          <Suspense
            fallback={
              <div className="bg-white rounded-[24px] border border-gray-100 shadow-xl p-6 sm:p-7 space-y-4 animate-pulse">
                <div className="flex items-center gap-3.5 pb-3 border-b border-gray-100">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-5 bg-emerald-100 rounded w-1/3" />
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="h-11 bg-gray-50 rounded-xl" />
                  <div className="h-11 bg-gray-50 rounded-xl" />
                  <div className="h-11 bg-gray-50 rounded-xl" />
                </div>
                <div className="h-14 bg-emerald-600/20 rounded-xl" />
              </div>
            }
          >
            <CheckoutForm
              productId={product.id}
              productName={product.name}
              price={product.price}
              productImageUrl={product.imageUrl}
              checkoutSettings={{
                coupons: product.checkoutSettings?.coupons,
                orderBump: product.checkoutSettings?.orderBump,
                extraOffers: product.checkoutSettings?.extraOffers,
                customCheckout: product.checkoutSettings?.customCheckout,
                whatsappSupport: product.checkoutSettings?.whatsappSupport,
              }}
            />
          </Suspense>
        </div>
      </main>

      <LegalFooter variant="light" />
    </div>
  );
}
