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
      <main className="min-h-screen py-16 px-4 flex flex-col items-center justify-center bg-[#09080E] text-center">
        <div className="max-w-md w-full p-8 rounded-3xl border border-[#1E1B26] bg-[#121016] shadow-2xl space-y-5 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-3xl">
            🛍️
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">
              {!product ? 'Produto Não Encontrado' : 'Produto Temporariamente Indisponível'}
            </h1>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              {!product
                ? 'O link de checkout que você tentou acessar não existe ou pode ter sido removido.'
                : 'Este produto está temporariamente desativado pelo vendedor.'}
            </p>
          </div>
          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-violet-600/20"
            >
              Ir para o Início
            </a>
          </div>
          <div className="pt-4 border-t border-[#1E1B26] flex items-center justify-center gap-1.5 text-[#64748B] text-xs">
            <span>Checkout seguro por</span>
            <span className="font-bold text-[#F8FAFC]">Otterfy</span>
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
  const timerText = product.checkoutSettings?.customCheckout?.timerText || 'Esta oferta especial termina em:';

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

      <main className="min-h-screen py-10 px-4 flex flex-col items-center">
        <div className="w-full max-w-5xl space-y-6">
          {/* Custom Banner if configured */}
          {bannerUrl && (
            <div className="w-full rounded-2xl overflow-hidden border border-[#1E1B26] shadow-2xl bg-[#121016] animate-fadeIn">
              <img
                src={bannerUrl}
                alt="Banner promocional"
                className="w-full h-auto max-h-48 sm:max-h-60 object-cover"
              />
            </div>
          )}

          {/* Urgency Scarcity Timer */}
          {isUrgencyTimerEnabled && (
            <CheckoutUrgencyTimer
              productId={product.id}
              timerMinutes={timerMinutes}
              timerText={timerText}
            />
          )}

          {/* Unified High-Converting Checkout (Holding the Product & Payment) */}
          <Suspense fallback={<div className="p-8 text-center text-xs text-[#94A3B8]">Carregando checkout...</div>}>
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
          <div className="text-center pb-8 flex items-center justify-center gap-1.5 text-[#64748B] text-xs">
            <span>Powered by</span>
            <img src="/logo.png" alt="Otterfy" className="w-4 h-4 object-contain inline-block align-middle" />
            <span className="font-bold text-[#F8FAFC]">Otterfy</span>
          </div>
        </div>
      </main>
    </>
  );
}
