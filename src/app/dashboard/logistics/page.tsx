'use client';

import React, { useEffect, useState } from 'react';
import {
  Truck,
  Package,
  MapPin,
  CheckCircle2,
  Clock,
  MessageCircle,
  Search,
  Save,
  Send,
} from 'lucide-react';
import { Transaction, normalizeTransactions } from '@/lib/db';

interface ShippingRecord {
  orderId: string;
  trackingCode: string;
  carrier: string;
  province: string;
  shippingStatus: 'AGUARDANDO_ENVIO' | 'EM_TRANSITO' | 'ENTREGUE';
  updatedAt: string;
}

interface ProvinceRate {
  province: string;
  rateMzn: number;
  etaDays: string;
  active: boolean;
}

const DEFAULT_RATES: ProvinceRate[] = [
  { province: 'Maputo Cidade & Província', rateMzn: 150, etaDays: 'Mesmo dia / 24h', active: true },
  { province: 'Gaza (Xai-Xai)', rateMzn: 300, etaDays: '1 a 2 dias úteis', active: true },
  { province: 'Inhambane', rateMzn: 350, etaDays: '2 a 3 dias úteis', active: true },
  { province: 'Sofala (Beira)', rateMzn: 450, etaDays: '2 a 4 dias úteis', active: true },
  { province: 'Nampula', rateMzn: 550, etaDays: '3 a 5 dias úteis', active: true },
  { province: 'Tete / Zambézia / Cabo Delgado', rateMzn: 650, etaDays: '4 a 6 dias úteis', active: true },
];

const STORAGE_KEY_SHIPMENTS = 'otterfy_logistics_shipments_v1';
const STORAGE_KEY_RATES = 'otterfy_logistics_rates_v1';

export default function LogisticsPage() {
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [shipments, setShipments] = useState<Record<string, ShippingRecord>>({});
  const [rates, setRates] = useState<ProvinceRate[]>(DEFAULT_RATES);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/payments')
      .then((res) => res.json())
      .then((data) => {
        setOrders(normalizeTransactions(data));
      })
      .catch(console.error);

    try {
      const savedShip = localStorage.getItem(STORAGE_KEY_SHIPMENTS);
      if (savedShip) setShipments(JSON.parse(savedShip));

      const savedRates = localStorage.getItem(STORAGE_KEY_RATES);
      if (savedRates) setRates(JSON.parse(savedRates));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const updateShipment = (orderId: string, patch: Partial<ShippingRecord>) => {
    const existing = shipments[orderId] || {
      orderId,
      trackingCode: `MZ-${orderId.slice(0, 6).toUpperCase()}`,
      carrier: 'Portador Diário / Correios MZ',
      province: 'Maputo Cidade & Província',
      shippingStatus: 'AGUARDANDO_ENVIO',
      updatedAt: new Date().toISOString(),
    };
    const next = {
      ...shipments,
      [orderId]: { ...existing, ...patch, updatedAt: new Date().toISOString() },
    };
    setShipments(next);
    try {
      localStorage.setItem(STORAGE_KEY_SHIPMENTS, JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
    setFeedback('Rastreio e estado de envio atualizados!');
    setTimeout(() => setFeedback(null), 2500);
  };

  const saveRates = () => {
    try {
      localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(rates));
    } catch (e) {
      console.error(e);
    }
    setFeedback('Tabela de frete por província guardada com sucesso!');
    setTimeout(() => setFeedback(null), 2800);
  };

  const filteredOrders = orders.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.customerPhone.toLowerCase().includes(q) ||
      (o.customerEmail || '').toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Truck className="w-3.5 h-3.5" />
            Logística, Frete & Código de Rastreio
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Logística & Envio de Produtos Físicos</h1>
          <p className="text-sm text-[#8b8b9e] mt-0.5">
            Gira o despacho de encomendas físicas, atribua códigos de rastreio e notifique os clientes via WhatsApp com 1 clique.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Fulfillment & Tracking Queue */}
        <div className="lg:col-span-8 bg-[#11111a] border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              Fila de Expedição & Rastreio ({filteredOrders.length})
            </h2>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#8b8b9e] absolute left-3 top-2.5" />
              <input
                type="search"
                aria-label="Pesquisar pedido por telefone ou ID"
                placeholder="Pesquisar telefone ou pedido..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-xs text-white"
              />
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#8b8b9e]">
              Nenhum pedido encontrado para expedição.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.slice(0, 12).map((order) => {
                const ship = shipments[order.id] || {
                  orderId: order.id,
                  trackingCode: `MZ-${order.id.slice(0, 6).toUpperCase()}`,
                  carrier: 'Portador Diário / Motoboy',
                  province: 'Maputo Cidade & Província',
                  shippingStatus: 'AGUARDANDO_ENVIO' as const,
                  updatedAt: order.createdAt,
                };

                const waPhone = order.customerPhone.replace(/\D/g, '');
                const fullPhone = waPhone.startsWith('258') ? waPhone : `258${waPhone}`;
                const waText = encodeURIComponent(
                  `Olá! O seu pedido #${order.id.slice(0, 8)} na Otterfy está com estado *${ship.shippingStatus.replace('_', ' ')}*.\nCódigo de Rastreio: *${ship.trackingCode}* (${ship.carrier}).`
                );

                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl bg-[#0a0a0f] border border-white/[0.06] space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-white">
                          Pedido #{order.id.slice(0, 8)} • {order.amount.toLocaleString('pt-MZ')} MT
                        </span>
                        <div className="text-[11px] text-[#8b8b9e]">
                          Cliente: {order.customerPhone} {order.customerEmail ? `(${order.customerEmail})` : ''}
                        </div>
                      </div>

                      <select
                        aria-label={`Estado de envio do pedido ${order.id}`}
                        value={ship.shippingStatus}
                        onChange={(e) =>
                          updateShipment(order.id, {
                            shippingStatus: e.target.value as ShippingRecord['shippingStatus'],
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#11111a] border border-white/[0.1] text-xs font-bold text-emerald-400"
                      >
                        <option value="AGUARDANDO_ENVIO">Aguardando Envio</option>
                        <option value="EM_TRANSITO">Em Trânsito</option>
                        <option value="ENTREGUE">Entregue ao Cliente</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/[0.05]">
                      <input
                        type="text"
                        aria-label="Código de rastreio"
                        value={ship.trackingCode}
                        onChange={(e) =>
                          updateShipment(order.id, { trackingCode: e.target.value.toUpperCase() })
                        }
                        placeholder="Código de Rastreio"
                        className="px-3 py-1.5 rounded-lg bg-[#11111a] border border-white/[0.08] text-xs text-white font-mono"
                      />

                      <input
                        type="text"
                        aria-label="Transportadora"
                        value={ship.carrier}
                        onChange={(e) => updateShipment(order.id, { carrier: e.target.value })}
                        placeholder="Transportadora / Estafeta"
                        className="px-3 py-1.5 rounded-lg bg-[#11111a] border border-white/[0.08] text-xs text-white"
                      />

                      <a
                        href={`https://wa.me/${fullPhone}?text=${waText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Enviar Rastreio no WhatsApp
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Freight Table by Province */}
        <div className="lg:col-span-4 bg-[#11111a] border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Tabela de Frete (Moçambique)
            </h2>
          </div>

          <p className="text-xs text-[#8b8b9e]">
            Configure o custo de entrega em Meticais (MT) por província para produtos físicos.
          </p>

          <div className="space-y-2.5">
            {rates.map((r, idx) => (
              <div
                key={r.province}
                className="p-3 rounded-xl bg-[#0a0a0f] border border-white/[0.06] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{r.province}</span>
                  <span className="text-[10px] text-[#8b8b9e]">{r.etaDays}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#8b8b9e]">Taxa (MT):</span>
                  <input
                    type="number"
                    aria-label={`Taxa de entrega para ${r.province}`}
                    value={r.rateMzn}
                    onChange={(e) => {
                      const next = [...rates];
                      next[idx] = { ...r, rateMzn: Number(e.target.value) };
                      setRates(next);
                    }}
                    className="w-24 px-2.5 py-1 rounded-lg bg-[#11111a] border border-white/[0.1] text-right text-xs font-bold text-emerald-400"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={saveRates}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
          >
            <Save className="w-4 h-4" />
            Guardar Tabela de Frete
          </button>
        </div>
      </div>
    </div>
  );
}
