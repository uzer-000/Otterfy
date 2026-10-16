'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { getCookieConsent, COOKIE_CONSENT_CHANGED_EVENT } from '@/lib/legal';

interface Props {
  metaPixelId?: string;
  utmifyPixelId?: string;
}

export default function CheckoutTrackingScripts({ metaPixelId, utmifyPixelId }: Props) {
  const [marketingAllowed, setMarketingAllowed] = useState(false);

  useEffect(() => {
    const checkConsent = () => {
      const consent = getCookieConsent();
      setMarketingAllowed(Boolean(consent?.marketing));
    };

    checkConsent();
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, checkConsent);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, checkConsent);
    };
  }, []);

  if (!marketingAllowed) {
    return null;
  }

  // Strictly sanitize Pixel ID to digits/alphanumeric only
  const safeMetaPixelId = metaPixelId ? metaPixelId.replace(/[^a-zA-Z0-9_-]/g, '') : '';
  const hasUtmify = Boolean(utmifyPixelId && utmifyPixelId.trim().length > 0);

  return (
    <>
      {safeMetaPixelId && (
        <Script
          id="fb-pixel-consented"
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
              fbq('init', '${safeMetaPixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}

      {hasUtmify && (
        <Script
          id="utmify-script-consented"
          strategy="afterInteractive"
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          data-utmify-prevent-subids
        />
      )}
    </>
  );
}

export { CheckoutTrackingScripts };
