'use client';

import React from 'react';
import Link from 'next/link';

export interface ProductTableItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  category?: string | null;
  currency?: string;
  approvalStatus?: string;
  salesCount?: number;
  createdAt: string;
  [key: string]: any;
}

interface ProductsTableProps {
  products: ProductTableItem[];
  onToggleStatus: (id: string, status: string) => void;
  onCopyLink: (id: string) => void;
  onOpenConfig?: (product: ProductTableItem) => void;
}

export default function ProductsTable({
  products,
  onToggleStatus,
  onCopyLink,
  onOpenConfig,
}: ProductsTableProps) {
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '20/09/2026';
      return d.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '20/09/2026';
    }
  };

  const getCategoryLabel = (category?: string | null) => {
    if (!category) return 'SoftwareSaaS';
    if (category.toLowerCase().includes('saas')) return 'SoftwareSaaS';
    if (category.toLowerCase().includes('curso')) return 'Curso Online';
    if (category.toLowerCase().includes('ebook') || category.toLowerCase().includes('e-book')) return 'E-book';
    return category;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        {/* Table Header in Otterfy Purple Theme Lines */}
        <thead className="bg-[#0F0E14] text-[#94A3B8] font-semibold text-xs border-b border-[#1E1B26]">
          <tr>
            <th className="py-4 px-4 w-16">Imagem</th>
            <th className="py-4 px-4 min-w-[200px]">Nome</th>
            <th className="py-4 px-4">Preço</th>
            <th className="py-4 px-4">Moeda</th>
            <th className="py-4 px-4">Tipo</th>
            <th className="py-4 px-4">Aprovação</th>
            <th className="py-4 px-4">Estado</th>
            <th className="py-4 px-4 min-w-[120px]">Checkout URL</th>
            <th className="py-4 px-4">Criado</th>
            <th className="py-4 px-4 text-right">Ações</th>
          </tr>
        </thead>

        {/* Table Body in Otterfy Purple Theme Lines */}
        <tbody className="divide-y divide-[#1E1B26] bg-[#0A090E]">
          {products.map((product) => {
            const isActive = product.status === 'ACTIVE';
            const isApproved = (product.approvalStatus || 'Aprovado').toLowerCase().includes('aprov');
            const sales = product.salesCount ?? 0;

            return (
              <tr
                key={product.id}
                className="hover:bg-[#16131F] transition-colors text-[#F8FAFC]"
              >
                {/* 1. Imagem (Capa do Produto) */}
                <td className="py-4 px-4">
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-[#14121B] border border-[#231F2E] flex items-center justify-center shrink-0 shadow-inner">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      // Seal badge style in Otterfy Violet Theme
                      <div className="w-9 h-9 rounded-lg bg-violet-600/15 text-violet-400 border border-violet-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </td>

                {/* 2. Nome + ID do Produto + Número de Vendas */}
                <td className="py-4 px-4">
                  <div className="space-y-1">
                    <Link
                      href={`/dashboard/products/${product.id}/edit`}
                      className="font-bold text-[#F8FAFC] hover:text-violet-400 transition-colors block text-xs tracking-tight line-clamp-1"
                      title={product.name}
                    >
                      {product.name}
                    </Link>
                    <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                      <span className="font-mono bg-[#14121B] border border-[#231F2E] px-1.5 py-0.5 rounded text-[#94A3B8]">
                        #{product.id}
                      </span>
                      <span className="text-[#332E3F]">•</span>
                      <span className="text-emerald-400 font-semibold">
                        {sales} {sales === 1 ? 'venda' : 'vendas'}
                      </span>
                      {onOpenConfig && (
                        <>
                          <span className="text-[#332E3F]">•</span>
                          <button
                            type="button"
                            onClick={() => onOpenConfig(product)}
                            className="text-violet-400 hover:text-violet-300 hover:underline cursor-pointer flex items-center gap-1 font-medium"
                            title="Configurar Pixel, Token e Webhook deste produto"
                          >
                            <span>Configurar Pixels/Webhook</span>
                            {(product.tracking?.metaPixelId || product.tracking?.utmifyPixelId || product.automation?.webhookUrl) && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </td>

                {/* 3. Preço */}
                <td className="py-4 px-4 font-mono font-bold text-violet-300 text-xs">
                  {Number(product.price).toFixed(2)}
                </td>

                {/* 4. Moeda */}
                <td className="py-4 px-4 text-[#94A3B8] font-mono text-xs">
                  {product.currency || 'MZN'}
                </td>

                {/* 5. Tipo */}
                <td className="py-4 px-4 text-[#94A3B8] text-xs">
                  {getCategoryLabel(product.category)}
                </td>

                {/* 6. Aprovação */}
                <td className="py-4 px-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      isApproved
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {product.approvalStatus || 'Aprovado'}
                  </span>
                </td>

                {/* 7. Estado */}
                <td className="py-4 px-4">
                  <button
                    type="button"
                    onClick={() =>
                      onToggleStatus(product.id, isActive ? 'INACTIVE' : 'ACTIVE')
                    }
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer transition-transform hover:scale-105 ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-[#1E1B26] text-[#64748B] border border-[#231F2E]'
                    }`}
                    title="Clique para alternar status"
                  >
                    {isActive ? 'Ativo' : 'Inativo'}
                  </button>
                </td>

                {/* 8. Checkout URL */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    {/* Ver Checkout Button */}
                    <a
                      href={`/pay/${product.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-violet-600/25 shrink-0"
                      title="Abrir e Visualizar Checkout"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Ver</span>
                    </a>

                    {/* Copy Link Button */}
                    <button
                      type="button"
                      onClick={() => onCopyLink(product.id)}
                      className="p-1.5 rounded-xl bg-[#14121B] hover:bg-[#1E1A29] border border-[#231F2E] hover:border-violet-500/40 text-violet-300 hover:text-white transition-all cursor-pointer shadow-sm"
                      title="Copiar Link de Checkout"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </td>

                {/* 9. Criado */}
                <td className="py-4 px-4 text-[#94A3B8] font-mono text-xs whitespace-nowrap">
                  {formatDate(product.createdAt)}
                </td>

                {/* 10. Ações (Configurar + Edit + Status Toggle) */}
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Configurar Button (Print 2 settings modal) */}
                    {onOpenConfig && (
                      <button
                        type="button"
                        onClick={() => onOpenConfig(product)}
                        className="relative p-2 rounded-xl bg-violet-600/15 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 hover:text-white transition-all cursor-pointer shadow-sm group"
                        title="Configurar Pixels, Token Meta/FB, Utmify e Webhooks"
                      >
                        {(product.tracking?.metaPixelId || product.tracking?.utmifyPixelId || product.automation?.webhookUrl) && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#0A090E] animate-pulse" />
                        )}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    )}

                    {/* Edit Button */}
                    <Link
                      href={`/dashboard/products/${product.id}/edit`}
                      className="p-2 rounded-xl bg-[#14121B] hover:bg-[#1E1A29] border border-[#231F2E] hover:border-violet-500/40 text-[#94A3B8] hover:text-white transition-all shadow-sm"
                      title="Editar Informações"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>

                    {/* Status Toggle / Block Button */}
                    <button
                      type="button"
                      onClick={() =>
                        onToggleStatus(product.id, isActive ? 'INACTIVE' : 'ACTIVE')
                      }
                      className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-400 transition-all cursor-pointer shadow-sm"
                      title={isActive ? 'Desativar Produto' : 'Ativar Produto'}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
