import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Script from 'next/script';
import dbStore from '@/lib/store';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import CheckoutUrgencyTimer from '@/components/checkout/CheckoutUrgencyTimer';
import { formatMZN } from '@/lib/utils';

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
      <main className="min-h-screen py-16 px-4 flex flex-col items-center justify-center bg-[#F8F9FA] text-center">
        <div className="max-w-md w-full p-8 rounded-3xl border border-gray-200 bg-white shadow-xl space-y-5 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto text-3xl">
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
              Ir para o Início
            </a>
          </div>
          <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-gray-500 text-xs">
            <span>Checkout seguro por</span>
            <span className="font-bold text-gray-900">Otterfy</span>
          </div>
        </div>
      </main>
    );
  }

  const metaPixelId = product.tracking?.metaPixelId;
  const utmifyPixelId = product.tracking?.utmifyPixelId;

  const bannerUrl = product.checkoutSettings?.customCheckout?.bannerUrl;
  const isUrgencyTimerEnabled = product.checkoutSettings?.customCheckout?.urgencyTimer !== false;
  const timerMinutes = product.checkoutSettings?.customCheckout?.timerMinutes || 6;
  const timerText = product.checkoutSettings?.customCheckout?.timerText || 'Oferta expira em';

  return (
    <>
      {/* 1. Meta / Facebook Pixel Injection */}
      {metaPixelId && (
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}

      {/* 2. Utmify Tracking Script Injection */}
      {utmifyPixelId && (
        <Script
          id="utmify-script"
          strategy="afterInteractive"
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          data-utmify-prevent-subids
        />
      )}

      <main className="min-h-screen flex flex-col items-center bg-[#F8F9FA]">
        {/* Urgency Scarcity Timer across top if enabled */}
        {isUrgencyTimerEnabled && (
          <CheckoutUrgencyTimer
            productId={product.id}
            timerMinutes={timerMinutes}
            timerText={timerText}
          />
        )}

        <div className="w-full max-w-[500px] py-6 sm:py-8 px-4 space-y-6">
          {/* Custom Banner if configured */}
          {bannerUrl && (
            <div className="w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white animate-fadeIn">
              <img
                src={bannerUrl}
                alt="Banner promocional"
                className="w-full h-auto max-h-48 sm:max-h-60 object-cover"
              />
            </div>
          )}

          {/* Unified High-Converting Checkout (Holding the Product & Payment) */}
          <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500 font-medium">Carregando checkout...</div>}>
            <CheckoutForm
              productId={product.id}
              productName={product.name}
              price={product.price}
              productImageUrl={product.imageUrl}
              productDescription={product.description}
              tracking={product.tracking}
              checkoutSettings={product.checkoutSettings}
            />
          </Suspense>

          {/* Branding */}
          <div className="text-center pb-8 flex items-center justify-center gap-1.5 text-gray-500 text-xs font-medium">
            <span>Powered by</span>
            <img src="/logo.png" alt="Otterfy" className="w-4 h-4 object-contain inline-block align-middle" />
            <span className="font-bold text-gray-800">Otterfy</span>
          </div>
        </div>
      </main>
    </>
  );
}
