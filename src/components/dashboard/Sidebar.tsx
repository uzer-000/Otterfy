'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import Link, { useLinkStatus } from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutAction } from '@/app/dashboard/actions';

/* -------------------------------------------------------------------------- */
/*                                   ÍCONES                                   */
/* -------------------------------------------------------------------------- */
const ICONS = {
  // Loja / Vendedor (storefront)
  store: (
    <>
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" />
    </>
  ),
  // Dashboard (4 squares grid)
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  // Pagamentos (checklist with checkmarks)
  payments: (
    <>
      <path d="m3 7 2 2 4-4" />
      <path d="M12 7h9" />
      <path d="m3 17 2 2 4-4" />
      <path d="M12 17h9" />
    </>
  ),
  // SAC (headset customer service)
  sac: (
    <>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </>
  ),
  // Produtos & Visão Geral (isometric 3D box)
  products: (
    <>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </>
  ),
  // Cupons (discount ticket with percent)
  coupons: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-6 6" />
      <path d="M9 9h.01" />
      <path d="M15 15h.01" />
    </>
  ),
  // Loja (storefront)
  loja: (
    <>
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
    </>
  ),
  // Quiz (branch node with plus)
  quiz: (
    <>
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="6" r="3" />
      <path d="M6 15V9a3 3 0 0 1 3-3h6" />
      <path d="M18 15v6" />
      <path d="M15 18h6" />
    </>
  ),
  // Afiliados (handshake)
  affiliates: (
    <>
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
      <path d="m21 3 1 11h-2" />
      <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
      <path d="M3 4h8" />
    </>
  ),
  // Ferramentas (pocket calculator)
  tools: (
    <>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="16" x2="16" y1="14" y2="18" />
      <path d="M16 10h.01" />
      <path d="M12 10h.01" />
      <path d="M8 10h.01" />
      <path d="M12 14h.01" />
      <path d="M8 14h.01" />
      <path d="M12 18h.01" />
      <path d="M8 18h.01" />
    </>
  ),
  // Métricas (bar chart)
  metrics: (
    <>
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </>
  ),
  // Domínios (globe)
  domains: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </>
  ),
  // Gateways (card)
  gateways: (
    <>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </>
  ),
  // Saques (cash banknotes)
  withdrawals: (
    <>
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </>
  ),
  // Logística (truck)
  logistics: (
    <>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M14 8h4.5a2 2 0 0 1 1.6.8L22 12v5a1 1 0 0 1-1 1h-2" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  // Sistema ERP (wall power plug)
  erp: (
    <>
      <path d="M12 22v-5" />
      <path d="M9 8V2" />
      <path d="M15 8V2" />
      <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
    </>
  ),
  // Comunicações (envelope)
  communications: (
    <>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </>
  ),
  // Webhook
  webhook: (
    <>
      <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c0-2.21 1.79-4 4-4h.5" />
      <circle cx="6" cy="17" r="2" />
      <circle cx="18" cy="17" r="2" />
      <circle cx="18" cy="7" r="2" />
      <path d="M18 9v6" />
      <path d="m14 13-3-3" />
    </>
  ),
  // WhatsApp
  whatsapp: (
    <>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </>
  ),
  // Telegram Bot (robot head)
  telegram: (
    <>
      <rect width="18" height="12" x="3" y="8" rx="2" />
      <path d="M12 2v4" />
      <circle cx="8" cy="14" r="1.5" />
      <circle cx="16" cy="14" r="1.5" />
      <path d="M2 14h1M21 14h1" />
    </>
  ),
  // Discord Bot
  discord: (
    <>
      <path d="M18.89 5.86A16.03 16.03 0 0 0 15 4.5a.1.1 0 0 0-.08.05c-.37.66-.78 1.53-1.07 2.22a14.86 14.86 0 0 0-4.7 0c-.29-.69-.7-1.56-1.07-2.22a.1.1 0 0 0-.08-.05 16 16 0 0 0-3.89 1.36.08.08 0 0 0-.04.04C2.65 11.83 2 17.65 2.47 23.41a.1.1 0 0 0 .04.07 16.14 16.14 0 0 0 4.88 2.48.1.1 0 0 0 .1-.04c.38-.52.71-1.07 1-1.65a.1.1 0 0 0-.05-.13 10.6 10.6 0 0 1-1.53-.73.1.1 0 0 1 0-.15c.1-.08.2-.16.3-.24a.1.1 0 0 1 .1 0 11.5 11.5 0 0 0 9.88 0 .1.1 0 0 1 .1 0c.1.08.2.16.3.24a.1.1 0 0 1 0 .15c-.48.28-1 .52-1.53.73a.1.1 0 0 0-.05.13c.29.58.62 1.13 1 1.65a.1.1 0 0 0 .1.04 16.09 16.09 0 0 0 4.89-2.48.1.1 0 0 0 .04-.07c.56-6.66-.96-12.43-3.66-17.51a.08.08 0 0 0-.04-.04Z" />
      <circle cx="8.5" cy="15" r="1.5" />
      <circle cx="15.5" cy="15" r="1.5" />
    </>
  ),
  // Carrinhos Abandonados... (cart)
  abandoned_carts: (
    <>
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </>
  ),
  // Simulador de Taxas (%)
  tax_calc: (
    <>
      <line x1="19" x2="5" y1="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </>
  ),
  // MCP (chip / book)
  mcp: (
    <>
      <rect width="16" height="16" x="4" y="4" rx="2" />
      <rect width="6" height="6" x="9" y="9" rx="1" />
      <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
    </>
  ),
  // Minhas faturas (banknote)
  invoices: (
    <>
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </>
  ),
  // Ajuda (?)
  help: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </>
  ),
  // Configurações (gear)
  settings: (
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  // Minha conta (user outline)
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    </>
  ),
  // Sair (exit door)
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </>
  ),
  // Chevrons & UI
  chevronRight: <path d="m9 18 6-6-6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  close: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h10" />
    </>
  ),
} satisfies Record<string, ReactNode>;

type IconName = keyof typeof ICONS;

function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return (
    <svg
      className={`otter-sb-icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.85}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}



/* -------------------------------------------------------------------------- */
/*                            ESTRUTURA COMPLETA                              */
/* -------------------------------------------------------------------------- */
interface NavLeaf {
  kind: 'link';
  name: string;
  href: string;
  icon: IconName;
  exact?: boolean;
}

interface NavGroup {
  kind: 'group';
  id: string;
  name: string;
  icon: IconName;
  children: NavLeaf[];
}

type NavEntry = NavLeaf | NavGroup;

interface NavSection {
  title: string;
  entries: NavEntry[];
}

function buildSections(): NavSection[] {
  return [
    {
      title: 'MENU',
      entries: [
        { kind: 'link', name: 'Dashboard', href: '/dashboard', icon: 'dashboard', exact: true },
        { kind: 'link', name: 'Pagamentos', href: '/dashboard/payments', icon: 'payments' },
        { kind: 'link', name: 'SAC', href: '/dashboard/integrations', icon: 'sac' },
        {
          kind: 'group',
          id: 'produtos',
          name: 'Produtos',
          icon: 'products',
          children: [
            { kind: 'link', name: 'Visão geral', href: '/dashboard/products', icon: 'products' },
            { kind: 'link', name: 'Cupons', href: '/dashboard/marketing', icon: 'coupons' },
          ],
        },
        { kind: 'link', name: 'Loja', href: '/dashboard/checkout-preview', icon: 'loja' },
        { kind: 'link', name: 'Quiz', href: '/dashboard/automations', icon: 'quiz' },
        { kind: 'link', name: 'Afiliados', href: '/dashboard/affiliates', icon: 'affiliates' },
        {
          kind: 'group',
          id: 'ferramentas',
          name: 'Ferramentas',
          icon: 'tools',
          children: [
            { kind: 'link', name: 'Métricas', href: '/dashboard/metrics', icon: 'metrics' },
            { kind: 'link', name: 'Domínios', href: '/dashboard/integrations', icon: 'domains' },
            { kind: 'link', name: 'Gateways', href: '/dashboard/gateways', icon: 'gateways' },
            { kind: 'link', name: 'Saques', href: '/dashboard/finances', icon: 'withdrawals' },
            { kind: 'link', name: 'Logística', href: '/dashboard/integrations', icon: 'logistics' },
            { kind: 'link', name: 'Sistema ERP', href: '/dashboard/integrations', icon: 'erp' },
            { kind: 'link', name: 'Comunicações', href: '/dashboard/integrations', icon: 'communications' },
            { kind: 'link', name: 'Webhook', href: '/dashboard/integrations', icon: 'webhook' },
            { kind: 'link', name: 'WhatsApp', href: '/dashboard/automations', icon: 'whatsapp' },
            { kind: 'link', name: 'Telegram Bot', href: '/dashboard/automations', icon: 'telegram' },
            { kind: 'link', name: 'Discord Bot', href: '/dashboard/automations', icon: 'discord' },
            { kind: 'link', name: 'Carrinhos Abandona...', href: '/dashboard/campaigns', icon: 'abandoned_carts' },
            { kind: 'link', name: 'Simulador de Taxas', href: '/dashboard/finances', icon: 'tax_calc' },
            { kind: 'link', name: 'MCP', href: '/dashboard/developer', icon: 'mcp' },
          ],
        },
      ],
    },
    {
      title: 'GERAL',
      entries: [
        { kind: 'link', name: 'Minhas faturas', href: '/dashboard/finances', icon: 'invoices' },
        { kind: 'link', name: 'Ajuda', href: '/dashboard/invite', icon: 'help' },
        {
          kind: 'group',
          id: 'configuracoes',
          name: 'Configurações',
          icon: 'settings',
          children: [
            { kind: 'link', name: 'Minha conta', href: '/dashboard/settings', icon: 'user' },
          ],
        },
      ],
    },
  ];
}

function matchesPath(leaf: NavLeaf, path: string) {
  return leaf.exact ? path === leaf.href : path === leaf.href || path.startsWith(`${leaf.href}/`);
}

function PendingDot() {
  const { pending } = useLinkStatus();
  return <span aria-hidden className="otter-sb-pending" data-pending={pending ? 'true' : 'false'} />;
}

/* -------------------------------------------------------------------------- */
/*                                   SIDEBAR                                  */
/* -------------------------------------------------------------------------- */
export default function Sidebar({ userEmail = 'admin@otterfy.co.mz' }: { userEmail?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [pending, setPending] = useState<{ href: string; from: string } | null>(null);
  const [groupOverrides, setGroupOverrides] = useState<Record<string, boolean>>({});

  const listRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());
  const asideRef = useRef<HTMLElement>(null);
  const modeRef = useRef<HTMLDivElement>(null);
  const firstMeasure = useRef(true);
  const drag = useRef<{ x: number; y: number; dx: number; axis: 'x' | 'y' | null } | null>(null);

  const sections = useMemo(() => buildSections(), []);

  const leaves = useMemo(
    () =>
      sections.flatMap((s) => s.entries.flatMap((e) => (e.kind === 'group' ? e.children : [e]))),
    [sections],
  );

  // Determina o item ativo
  const routeActiveHref = useMemo(() => {
    let best: NavLeaf | null = null;
    for (const leaf of leaves) {
      if (matchesPath(leaf, pathname) && (!best || leaf.href.length > best.href.length)) best = leaf;
    }
    if (!best && pathname === '/dashboard') {
      return '/dashboard';
    }
    return best?.href ?? null;
  }, [leaves, pathname]);

  const activeHref = pending && pending.from === pathname ? pending.href : routeActiveHref;

  const groupOf = useCallback(
    (href: string | null) => {
      if (!href) return null;
      for (const s of sections) {
        for (const e of s.entries) {
          if (e.kind === 'group' && e.children.some((c) => c.href === href)) return e;
        }
      }
      return null;
    },
    [sections],
  );

  const activeGroup = groupOf(activeHref);

  const isGroupOpen = useCallback(
    (g: NavGroup) => groupOverrides[g.id] ?? activeGroup?.id === g.id,
    [groupOverrides, activeGroup],
  );

  const toggleGroup = (g: NavGroup) =>
    setGroupOverrides((prev) => ({ ...prev, [g.id]: !isGroupOpen(g) }));

  const activeGroupOpen = activeGroup ? isGroupOpen(activeGroup) : false;
  const targetKey = activeGroup && !activeGroupOpen ? `group:${activeGroup.id}` : activeHref;
  const targetLevel = activeGroup && activeGroupOpen ? 'sub' : 'top';

  /* ------------------- Pill deslizante suave (0ms lag) ------------------- */
  const measure = useCallback(() => {
    const list = listRef.current;
    const hl = highlightRef.current;
    if (!list || !hl) return;
    const el = targetKey ? itemRefs.current.get(targetKey) : undefined;
    if (!el) {
      hl.dataset.ready = 'false';
      return;
    }
    const lr = list.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (firstMeasure.current) hl.dataset.instant = 'true';
    hl.style.transform = `translate3d(${r.left - lr.left}px, ${r.top - lr.top}px, 0)`;
    hl.style.width = `${r.width}px`;
    hl.style.height = `${r.height}px`;
    hl.dataset.level = targetLevel;
    hl.dataset.ready = 'true';
    if (firstMeasure.current) {
      firstMeasure.current = false;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (highlightRef.current) highlightRef.current.dataset.instant = 'false';
        });
      });
    }
  }, [targetKey, targetLevel]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    });
    ro.observe(list);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [measure]);

  const setItemRef = (key: string) => (el: HTMLElement | null) => {
    if (el) itemRefs.current.set(key, el);
    else itemRefs.current.delete(key);
  };

  /* ------------------- Navegação otimista & instantânea ------------------- */
  const handleNavigate = (href: string) => (e: ReactMouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (href !== pathname) setPending({ href, from: pathname });
    setMobileOpen(false);
  };

  const handlePrefetch = (href: string) => () => {
    try {
      router.prefetch(href);
    } catch {}
  };

  /* ---------------------- Mobile Gestures & Drawer ----------------------- */
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const onTouchStart = (e: ReactTouchEvent) => {
    if (!mobileOpen) return;
    const t = e.touches[0];
    drag.current = { x: t.clientX, y: t.clientY, dx: 0, axis: null };
  };

  const onTouchMove = (e: ReactTouchEvent) => {
    const d = drag.current;
    const aside = asideRef.current;
    if (!d || !aside) return;
    const t = e.touches[0];
    const dx = t.clientX - d.x;
    const dy = t.clientY - d.y;
    if (!d.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (d.axis === 'x') aside.dataset.dragging = 'true';
    }
    if (d.axis !== 'x') return;
    d.dx = Math.min(0, dx);
    aside.style.transform = `translate3d(${d.dx}px, 0, 0)`;
  };

  const onTouchEnd = () => {
    const d = drag.current;
    const aside = asideRef.current;
    drag.current = null;
    if (!d || !aside || d.axis !== 'x') return;
    aside.dataset.dragging = 'false';
    aside.style.transform = '';
    if (d.dx < -70) setMobileOpen(false);
  };

  /* ---------------------- Selector Vendedor / Afiliado -------------------- */
  const panelMode: 'seller' | 'affiliate' = pathname.startsWith('/dashboard/become-affiliate')
    ? 'affiliate'
    : 'seller';

  useEffect(() => {
    if (!modeMenuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (modeRef.current && !modeRef.current.contains(e.target as Node)) setModeMenuOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [modeMenuOpen]);

  const switchMode = (mode: 'seller' | 'affiliate') => {
    setModeMenuOpen(false);
    const href = mode === 'seller' ? '/dashboard' : '/dashboard/become-affiliate';
    if (mode !== panelMode) {
      setPending({ href, from: pathname });
      setMobileOpen(false);
      router.push(href);
    }
  };

  /* ------------------------------- Render -------------------------------- */
  const renderLeaf = (leaf: NavLeaf, sub = false) => {
    const isActive = activeHref === leaf.href;
    return (
      <Link
        key={leaf.name}
        href={leaf.href}
        ref={setItemRef(leaf.href)}
        onClick={handleNavigate(leaf.href)}
        onMouseEnter={handlePrefetch(leaf.href)}
        onTouchStart={handlePrefetch(leaf.href)}
        data-active={isActive ? 'true' : 'false'}
        aria-current={isActive ? 'page' : undefined}
        prefetch={true}
        className={`otter-sb-item ${sub ? 'otter-sb-item--sub' : ''}`}
      >
        <Icon name={leaf.icon} />
        <span className="truncate">{leaf.name}</span>
        <PendingDot />
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Top Header: Menu hambúrguer à esquerda, Logo Otterfy centralizado */}
      <div className="otter-mobile-bar md:hidden">
        <div className="flex items-center justify-between h-14 px-3.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--sb-control-border)] bg-[var(--sb-control-bg)] text-[#FFFFFF] active:scale-95 transition-transform duration-150"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              {ICONS.menu}
            </svg>
          </button>

          <Link href="/dashboard" className="flex items-center gap-2" onClick={handleNavigate('/dashboard')}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Otterfy" className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <span className="text-[17px] font-bold tracking-tight text-[#FFFFFF]">
              Otter<span className="text-[#3B82F6]">fy</span>
            </span>
          </Link>

          <div className="w-10" />
        </div>
      </div>

      {/* Backdrop overlay no mobile */}
      <div
        className="otter-drawer-overlay md:hidden"
        data-open={mobileOpen ? 'true' : 'false'}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Principal (Design exato da foto do usuário) */}
      <aside
        ref={asideRef}
        className="otter-sidebar md:w-[260px] md:min-w-[260px] md:shrink-0 flex flex-col h-full md:h-auto"
        data-open={mobileOpen ? 'true' : 'false'}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        aria-label="Menu lateral"
      >


        {/* Topo no Mobile: Logo + Botão Fechar */}
        <div className="md:hidden flex items-center justify-between px-4 pt-3.5 pb-1 relative z-10">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Otterfy" className="w-6 h-6 object-contain" />
            <span className="text-[16px] font-bold text-white tracking-tight">
              Otter<span className="text-[#3B82F6]">fy</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white active:scale-90 transition-transform"
            aria-label="Fechar menu"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              {ICONS.close}
            </svg>
          </button>
        </div>

        {/* Topo: Card "Vendedor" (como na primeira linha da foto) */}
        <div className="relative z-10 px-3.5 pt-3 pb-2">
          <div ref={modeRef} className="relative">
            <button
              type="button"
              className="otter-sb-control"
              onClick={() => setModeMenuOpen((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={modeMenuOpen}
            >
              <Icon name={panelMode === 'seller' ? 'store' : 'affiliates'} />
              <span className="flex-1 text-left">{panelMode === 'seller' ? 'Vendedor' : 'Afiliado'}</span>
              <svg
                className="w-4 h-4 text-[#94A3B8] transition-transform duration-300"
                style={{ transform: modeMenuOpen ? 'rotate(180deg)' : undefined }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {ICONS.chevronDown}
              </svg>
            </button>

            {/* Menu suspenso de alternância de painel */}
            <div className="otter-sb-menu" data-open={modeMenuOpen ? 'true' : 'false'} role="listbox">
              {(
                [
                  { mode: 'seller', label: 'Vendedor', hint: 'Painel do produtor', icon: 'store' },
                  { mode: 'affiliate', label: 'Afiliado', hint: 'Promover produtos', icon: 'affiliates' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.mode}
                  type="button"
                  role="option"
                  aria-selected={panelMode === opt.mode}
                  onClick={() => switchMode(opt.mode)}
                  className="otter-sb-item !h-auto py-2.5"
                >
                  <Icon name={opt.icon} />
                  <span className="flex flex-col leading-tight">
                    <span>{opt.label}</span>
                    <span className="text-[11.5px] font-normal text-[#94A3B8]">{opt.hint}</span>
                  </span>
                  {panelMode === opt.mode && (
                    <svg className="w-4 h-4 ml-auto text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
                      {ICONS.check}
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Navegação com Pill Deslizante Fluido */}
        <nav className="otter-sb-scroll relative z-10 flex-1 min-h-0 overflow-y-auto px-3 pb-6">
          <div ref={listRef} className="relative">
            {/* Pill indicador suave */}
            <div ref={highlightRef} className="otter-sb-highlight" aria-hidden="true" data-ready="false" />

            {sections.map((section, si) => (
              <div key={section.title} className={si === 0 ? 'pt-2' : 'pt-5'}>
                {/* Cabeçalho da Secção: MENU / GERAL */}
                <p className="otter-sb-label px-3 pb-2">{section.title}</p>

                <div className="flex flex-col gap-0.5">
                  {section.entries.map((entry) => {
                    if (entry.kind === 'link') return renderLeaf(entry);

                    const open = isGroupOpen(entry);
                    const containsActive = activeGroup?.id === entry.id;
                    return (
                      <div key={entry.id}>
                        {/* Botão do grupo expansível */}
                        <button
                          type="button"
                          ref={setItemRef(`group:${entry.id}`)}
                          onClick={() => toggleGroup(entry)}
                          aria-expanded={open}
                          data-active={containsActive && !open ? 'true' : 'false'}
                          className="otter-sb-item"
                        >
                          <Icon name={entry.icon} />
                          <span className="truncate">{entry.name}</span>
                          <svg
                            className="otter-sb-chevron"
                            style={{ transform: open ? 'rotate(90deg)' : undefined }}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            {ICONS.chevronRight}
                          </svg>
                        </button>

                        {/* Accordion suave */}
                        <div className="otter-collapse" data-open={open ? 'true' : 'false'}>
                          <div>
                            <div className="flex flex-col gap-0.5 pt-1 pl-4" inert={!open}>
                              {entry.children.map((child) => renderLeaf(child, true))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Botão Sair na secção GERAL */}
                  {section.title === 'GERAL' && (
                    <form action={logoutAction}>
                      <button type="submit" className="otter-sb-item" title={`Terminar sessão (${userEmail})`}>
                        <Icon name="logout" />
                        <span>Sair</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}
