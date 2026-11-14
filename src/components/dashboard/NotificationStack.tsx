'use client';

import React, { useEffect, useRef } from 'react';
import { formatSaleNotificationMessage, SALE_NOTIFICATION_TITLE } from '@/lib/utils';

export interface NotifItem {
  id?: string;
  title: string;
  message: string;
  icon?: string;
  ts: number;
}

declare global {
  interface Window {
    NotifStack?: {
      push: (n: {
        id?: string;
        title?: string;
        message?: string;
        icon?: string;
        ts?: number;
      }) => void;
      clear: () => void;
    };
  }
}

const STORAGE_KEY = 'notif_stack_v1';
const CLEARED_AT_KEY = 'notif_stack_cleared_at_v1';
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 dias
const MAX_ITEMS = 100;
const CARD_H = 60;
const GAP = 8;
const PEEK_VISIBLE = 3;

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function load(): NotifItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    const now = Date.now();
    const fresh: NotifItem[] = raw
      .filter((n: NotifItem) => n && typeof n.ts === 'number' && now - n.ts < MAX_AGE_MS)
      .slice(0, MAX_ITEMS)
      .map((n: NotifItem & { amount?: number }) => ({
        id: n.id,
        title: SALE_NOTIFICATION_TITLE,
        message:
          n.message && n.message.includes('Pedido #')
            ? n.message
            : n.amount !== undefined
            ? formatSaleNotificationMessage(n.amount, n.id)
            : n.message || formatSaleNotificationMessage(0, n.id),
        icon: !n.icon || n.icon === '/logo.png' ? '✅' : n.icon,
        ts: n.ts,
      }));
    if (fresh.length !== raw.length) save(fresh);
    return fresh;
  } catch {
    return [];
  }
}

function save(list: NotifItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

function buildCard(n: NotifItem): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'notif-card';

  const iconEl = document.createElement('div');
  iconEl.className = 'notif-icon';
  iconEl.textContent = n.icon || '🔔';

  const bodyEl = document.createElement('div');
  bodyEl.className = 'notif-body';

  const titleRow = document.createElement('div');
  titleRow.className = 'notif-title';

  const titleSpan = document.createElement('span');
  titleSpan.textContent = n.title;

  const timeSpan = document.createElement('span');
  timeSpan.className = 'notif-time';
  timeSpan.textContent = timeAgo(n.ts);

  titleRow.appendChild(titleSpan);
  titleRow.appendChild(timeSpan);

  const msgEl = document.createElement('div');
  msgEl.className = 'notif-msg';
  msgEl.textContent = n.message || '';

  bodyEl.appendChild(titleRow);
  bodyEl.appendChild(msgEl);
  card.appendChild(iconEl);
  card.appendChild(bodyEl);

  return card;
}

export default function NotificationStack() {
  const widgetRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const emptyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const widgetEl = widgetRef.current;
    const bellEl = bellRef.current;
    const badgeEl = badgeRef.current;
    const stackEl = stackRef.current;
    const countEl = countRef.current;
    const emptyEl = emptyRef.current;
    if (!widgetEl || !bellEl || !badgeEl || !stackEl || !countEl || !emptyEl) return;

    const widget = widgetEl;
    const bell = bellEl;
    const badge = badgeEl;
    const stack = stackEl;
    const count = countEl;
    const empty = emptyEl;

    const io =
      'IntersectionObserver' in window
        ? new IntersectionObserver(
            (es) => es.forEach((en) => en.target.classList.toggle('off', !en.isIntersecting)),
            { root: stack, rootMargin: '300px 0px' }
          )
        : null;

    let dirty = true; // true = precisa reconstruir os cards
    let items: NotifItem[] = load();
    let panelOpen = false; // sino clicado -> mostra a fileira (peek)
    let rowOpen = false; // fileira clicada -> lista scrollável
    let cancelled = false;

    function updateBadge() {
      count.textContent = `${items.length}${items.length === 1 ? ' notificação' : ' notificações'}`;
      badge.style.display = items.length ? 'flex' : 'none';
      badge.textContent = items.length > 99 ? '99+' : String(items.length);
      empty.style.display = items.length ? 'none' : 'block';
    }

    // peek = empilhados com profundidade | row-open = lista vertical scrollável
    function layout() {
      const cards = Array.from(stack.children) as HTMLElement[];
      stack.classList.toggle('row-open', rowOpen);

      if (rowOpen) {
        let y = 0;
        cards.forEach((card, i) => {
          card.style.transform = `translateY(${y}px) scale(1)`;
          card.style.opacity = '1';
          card.classList.remove('behind', 'hide');
          card.classList.toggle('snap', i >= 12);
          card.style.zIndex = String(cards.length - i);
          y += CARD_H + GAP;
        });
        const top = stack.getBoundingClientRect().top;
        const available = window.innerHeight - top - 16;
        stack.style.height = `${Math.max(120, Math.min(y, available))}px`;
      } else {
        cards.forEach((card, i) => {
          card.style.zIndex = String(cards.length - i); // mais novo SEMPRE por cima
          card.classList.toggle('behind', i > 0);
          card.classList.toggle('hide', i >= PEEK_VISIBLE);
          card.classList.toggle('snap', i >= PEEK_VISIBLE + 2);
          if (i < PEEK_VISIBLE) {
            card.style.transform = `translateY(${i * 10}px) scale(${1 - i * 0.045})`;
            card.style.opacity = String(1 - i * 0.28);
          } else {
            card.style.transform = `translateY(${PEEK_VISIBLE * 10}px) scale(${1 - PEEK_VISIBLE * 0.045})`;
            card.style.opacity = '0';
          }
        });
        stack.style.height = items.length ? `${CARD_H + PEEK_VISIBLE * 10}px` : '0px';
      }
    }

    function renderAll() {
      io?.disconnect();
      stack.innerHTML = '';
      const frag = document.createDocumentFragment();
      items.forEach((n) => frag.appendChild(buildCard(n)));
      stack.appendChild(frag);
      layout();
      requestAnimationFrame(() => {
        Array.from(stack.children).forEach((card) => {
          card.classList.add('in');
          io?.observe(card);
        });
      });
      dirty = false;
    }

    function openPanel() {
      panelOpen = true;
      rowOpen = false;
      widget.classList.add('panel-open');
      if (dirty || stack.children.length !== items.length) {
        renderAll();
      } else {
        stack.scrollTop = 0;
        Array.from(stack.children).forEach((c, i) => {
          const t = c.querySelector('.notif-time');
          if (t && items[i]) t.textContent = timeAgo(items[i].ts);
        });
        layout();
      }
    }

    function closePanel() {
      panelOpen = false;
      rowOpen = false;
      widget.classList.remove('panel-open');
    }

    function closeRow() {
      if (!rowOpen) return;
      stack.scrollTop = 0;
      rowOpen = false;
      layout();
    }

    function openRow() {
      if (!panelOpen || rowOpen || items.length === 0) return;
      rowOpen = true;
      layout();
    }

    const onBellClick = (e: MouseEvent) => {
      e.stopPropagation();
      if (panelOpen) closePanel();
      else openPanel();
    };

    const onStackClick = (e: MouseEvent) => {
      e.stopPropagation();
      if (!rowOpen) {
        openRow();
        return;
      }
      // lista aberta: só a PRIMEIRA notificação recolhe de volta pra fileira
      const first = stack.firstElementChild;
      if (first && first.contains(e.target as Node)) closeRow();
    };

    // clicar fora NÃO fecha nada. Só o sino fecha a exibição.
    const onResize = () => {
      if (rowOpen) layout();
    };

    bell.addEventListener('click', onBellClick);
    stack.addEventListener('click', onStackClick);
    window.addEventListener('resize', onResize);

    // ---- API pública ----
    window.NotifStack = {
      push(n) {
        if (n.id && items.some((it) => it.id === n.id)) return;
        const entry: NotifItem = {
          id: n.id,
          title: n.title || 'Venda Aprovada',
          message: n.message || '',
          icon: n.icon || '🔔',
          ts: typeof n.ts === 'number' ? n.ts : Date.now(),
        };
        items.unshift(entry);
        if (items.length > MAX_ITEMS) items = items.slice(0, MAX_ITEMS);
        save(items);
        updateBadge();
        if (!panelOpen) dirty = true;

        if (panelOpen) {
          // insere no topo sem recriar a lista: preserva scroll e estado (peek ou row-open)
          const card = buildCard(entry);
          card.style.transition = 'none';
          card.style.opacity = '0';
          card.style.transform = rowOpen ? 'translateY(-24px) scale(.96)' : 'translateY(-70px) scale(1.05)';
          stack.insertBefore(card, stack.firstChild);
          void card.offsetHeight; // força o estado inicial antes de animar
          card.style.transition = 'transform .55s cubic-bezier(.34,1.45,.5,1), opacity .3s ease';
          layout(); // as outras recuam/descem, a nova assenta no topo
          card.classList.add('in');
          io?.observe(card);
          while (stack.children.length > items.length && stack.lastElementChild) {
            stack.lastElementChild.remove();
          }
          setTimeout(() => {
            card.style.transition = '';
          }, 700);
        }
      },
      clear() {
        items = [];
        save(items);
        try {
          localStorage.setItem(CLEARED_AT_KEY, String(Date.now()));
        } catch {}
        updateBadge();
        dirty = true;
        if (panelOpen) renderAll();
      },
    };

    // Hidratação inicial única para sincronizar vendas aprovadas recentes sem duplicar nem quebrar animações ao vivo
    (async () => {
      try {
        const res = await fetch('/api/payments?status=APPROVED&limit=100', {
          signal: AbortSignal.timeout(6000),
          cache: 'no-store',
        });
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (cancelled) return;
        const list = Array.isArray(json.data) ? json.data : [];
        const now = Date.now();
        const clearedAt = Number(localStorage.getItem(CLEARED_AT_KEY) || '0') || 0;
        const existingIds = new Set(items.map((it) => it.id).filter(Boolean));

        const backfilled: NotifItem[] = list
          .map((s: { id: string; amount: number; createdAt?: string }) => ({
            id: s.id,
            title: SALE_NOTIFICATION_TITLE,
            message: formatSaleNotificationMessage(s.amount, s.id),
            icon: '✅',
            ts: s.createdAt ? new Date(s.createdAt).getTime() : now,
          }))
          .filter((n: NotifItem) => now - n.ts < MAX_AGE_MS && n.ts > clearedAt && !existingIds.has(n.id));

        if (backfilled.length > 0 && !cancelled) {
          items = [...items, ...backfilled]
            .sort((a, b) => b.ts - a.ts)
            .slice(0, MAX_ITEMS);
          save(items);
          updateBadge();
          dirty = true;
          if (panelOpen) renderAll();
        }
      } catch {}
    })();

    updateBadge();

    return () => {
      cancelled = true;
      io?.disconnect();
      bell.removeEventListener('click', onBellClick);
      stack.removeEventListener('click', onStackClick);
      window.removeEventListener('resize', onResize);
      delete window.NotifStack;
    };
  }, []);

  return (
    <div className="notif-widget" id="notifWidget" ref={widgetRef}>
      <button className="notif-bell" id="notifBell" ref={bellRef} type="button" aria-label="Notificações">
        🔔
        <span className="notif-badge" id="notifBadge" ref={badgeRef} style={{ display: 'none' }}>
          0
        </span>
      </button>
      <div className="notif-panel" id="notifPanel">
        <div className="notif-toolbar">
          <span id="notifCount" ref={countRef}>
            0 notificações
          </span>
          <button type="button" onClick={() => window.NotifStack?.clear()}>
            Limpar tudo
          </button>
        </div>
        <div className="notif-stack" id="notifStack" ref={stackRef} />
        <div className="notif-empty" id="notifEmpty" ref={emptyRef}>
          Sem notificações
        </div>
      </div>
    </div>
  );
}
