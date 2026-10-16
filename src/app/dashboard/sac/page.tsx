'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { formatMZN } from '@/lib/utils';

type TicketStatus = 'ABERTO' | 'EM_ATENDIMENTO' | 'RESOLVIDO';
type TicketCategory = 'ACESSO_PRODUTO' | 'REEMBOLSO' | 'PAGAMENTO_DUPLICADO' | 'DUVIDA_GERAL';
type SacTab = 'tickets' | 'macros' | 'portal';

interface TicketMessage {
  id: string;
  sender: 'buyer' | 'seller';
  senderName: string;
  text: string;
  createdAt: string;
}

interface SacTicket {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  productId?: string;
  productName: string;
  amount: number;
  paymentMethod: string;
  category: TicketCategory;
  status: TicketStatus;
  subject: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

interface QuickMacro {
  id: string;
  title: string;
  category: TicketCategory;
  content: string;
}

const DEFAULT_MACROS: QuickMacro[] = [
  {
    id: 'mac_acesso',
    title: 'Reenvio de Link de Acesso Digital',
    category: 'ACESSO_PRODUTO',
    content:
      'Olá {cliente}! Confirmámos o seu pagamento referente ao produto "{produto}". Pode aceder imediatamente ao seu material digital através do link oficial: {link_acesso}. Qualquer dúvida estamos à disposição!',
  },
  {
    id: 'mac_reembolso',
    title: 'Confirmação de Reembolso (Lei n.º 22/2009)',
    category: 'REEMBOLSO',
    content:
      'Olá {cliente}, recebemos a sua solicitação de reembolso dentro do prazo legal de 7 dias úteis. O estorno no valor de {valor} já foi encaminhado para a sua carteira móvel ({metodo}) e ficará disponível em até 5 dias úteis.',
  },
  {
    id: 'mac_pendente',
    title: 'Orientação sobre Pagamento M-Pesa / e-Mola',
    category: 'DUVIDA_GERAL',
    content:
      'Olá {cliente}! Verificámos que o pedido #{pedido} aguarda confirmação do PIN na sua carteira móvel. Caso a notificação USSD tenha expirado no telemóvel, pode gerar um novo pedido sem custos adicionais.',
  },
  {
    id: 'mac_duplicado',
    title: 'Verificação de Cobrança Duplicada',
    category: 'PAGAMENTO_DUPLICADO',
    content:
      'Olá {cliente}, analisámos o histórico da sua conta e identificámos a transação duplicada. O valor excedente de {valor} será devolvido integralmente para o seu número {telefone}.',
  },
];

const CATEGORY_LABELS: Record<TicketCategory, { label: string; color: string }> = {
  ACESSO_PRODUTO: { label: 'Não recebi / Acesso', color: 'text-sky-400 bg-sky-500/10 border-sky-500/25' },
  REEMBOLSO: { label: 'Pedido de Reembolso', color: 'text-rose-400 bg-rose-500/10 border-rose-500/25' },
  PAGAMENTO_DUPLICADO: { label: 'Cobrança Duplicada', color: 'text-amber-400 bg-amber-500/10 border-amber-500/25' },
  DUVIDA_GERAL: { label: 'Dúvida sobre Produto', color: 'text-violet-400 bg-violet-500/10 border-violet-500/25' },
};

const STATUS_LABELS: Record<TicketStatus, { label: string; badge: string }> = {
  ABERTO: { label: 'Aberto', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  EM_ATENDIMENTO: { label: 'Em Atendimento', badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  RESOLVIDO: { label: 'Resolvido', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
};

const STORAGE_KEY_TICKETS = 'otterfy_sac_tickets_v1';
const STORAGE_KEY_MACROS = 'otterfy_sac_macros_v1';
const STORAGE_KEY_PORTAL = 'otterfy_sac_portal_v1';

export default function SacPage() {
  const [activeTab, setActiveTab] = useState<SacTab>('tickets');
  const [tickets, setTickets] = useState<SacTicket[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [macros, setMacros] = useState<QuickMacro[]>(DEFAULT_MACROS);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | TicketCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Modal Novo Chamado Manual
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [newTicketOrderId, setNewTicketOrderId] = useState('');
  const [newTicketCustomerName, setNewTicketCustomerName] = useState('');
  const [newTicketCustomerPhone, setNewTicketCustomerPhone] = useState('');
  const [newTicketProductName, setNewTicketProductName] = useState('');
  const [newTicketAmount, setNewTicketAmount] = useState('500');
  const [newTicketCategory, setNewTicketCategory] = useState<TicketCategory>('ACESSO_PRODUTO');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');

  // Modal Nova Macro
  const [newMacroTitle, setNewMacroTitle] = useState('');
  const [newMacroCategory, setNewMacroCategory] = useState<TicketCategory>('ACESSO_PRODUTO');
  const [newMacroContent, setNewMacroContent] = useState('');

  // Portal Config
  const [portalConfig, setPortalConfig] = useState({
    supportEmail: 'suporte@otterfy.co.mz',
    supportWhatsapp: '+258 84 000 0000',
    slaHours: '24',
    autoResendAccess: true,
    allowDirectRefundRequest: true,
    welcomeMessage: 'Resolva a sua compra, recupere o seu acesso imediato ou solicite suporte direto ao produtor.',
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    try {
      const savedTickets = localStorage.getItem(STORAGE_KEY_TICKETS);
      if (savedTickets) {
        const parsed = JSON.parse(savedTickets);
        if (Array.isArray(parsed)) setTickets(parsed);
      }
      const savedMacros = localStorage.getItem(STORAGE_KEY_MACROS);
      if (savedMacros) {
        const parsedM = JSON.parse(savedMacros);
        if (Array.isArray(parsedM) && parsedM.length > 0) setMacros(parsedM);
      }
      const savedPortal = localStorage.getItem(STORAGE_KEY_PORTAL);
      if (savedPortal) {
        setPortalConfig((prev) => ({ ...prev, ...JSON.parse(savedPortal) }));
      }
    } catch {}

    fetch('/api/payments')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.data)) setOrders(d.data);
      })
      .catch(() => {});
  }, []);

  const saveTickets = (next: SacTicket[]) => {
    setTickets(next);
    try {
      localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(next));
    } catch {}
  };

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) || null,
    [tickets, selectedTicketId]
  );

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchCat = categoryFilter === 'ALL' || t.category === categoryFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        t.customerName.toLowerCase().includes(q) ||
        t.customerPhone.toLowerCase().includes(q) ||
        t.orderId.toLowerCase().includes(q) ||
        t.productName.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q);
      return matchStatus && matchCat && matchSearch;
    });
  }, [tickets, statusFilter, categoryFilter, searchQuery]);

  const openCount = tickets.filter((t) => t.status === 'ABERTO').length;
  const inProgressCount = tickets.filter((t) => t.status === 'EM_ATENDIMENTO').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVIDO').length;

  const handleSelectOrderForTicket = (ordId: string) => {
    setNewTicketOrderId(ordId);
    const found = orders.find((o) => o.id === ordId);
    if (found) {
      setNewTicketCustomerName(found.customerName || 'Cliente');
      setNewTicketCustomerPhone(found.customerPhone || '');
      setNewTicketProductName(found.product?.name || 'Produto Digital');
      setNewTicketAmount(String(found.amount || 0));
    }
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketCustomerName.trim() || !newTicketSubject.trim()) return;

    const nowIso = new Date().toISOString();
    const ticket: SacTicket = {
      id: `SAC-${Date.now().toString(36).toUpperCase()}`,
      orderId: newTicketOrderId || `OTF-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: newTicketCustomerName.trim(),
      customerPhone: newTicketCustomerPhone.trim() || '+258 84 000 0000',
      productName: newTicketProductName.trim() || 'Produto Digital',
      amount: Number(newTicketAmount) || 0,
      paymentMethod: 'M-Pesa',
      category: newTicketCategory,
      status: 'ABERTO',
      subject: newTicketSubject.trim(),
      createdAt: nowIso,
      updatedAt: nowIso,
      messages: [
        {
          id: `msg_${Date.now()}`,
          sender: 'buyer',
          senderName: newTicketCustomerName.trim(),
          text: newTicketMessage.trim() || newTicketSubject.trim(),
          createdAt: nowIso,
        },
      ],
    };

    const next = [ticket, ...tickets];
    saveTickets(next);
    setSelectedTicketId(ticket.id);
    setNewTicketModalOpen(false);
    setNewTicketOrderId('');
    setNewTicketCustomerName('');
    setNewTicketCustomerPhone('');
    setNewTicketProductName('');
    setNewTicketSubject('');
    setNewTicketMessage('');
    showToast(`Chamado ${ticket.id} registado com sucesso!`);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    const nowIso = new Date().toISOString();
    const newMsg: TicketMessage = {
      id: `msg_${Date.now()}`,
      sender: 'seller',
      senderName: 'Suporte do Produtor',
      text: replyText.trim(),
      createdAt: nowIso,
    };

    const updated = tickets.map((t) =>
      t.id === selectedTicket.id
        ? {
            ...t,
            status: t.status === 'ABERTO' ? ('EM_ATENDIMENTO' as TicketStatus) : t.status,
            updatedAt: nowIso,
            messages: [...t.messages, newMsg],
          }
        : t
    );

    saveTickets(updated);
    setReplyText('');
    showToast('Resposta enviada e registada no histórico do chamado!');
  };

  const handleStatusChange = (ticketId: string, newStatus: TicketStatus) => {
    const updated = tickets.map((t) =>
      t.id === ticketId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
    );
    saveTickets(updated);
    showToast(`Status do chamado atualizado para ${STATUS_LABELS[newStatus].label}.`);
  };

  const applyMacro = (macro: QuickMacro) => {
    if (!selectedTicket) return;
    const accessUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/access/${selectedTicket.orderId}`
        : `/access/${selectedTicket.orderId}`;
    const filled = macro.content
      .replace(/\{cliente\}/g, selectedTicket.customerName)
      .replace(/\{produto\}/g, selectedTicket.productName)
      .replace(/\{pedido\}/g, selectedTicket.orderId)
      .replace(/\{valor\}/g, formatMZN(selectedTicket.amount))
      .replace(/\{metodo\}/g, selectedTicket.paymentMethod)
      .replace(/\{telefone\}/g, selectedTicket.customerPhone)
      .replace(/\{link_acesso\}/g, accessUrl);

    setReplyText(filled);
  };

  const openBuyerWhatsApp = (ticket: SacTicket) => {
    const cleanPhone = ticket.customerPhone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('258') ? cleanPhone : `258${cleanPhone}`;
    const text = encodeURIComponent(
      `Olá ${ticket.customerName}, falamos do suporte referente ao seu chamado ${ticket.id} (Pedido #${ticket.orderId} - ${ticket.productName}). Como podemos ajudar?`
    );
    window.open(`https://api.whatsapp.com/send?phone=${fullPhone}&text=${text}`, '_blank');
  };

  const handleAddMacro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMacroTitle.trim() || !newMacroContent.trim()) return;
    const macro: QuickMacro = {
      id: `mac_${Date.now()}`,
      title: newMacroTitle.trim(),
      category: newMacroCategory,
      content: newMacroContent.trim(),
    };
    const next = [macro, ...macros];
    setMacros(next);
    localStorage.setItem(STORAGE_KEY_MACROS, JSON.stringify(next));
    setNewMacroTitle('');
    setNewMacroContent('');
    showToast('Resposta rápida guardada com sucesso!');
  };

  const handleDeleteMacro = (id: string) => {
    const next = macros.filter((m) => m.id !== id);
    setMacros(next);
    localStorage.setItem(STORAGE_KEY_MACROS, JSON.stringify(next));
    showToast('Resposta rápida removida.');
  };

  const handleSavePortal = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY_PORTAL, JSON.stringify(portalConfig));
    showToast('Configurações da Central de Ajuda do Comprador salvas!');
  };

  return (
    <div className="w-full max-w-[2000px] 2xl:max-w-full mx-auto space-y-6 pb-16 animate-fadeIn">
      {toast && (
        <div
          role="status"
          className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-[#121016] border border-violet-500/50 shadow-2xl text-violet-200 text-sm flex items-center gap-3 animate-fadeIn"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
          <span>{toast}</span>
          <button onClick={() => setToast(null)} aria-label="Fechar notificação" className="ml-2 text-[#94A3B8] hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-600/15 border border-violet-500/25 flex items-center justify-center text-violet-400 shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85}>
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight">
              SAC — Central de Atendimento & Pós-Venda
            </h1>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Gerencie chamados de compradores, reenvie acessos digitais, responda solicitações de reembolso e configure respostas automáticas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/dashboard/refunds"
            className="px-4 py-2.5 rounded-xl bg-[#121016] hover:bg-[#1A1820] border border-[#1E1B26] text-xs font-semibold text-[#F8FAFC] transition-colors"
          >
            Ver Reembolsos
          </Link>
          <button
            type="button"
            onClick={() => setNewTicketModalOpen(true)}
            className="laser-button px-4 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer"
          >
            + Abrir Chamado
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121016] border border-[#1E1B26] p-5 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block">
            Chamados em Aberto
          </span>
          <p className="text-2xl font-black text-amber-400 mt-2 font-mono">{openCount}</p>
          <span className="text-[11px] text-[#94A3B8] mt-1 block">Aguardando primeira resposta</span>
        </div>

        <div className="bg-[#121016] border border-[#1E1B26] p-5 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block">
            Em Atendimento
          </span>
          <p className="text-2xl font-black text-sky-400 mt-2 font-mono">{inProgressCount}</p>
          <span className="text-[11px] text-[#94A3B8] mt-1 block">Em acompanhamento com o cliente</span>
        </div>

        <div className="bg-[#121016] border border-[#1E1B26] p-5 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block">
            Chamados Resolvidos
          </span>
          <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">{resolvedCount}</p>
          <span className="text-[11px] text-[#94A3B8] mt-1 block">Concluídos com sucesso</span>
        </div>

        <div className="bg-[#121016] border border-[#1E1B26] p-5 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block">
            SLA de Atendimento
          </span>
          <p className="text-2xl font-black text-violet-400 mt-2 font-mono">&lt; {portalConfig.slaHours}h</p>
          <span className="text-[11px] text-[#94A3B8] mt-1 block">Meta configurada no portal</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1E1B26] pb-3 overflow-x-auto">
        {[
          { id: 'tickets', label: `Chamados de Compradores (${tickets.length})` },
          { id: 'macros', label: `Respostas Rápidas & Macros (${macros.length})` },
          { id: 'portal', label: 'Configurações da Central de Ajuda' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as SacTab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-violet-600/15 border border-violet-500/30 text-violet-300'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#121016]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: TICKETS */}
      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Ticket List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#121016] border border-[#1E1B26] p-4 rounded-2xl space-y-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por cliente, telefone, ID do pedido..."
                className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3.5 py-2 text-xs text-[#F8FAFC] focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  aria-label="Filtrar por status"
                  className="bg-[#0F0E14] border border-[#1E1B26] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none"
                >
                  <option value="ALL">Todos os Status</option>
                  <option value="ABERTO">Aberto</option>
                  <option value="EM_ATENDIMENTO">Em Atendimento</option>
                  <option value="RESOLVIDO">Resolvido</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                  aria-label="Filtrar por motivo"
                  className="bg-[#0F0E14] border border-[#1E1B26] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none"
                >
                  <option value="ALL">Todos os Motivos</option>
                  <option value="ACESSO_PRODUTO">Não recebi / Acesso</option>
                  <option value="REEMBOLSO">Pedido de Reembolso</option>
                  <option value="PAGAMENTO_DUPLICADO">Cobrança Duplicada</option>
                  <option value="DUVIDA_GERAL">Dúvida Geral</option>
                </select>
              </div>
            </div>

            <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl overflow-hidden divide-y divide-[#1E1B26]">
              {filteredTickets.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 mx-auto flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <p className="text-sm font-bold text-[#F8FAFC]">Nenhum chamado encontrado</p>
                  <p className="text-xs text-[#94A3B8] max-w-xs mx-auto">
                    Não existem solicitações pendentes com os filtros selecionados. Pode registar um chamado manualmente clicando em &ldquo;+ Abrir Chamado&rdquo;.
                  </p>
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const active = t.id === selectedTicketId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`w-full text-left p-4 transition-colors cursor-pointer block ${
                        active ? 'bg-violet-600/10 border-l-4 border-l-violet-500' : 'hover:bg-[#1A1820]/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-mono text-[11px] font-bold text-violet-400">{t.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_LABELS[t.status].badge}`}>
                          {STATUS_LABELS[t.status].label}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#F8FAFC] truncate">{t.subject}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5 truncate">
                        {t.customerName} • {t.productName} ({formatMZN(t.amount)})
                      </p>
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#1E1B26]/60 text-[10px] text-[#94A3B8]">
                        <span className={`px-2 py-0.5 rounded border font-semibold ${CATEGORY_LABELS[t.category].color}`}>
                          {CATEGORY_LABELS[t.category].label}
                        </span>
                        <span>
                          {new Date(t.updatedAt).toLocaleDateString('pt-MZ', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Ticket Detail & Conversation */}
          <div className="lg:col-span-7">
            {!selectedTicket ? (
              <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl p-12 text-center h-full flex flex-col items-center justify-center min-h-[420px]">
                <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-[#F8FAFC]">Selecione um chamado para atender</h3>
                <p className="text-xs text-[#94A3B8] max-w-md mt-1">
                  Visualize os dados completos do comprador, histórico do pedido, envie links de acesso com 1 clique ou responda diretamente via WhatsApp.
                </p>
              </div>
            ) : (
              <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl overflow-hidden flex flex-col">
                {/* Ticket Top Header */}
                <div className="p-5 border-b border-[#1E1B26] bg-[#0F0E14] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-violet-400">{selectedTicket.id}</span>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${CATEGORY_LABELS[selectedTicket.category].color}`}>
                        {CATEGORY_LABELS[selectedTicket.category].label}
                      </span>
                      <span className="text-xs text-[#94A3B8]">• Pedido #{selectedTicket.orderId}</span>
                    </div>
                    <h2 className="text-lg font-bold text-[#F8FAFC] mt-1">{selectedTicket.subject}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as TicketStatus)}
                      aria-label="Alterar status do chamado"
                      className="bg-[#121016] border border-[#1E1B26] rounded-xl px-3 py-1.5 text-xs font-bold text-[#F8FAFC] focus:outline-none"
                    >
                      <option value="ABERTO">Status: Aberto</option>
                      <option value="EM_ATENDIMENTO">Status: Em Atendimento</option>
                      <option value="RESOLVIDO">Status: Resolvido</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => openBuyerWhatsApp(selectedTicket)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-colors"
                    >
                      WhatsApp →
                    </button>
                  </div>
                </div>

                {/* Buyer & Order Info Bar */}
                <div className="p-4 bg-[#121016] border-b border-[#1E1B26] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-[#94A3B8] block">Comprador</span>
                    <strong className="text-[#F8FAFC]">{selectedTicket.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#94A3B8] block">Telefone</span>
                    <strong className="text-[#F8FAFC] font-mono">{selectedTicket.customerPhone}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#94A3B8] block">Produto</span>
                    <strong className="text-[#F8FAFC] truncate block">{selectedTicket.productName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#94A3B8] block">Valor Pago</span>
                    <strong className="text-emerald-400 font-mono">{formatMZN(selectedTicket.amount)}</strong>
                  </div>
                </div>

                {/* Conversation Thread */}
                <div className="p-5 space-y-4 max-h-[340px] overflow-y-auto bg-[#08070C]/50">
                  {selectedTicket.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-[85%] rounded-2xl p-4 ${
                        m.sender === 'seller'
                          ? 'ml-auto bg-violet-600/15 border border-violet-500/30 text-[#F8FAFC]'
                          : 'mr-auto bg-[#121016] border border-[#1E1B26] text-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1 text-[10px] text-[#94A3B8]">
                        <span className="font-bold text-violet-300">{m.senderName}</span>
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    </div>
                  ))}
                </div>

                {/* Quick Macros Bar */}
                <div className="px-5 pt-3 pb-2 border-t border-[#1E1B26] bg-[#0F0E14]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-2">
                    Inserir Resposta Rápida (1-Clique):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {macros.map((mac) => (
                      <button
                        key={mac.id}
                        type="button"
                        onClick={() => applyMacro(mac)}
                        className="px-2.5 py-1 rounded-lg bg-[#121016] hover:bg-violet-600/20 border border-[#1E1B26] hover:border-violet-500/40 text-[11px] text-[#F8FAFC] transition-colors cursor-pointer"
                      >
                        ⚡ {mac.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="p-5 pt-2 bg-[#0F0E14] space-y-3">
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escreva a sua resposta ao comprador..."
                    className="w-full bg-[#121016] border border-[#1E1B26] focus:border-violet-500 rounded-xl p-3 text-xs text-[#F8FAFC] focus:outline-none resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedTicket.id, 'RESOLVIDO')}
                      className="px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 cursor-pointer"
                    >
                      ✓ Marcar como Resolvido
                    </button>
                    <button
                      type="submit"
                      className="laser-button px-5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
                    >
                      Enviar Resposta
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MACROS */}
      {activeTab === 'macros' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <form onSubmit={handleAddMacro} className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-bold text-[#F8FAFC]">Criar Nova Resposta Rápida</h2>
              <p className="text-xs text-[#94A3B8]">
                Variáveis disponíveis: <code className="text-violet-300">{'{cliente}'}</code>,{' '}
                <code className="text-violet-300">{'{produto}'}</code>,{' '}
                <code className="text-violet-300">{'{pedido}'}</code>,{' '}
                <code className="text-violet-300">{'{valor}'}</code>,{' '}
                <code className="text-violet-300">{'{link_acesso}'}</code>
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">Título do Modelo</label>
                <input
                  type="text"
                  required
                  value={newMacroTitle}
                  onChange={(e) => setNewMacroTitle(e.target.value)}
                  placeholder="Ex: Instruções de Download do E-book"
                  className="w-full bg-[#0F0E14] border border-[#1E1B26] rounded-xl px-3.5 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">Categoria</label>
                <select
                  value={newMacroCategory}
                  onChange={(e) => setNewMacroCategory(e.target.value as TicketCategory)}
                  className="w-full bg-[#0F0E14] border border-[#1E1B26] rounded-xl px-3.5 py-2 text-xs text-[#F8FAFC] focus:outline-none"
                >
                  <option value="ACESSO_PRODUTO">Não recebi / Acesso</option>
                  <option value="REEMBOLSO">Pedido de Reembolso</option>
                  <option value="PAGAMENTO_DUPLICADO">Cobrança Duplicada</option>
                  <option value="DUVIDA_GERAL">Dúvida Geral</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">Mensagem Padrão</label>
                <textarea
                  rows={4}
                  required
                  value={newMacroContent}
                  onChange={(e) => setNewMacroContent(e.target.value)}
                  placeholder="Olá {cliente}, aqui está o seu link de acesso: {link_acesso}"
                  className="w-full bg-[#0F0E14] border border-[#1E1B26] rounded-xl p-3 text-xs text-[#F8FAFC] focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <button type="submit" className="laser-button w-full py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer">
                Salvar Resposta Rápida
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {macros.map((m) => (
              <div key={m.id} className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#F8FAFC]">{m.title}</h3>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${CATEGORY_LABELS[m.category].color}`}>
                      {CATEGORY_LABELS[m.category].label}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteMacro(m.id)}
                    className="text-xs text-rose-400 hover:underline cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed bg-[#0F0E14] p-3 rounded-xl border border-[#1E1B26]">
                  {m.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PORTAL CONFIG */}
      {activeTab === 'portal' && (
        <form onSubmit={handleSavePortal} className="bg-[#121016] border border-[#1E1B26] rounded-3xl p-6 sm:p-8 max-w-3xl space-y-5">
          <div>
            <h2 className="text-lg font-bold text-[#F8FAFC]">Central de Autoatendimento do Comprador</h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Defina os canais oficiais que aparecem nos recibos, páginas de entrega e política de reembolso
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">E-mail de Suporte ao Comprador</label>
              <input
                type="email"
                value={portalConfig.supportEmail}
                onChange={(e) => setPortalConfig({ ...portalConfig, supportEmail: e.target.value })}
                className="w-full bg-[#0F0E14] border border-[#1E1B26] rounded-xl px-3.5 py-2.5 text-xs text-[#F8FAFC]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">WhatsApp de Atendimento</label>
              <input
                type="tel"
                value={portalConfig.supportWhatsapp}
                onChange={(e) => setPortalConfig({ ...portalConfig, supportWhatsapp: e.target.value })}
                className="w-full bg-[#0F0E14] border border-[#1E1B26] rounded-xl px-3.5 py-2.5 text-xs text-[#F8FAFC]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">Mensagem de Boas-vindas no Suporte</label>
            <textarea
              rows={2}
              value={portalConfig.welcomeMessage}
              onChange={(e) => setPortalConfig({ ...portalConfig, welcomeMessage: e.target.value })}
              className="w-full bg-[#0F0E14] border border-[#1E1B26] rounded-xl p-3 text-xs text-[#F8FAFC]"
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 text-xs text-[#F8FAFC] cursor-pointer">
              <input
                type="checkbox"
                checked={portalConfig.autoResendAccess}
                onChange={(e) => setPortalConfig({ ...portalConfig, autoResendAccess: e.target.checked })}
                className="rounded border-[#1E1B26] text-violet-600"
              />
              <span>Permitir que o comprador recupere o link de acesso automaticamente informando o telefone da compra</span>
            </label>
            <label className="flex items-center gap-3 text-xs text-[#F8FAFC] cursor-pointer">
              <input
                type="checkbox"
                checked={portalConfig.allowDirectRefundRequest}
                onChange={(e) => setPortalConfig({ ...portalConfig, allowDirectRefundRequest: e.target.checked })}
                className="rounded border-[#1E1B26] text-violet-600"
              />
              <span>Habilitar botão de solicitação de reembolso em 1 clique dentro do prazo legal de 7 dias</span>
            </label>
          </div>

          <button type="submit" className="laser-button px-6 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer">
            Salvar Configurações do SAC
          </button>
        </form>
      )}

      {/* MODAL: NOVO CHAMADO */}
      {newTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl w-full max-w-lg p-6 space-y-4 text-[#F8FAFC] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1B26]">
              <h3 className="text-base font-bold">Registar Chamado de Suporte</h3>
              <button
                type="button"
                onClick={() => setNewTicketModalOpen(false)}
                aria-label="Fechar janela"
                className="w-8 h-8 rounded-full bg-[#1A1820] text-[#94A3B8] hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              {orders.length > 0 && (
                <div>
                  <label className="block font-semibold mb-1 text-[#94A3B8]">Vincular a um Pedido Existente (Opcional)</label>
                  <select
                    value={newTicketOrderId}
                    onChange={(e) => handleSelectOrderForTicket(e.target.value)}
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] rounded-xl px-3 py-2 text-[#F8FAFC]"
                  >
                    <option value="">-- Preencher manualmente --</option>
                    {orders.slice(0, 30).map((o) => (
                      <option key={o.id} value={o.id}>
                        #{o.id.slice(-6).toUpperCase()} — {o.customerName} ({formatMZN(o.amount)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Nome do Comprador *</label>
                  <input
                    type="text"
                    required
                    value={newTicketCustomerName}
                    onChange={(e) => setNewTicketCustomerName(e.target.value)}
                    placeholder="Nome do cliente"
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] rounded-xl px-3 py-2 text-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={newTicketCustomerPhone}
                    onChange={(e) => setNewTicketCustomerPhone(e.target.value)}
                    placeholder="+258 84 000 0000"
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] rounded-xl px-3 py-2 text-[#F8FAFC]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Produto</label>
                  <input
                    type="text"
                    value={newTicketProductName}
                    onChange={(e) => setNewTicketProductName(e.target.value)}
                    placeholder="Nome do produto"
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] rounded-xl px-3 py-2 text-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Motivo do Chamado</label>
                  <select
                    value={newTicketCategory}
                    onChange={(e) => setNewTicketCategory(e.target.value as TicketCategory)}
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] rounded-xl px-3 py-2 text-[#F8FAFC]"
                  >
                    <option value="ACESSO_PRODUTO">Não recebi / Acesso</option>
                    <option value="REEMBOLSO">Pedido de Reembolso</option>
                    <option value="PAGAMENTO_DUPLICADO">Cobrança Duplicada</option>
                    <option value="DUVIDA_GERAL">Dúvida Geral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Assunto *</label>
                <input
                  type="text"
                  required
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  placeholder="Ex: Dificuldade em aceder ao material após pagamento M-Pesa"
                  className="w-full bg-[#0F0E14] border border-[#1E1B26] rounded-xl px-3 py-2 text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Mensagem do Cliente</label>
                <textarea
                  rows={3}
                  value={newTicketMessage}
                  onChange={(e) => setNewTicketMessage(e.target.value)}
                  placeholder="Descreva a solicitação do comprador..."
                  className="w-full bg-[#0F0E14] border border-[#1E1B26] rounded-xl p-3 text-[#F8FAFC]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E1B26]">
                <button
                  type="button"
                  onClick={() => setNewTicketModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#1E1B26] text-[#94A3B8] hover:text-white"
                >
                  Cancelar
                </button>
                <button type="submit" className="laser-button px-5 py-2 rounded-xl font-bold text-white cursor-pointer">
                  Criar Chamado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
