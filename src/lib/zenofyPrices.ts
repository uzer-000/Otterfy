export interface ZenofyPriceTier {
  price: number;
  id: string;
  label: string;
  description?: string;
  badge?: string;
}

export const ZENOFY_PRICE_TIERS: ZenofyPriceTier[] = [
  {
    price: 99,
    id: '6aafae3123792dba224d2660',
    label: '99 MZN',
    description: 'Ticket Baixo / Entrada (Ebook Rápido)',
    badge: 'Entrada',
  },
  {
    price: 127,
    id: '6a6110d29a4b2e7346c66262',
    label: '127 MZN',
    description: 'Guia / Mini-Curso / PDF',
    badge: 'Popular',
  },
  {
    price: 197,
    id: '6a20e87879226fec50937c35',
    label: '197 MZN',
    description: 'Curso Básico / Ferramenta Digital',
    badge: 'Equilibrado',
  },
  {
    price: 247,
    id: '6aafae2e23792dba224d265f',
    label: '247 MZN',
    description: 'Treinamento Intermédio / Templates',
    badge: 'Recomendado',
  },
  {
    price: 297,
    id: '6a14cb656c431b52f6375dc2',
    label: '297 MZN',
    description: 'Curso Completo / SaaS / Mentoria',
    badge: 'Mais Vendido ⭐',
  },
  {
    price: 397,
    id: '6a14cac66c431b52f6375dc1',
    label: '397 MZN',
    description: 'Masterclass / Comunidade VIP / Combo',
    badge: 'Alto Valor',
  },
  {
    price: 497,
    id: '6aafae2a23792dba224d265e',
    label: '497 MZN',
    description: 'Formação Avançada / Acesso Anual',
    badge: 'Premium 👑',
  },
];

export function getZenofyTierByPrice(price: number): ZenofyPriceTier | undefined {
  return ZENOFY_PRICE_TIERS.find((t) => Math.round(t.price) === Math.round(price));
}

export function getZenofyTierById(id: string): ZenofyPriceTier | undefined {
  return ZENOFY_PRICE_TIERS.find((t) => t.id === id);
}

export const DEFAULT_ZENOFY_PRODUCT_ID = '6a14cb656c431b52f6375dc2'; // 297 MZN
