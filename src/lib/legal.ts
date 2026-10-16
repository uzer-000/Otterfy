export const BUSINESS_INFO = {
  legalName: process.env.NEXT_PUBLIC_BUSINESS_LEGAL_NAME || 'Otterfy Tecnologias Digitais, Lda.',
  tradeName: 'Otterfy',
  brandName: 'Otterfy',
  nuit: process.env.NEXT_PUBLIC_BUSINESS_NUIT || '401 289 540',
  registrationEntity: 'Conservatória do Registo das Entidades Legais de Maputo (CREL)',
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || 'Av. Julius Nyerere, Distrito Urbano de KaMpfumo, Maputo, Moçambique',
  country: 'República de Moçambique',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'suporte@otterfy.co.mz',
  privacyEmail: process.env.NEXT_PUBLIC_PRIVACY_EMAIL || 'privacidade@otterfy.co.mz',
  dpoEmail: process.env.NEXT_PUBLIC_PRIVACY_EMAIL || 'privacidade@otterfy.co.mz',
  legalEmail: process.env.NEXT_PUBLIC_LEGAL_EMAIL || 'juridico@otterfy.co.mz',
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+258 84 000 0000',
  websiteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://otterfy.co.mz',
  lastUpdated: '16 de Outubro de 2026',
  defaultGuaranteeDays: 7,
  refundPeriodDays: 7,
} as const;

export interface CookieConsentPreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
  version: number;
}

export const COOKIE_CONSENT_STORAGE_KEY = 'otterfy_cookie_consent_v1';
export const COOKIE_CONSENT_CHANGED_EVENT = 'otterfy_cookie_consent_changed';
export const COOKIE_CONSENT_UPDATED_EVENT = COOKIE_CONSENT_CHANGED_EVENT;
export const OPEN_COOKIE_SETTINGS_EVENT = 'otterfy_open_cookie_settings';

export function getCookieConsent(): CookieConsentPreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      updatedAt: String(parsed.updatedAt || new Date().toISOString()),
      version: 1,
    };
  } catch {
    return null;
  }
}

export function saveCookieConsent(prefs: { analytics: boolean; marketing: boolean }): CookieConsentPreferences {
  const full: CookieConsentPreferences = {
    necessary: true,
    analytics: Boolean(prefs.analytics),
    marketing: Boolean(prefs.marketing),
    updatedAt: new Date().toISOString(),
    version: 1,
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(full));
      window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: full }));
    } catch {
      // ignore storage errors
    }
  }
  return full;
}

export function hasMarketingConsent(): boolean {
  const consent = getCookieConsent();
  return Boolean(consent?.marketing);
}

export function hasAnalyticsConsent(): boolean {
  const consent = getCookieConsent();
  return Boolean(consent?.analytics);
}

export function openCookieSettingsModal(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT));
  }
}
