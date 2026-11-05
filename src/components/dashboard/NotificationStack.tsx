'use client';

import React, { useEffect, useRef } from 'react';
import { formatSaleNotificationMessage, SALE_NOTIFICATION_TITLE } from '@/lib/utils';

export interface NotifItem {
  id?: string;
  title: string;
  message: string;
  amount?: number;
  customerName?: string;
  method?: string;
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
        amount?: number;
        customerName?: string;
        method?: string;
        icon?: string;
        ts?: number;
      }) => void;
      clear: () => void;
      open: () => void;
      close: () => void;
    };
  }
}

const STORAGE_KEY = 'notif_stack_v1';
const CLEARED_AT_KEY = 'notif_stack_cleared_at_v1';
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 dias
const MAX_ITEMS = 100;
const CARD_H = 60; // altura aprox. de cada card
const GAP = 8;
const PEEK_VISIBLE = 3; // quantos cards aparecem na fileira (peek)

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function NotificationStack() {
  const widgetRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const emptyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const widget = widgetRef.current;
    const bell = bellRef.current;
    const badge = badgeRef.current;
    const stackEl = stackRef.current;
    const countEl = countRef.current;
    const emptyEl = emptyRef.current;

    if (!widget || !bell || !badge || !stackEl || !countEl || !emptyEl) return;

    let panelOpen = false; // sino clicado -> mostra a fileira (peek)
    let rowOpen = false;   // fileira clicada -> lista scrollável

    function save(list: NotifItem[]) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch {}
    }

    function load(): NotifItem[] {
      try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (!Array.isArray(raw)) return [];
        const now = Date.now();
        const fresh: NotifItem[] = raw
          .filter(
            (n: any) =>
              n &&
              typeof n.ts === 'number' &&
              now - n.ts < MAX_AGE_MS &&
              !String(n.id || '').startsWith('seed-')
          )
          .slice(0, MAX_ITEMS)
          .map((n: any) => ({
            ...n,
            title: SALE_NOTIFICATION_TITLE,
            message:
              n.amount !== undefined
                ? formatSaleNotificationMessage(n.amount)
                : n.message || formatSaleNotificationMessage(0),
            icon: n.icon || '/logo.png',
            ts: n.ts,
          }));
        if (fresh.length !== raw.length) save(fresh);
        return fresh;
      } catch {
        return [];
      }
    }

    let items: NotifItem[] = load();

    function timeAgo(ts: number): string {
      const s = Math.floor((Date.now() - ts) / 1000);
      if (s < 60) return 'agora';
      if (s < 3600) return Math.floor(s / 60) + 'min';
      if (s < 86400) return Math.floor(s / 3600) + 'h';
      return Math.floor(s / 86400) + 'd';
    }

    function buildCard(n: NotifItem): HTMLDivElement {
      const card = document.createElement('div');
      card.className = 'notif-card';
      const iconStr = n.icon || '/logo.png';
      const isImageIcon = iconStr.startsWith('/') || iconStr.startsWith('http');
      const iconHtml = isImageIcon
        ? `<img src="${escapeHtml(iconStr)}" alt="Otterfy" class="notif-icon-img" />`
        : escapeHtml(iconStr);

      card.innerHTML = `
        <div class="notif-icon">${iconHtml}</div>
        <div class="notif-body">
          <div class="notif-title"><span>${escapeHtml(n.title || SALE_NOTIFICATION_TITLE)}</span><span class="notif-time">${escapeHtml(timeAgo(n.ts))}</span></div>
          <div class="notif-msg">${escapeHtml(n.message || '')}</div>
        </div>`;
      return card;
    }

    function updateBadge() {
      if (!countEl || !badge || !emptyEl) return;
      countEl.textContent =
        items.length + (items.length === 1 ? ' notificação' : ' notificações');
      badge.style.display = items.length ? 'flex' : 'none';
      badge.textContent = items.length > 99 ? '99+' : String(items.length);
      emptyEl.style.display = items.length ? 'none' : 'block';
    }

    // peek = empilhados com profundidade | row-open = lista vertical scrollável
    function layout() {
      if (!stackEl) return;
      const cards = Array.from(stackEl.children) as HTMLElement[];
      stackEl.classList.toggle('row-open', rowOpen);

      if (rowOpen) {
        let y = 0;
        cards.forEach((card, i) => {
          card.style.transform = `translateY(${y}px) scale(1)`;
          card.style.opacity = '1';
          card.classList.remove('behind');
          card.style.zIndex = String(cards.length - i);
          y += CARD_H + GAP;
        });
        const top = stackEl.getBoundingClientRect().top;
        const available = window.innerHeight - top - 16;
        stackEl.style.height = Math.max(120, Math.min(y, available)) + 'px';
      } else {
        cards.forEach((card, i) => {
          card.style.zIndex = String(cards.length - i); // mais novo SEMPRE por cima
          card.classList.toggle('behind', i > 0);
          if (i < PEEK_VISIBLE) {
            card.style.transform = `translateY(${i * 10}px) scale(${1 - i * 0.045})`;
            card.style.opacity = String(1 - i * 0.28);
          } else {
            card.style.transform = `translateY(${PEEK_VISIBLE * 10}px) scale(${1 - PEEK_VISIBLE * 0.045})`;
            card.style.opacity = '0';
          }
        });
        stackEl.style.height =
          cards.length > 0 ? CARD_H + PEEK_VISIBLE * 10 + 'px' : '0px';
      }
    }

    function renderAll() {
      if (!stackEl) return;
      stackEl.innerHTML = '';
      items.forEach((n) => stackEl.appendChild(buildCard(n)));
      layout();
      requestAnimationFrame(() => {
        Array.from(stackEl.children).forEach((card, i) => {
          setTimeout(() => card.classList.add('in'), 10 + Math.min(i * 25, 200));
        });
      });
    }

    function openPanel() {
      if (!widget) return;
      panelOpen = true;
      rowOpen = false;
      widget.classList.add('panel-open');
      renderAll();
    }

    function closePanel() {
      if (!widget) return;
      panelOpen = false;
      rowOpen = false;
      widget.classList.remove('panel-open');
    }

    function openRow() {
      if (!panelOpen || rowOpen) return;
      rowOpen = true;
      layout();
    }

    const onBellClick = (e: MouseEvent) => {
      e.stopPropagation();
      panelOpen ? closePanel() : openPanel();
    };

    const onStackClick = (e: MouseEvent) => {
      e.stopPropagation();
      if (!rowOpen) openRow();
    };

    const onDocClick = (e: MouseEvent) => {
      if (panelOpen && widget && !widget.contains(e.target as Node)) {
        closePanel();
      }
    };

    const onResize = () => {
      if (rowOpen) layout();
    };

    bell.addEventListener('click', onBellClick);
    stackEl.addEventListener('click', onStackClick);
    document.addEventListener('click', onDocClick);
    window.addEventListener('resize', onResize);

    // Carregar vendas aprovadas reais
    async function loadApprovedSales() {
      try {
        const res = await fetch('/api/payments?status=APPROVED&limit=100', {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : [];
        const now = Date.now();
        const clearedAt = Number(localStorage.getItem(CLEARED_AT_KEY) || '0') || 0;

        const mapped: NotifItem[] = list
          .map((s: any) => ({
            id: s.id,
            title: SALE_NOTIFICATION_TITLE,
            message: formatSaleNotificationMessage(s.amount),
            amount: Number(s.amount) || 0,
            customerName: s.customerName || 'Cliente',
            method: s.transaction?.method || 'M-Pesa',
            icon: '/logo.png',
            ts: s.createdAt ? new Date(s.createdAt).getTime() : now,
          }))
          .filter((n: NotifItem) => now - n.ts < MAX_AGE_MS && n.ts > clearedAt);

        mapped.sort((a, b) => b.ts - a.ts);
        items = mapped.slice(0, MAX_ITEMS);
        save(items);
        updateBadge();
        if (panelOpen) renderAll();
      } catch {
        // Ignore temporary fetch glitches
      }
    }

    // ---- API pública ----
    window.NotifStack = {
      push(n) {
        if (n.id && items.some((it) => it.id === n.id)) return;
        const entry: NotifItem = {
          id: n.id,
          title: n.title || SALE_NOTIFICATION_TITLE,
          message: n.message || formatSaleNotificationMessage(n.amount),
          amount: n.amount,
          customerName: n.customerName,
          method: n.method,
          icon: n.icon || '/logo.png',
          ts: typeof n.ts === 'number' ? n.ts : Date.now(),
        };
        items.unshift(entry);
        if (items.length > MAX_ITEMS) items = items.slice(0, MAX_ITEMS);
        save(items);
        updateBadge();

        if (panelOpen && stackEl) {
          // insere no topo sem recriar a lista: preserva scroll e estado (peek ou row-open)
          const card = buildCard(entry);
          card.style.transform = 'translateY(-10px) scale(.97)';
          stackEl.insertBefore(card, stackEl.firstChild);
          layout();
          requestAnimationFrame(() =>
            setTimeout(() => card.classList.add('in'), 10)
          );
        }
      },
      clear() {
        items = [];
        save(items);
        try {
          localStorage.setItem(CLEARED_AT_KEY, String(Date.now()));
        } catch {}
        updateBadge();
        if (panelOpen) renderAll();
      },
      open() {
        openPanel();
      },
      close() {
        closePanel();
      },
    };

    updateBadge();
    void loadApprovedSales();
    window.addEventListener('orders_updated', loadApprovedSales);

    return () => {
      bell.removeEventListener('click', onBellClick);
      stackEl.removeEventListener('click', onStackClick);
      document.removeEventListener('click', onDocClick);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orders_updated', loadApprovedSales);
      delete window.NotifStack;
    };
  }, []);

  return (
    <>
      <style>{`
        .notif-widget {
          --glass: rgba(255, 255, 255, .14);
          --glass-border: rgba(255, 255, 255, .22);
          --radius: 24px;
          --radius-icon: 10px;
          --text: #f2f2f3;
          --sub: rgba(255, 255, 255, .6);
          --toolbar-sub: rgba(255, 255, 255, .6);
          --toolbar-hover: #f2f2f3;
          --accent: #3ddc84;
          position: relative;
          z-index: 999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", Segoe UI, Roboto, sans-serif;
        }

        [data-theme="light"] .notif-widget {
          --glass: rgba(15, 18, 28, .52);
          --glass-border: rgba(255, 255, 255, .26);
          --toolbar-sub: rgba(15, 23, 42, .65);
          --toolbar-hover: #0f172a;
        }

        .notif-bell {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--glass);
          border: 1px solid var(--glass-border);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          backdrop-filter: blur(28px) saturate(180%);
          color: var(--text);
          font-size: 19px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 6px 12px -6px rgba(0, 0, 0, .25), inset 0 1px 0 rgba(255, 255, 255, .28);
          flex-shrink: 0;
        }

        .notif-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          background: var(--accent);
          color: #08210f;
          border-radius: 9px;
          font-size: 10.5px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        .notif-panel {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 10px;
          margin-right: -12px;
          width: min(364px, 96vw);
          transform-origin: top right;
          transform: translateY(-8px) scale(.96);
          opacity: 0;
          pointer-events: none;
          transition: transform .28s cubic-bezier(.2, .8, .2, 1), opacity .22s ease;
        }

        .notif-widget.panel-open .notif-panel {
          transform: translateY(0) scale(1);
          opacity: 1;
          pointer-events: auto;
        }

        .notif-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding: 0 16px;
        }

        .notif-toolbar span {
          font-size: 12px;
          color: var(--toolbar-sub);
          font-weight: 600;
        }

        .notif-toolbar button {
          background: none;
          border: none;
          color: var(--toolbar-sub);
          font-size: 12px;
          cursor: pointer;
          font-weight: 600;
        }

        .notif-toolbar button:hover {
          color: var(--toolbar-hover);
        }

        .notif-stack {
          position: relative;
          transition: height .35s cubic-bezier(.2, .8, .3, 1);
          scrollbar-width: none;
        }

        .notif-stack.row-open {
          overflow-y: auto;
          overflow-x: hidden;
          cursor: default;
        }

        .notif-stack:not(.row-open) {
          cursor: pointer;
        }

        .notif-stack::-webkit-scrollbar {
          display: none;
        }

        .notif-card {
          position: absolute;
          left: 12px;
          right: 12px;
          top: 0;
          background: var(--glass);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius);
          padding: 13px 15px;
          display: flex;
          gap: 11px;
          box-shadow: 0 6px 12px -6px rgba(0, 0, 0, .25), inset 0 1px 0 rgba(255, 255, 255, .28);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          backdrop-filter: blur(28px) saturate(180%);
          color: var(--text);
          opacity: 0;
          transition: transform .38s cubic-bezier(.2, .8, .2, 1), opacity .3s ease;
        }

        .notif-card.in {
          opacity: 1;
        }

        .notif-card > * {
          transition: opacity .25s ease;
        }

        .notif-stack:not(.row-open) .notif-card.behind > * {
          opacity: 0;
        }

        .notif-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-icon);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent);
          font-size: 17px;
          overflow: hidden;
          padding: 4px;
        }

        .notif-icon-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .notif-body {
          min-width: 0;
          flex: 1;
        }

        .notif-title {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--text);
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .notif-time {
          font-size: 11px;
          color: var(--sub);
          font-weight: 400;
          flex-shrink: 0;
        }

        .notif-msg {
          font-size: 12.5px;
          color: rgba(255, 255, 255, .72);
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .notif-stack.row-open .notif-msg {
          white-space: normal;
        }

        .notif-empty {
          text-align: center;
          color: var(--toolbar-sub);
          font-size: 13px;
          padding: 16px 0;
          display: none;
        }
      `}</style>

      <div className="notif-widget otter-keep-colors" id="notifWidget" ref={widgetRef}>
        <button
          type="button"
          className="notif-bell"
          id="notifBell"
          ref={bellRef}
          aria-label="Notificações"
        >
          🔔
          <span
            className="notif-badge"
            id="notifBadge"
            ref={badgeRef}
            style={{ display: 'none' }}
          >
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
    </>
  );
}
