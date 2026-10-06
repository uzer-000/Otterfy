'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductsTable, { ProductTableItem } from '@/components/dashboard/ProductsTable';
import ProductConfigModal from '@/components/dashboard/ProductConfigModal';

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductTableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [configuringProduct, setConfiguringProduct] = useState<ProductTableItem | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProducts();
  }, []);

  const handleToggleStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus as any } : p));
      }
    } catch (e) {
      console.error('Erro ao alterar status:', e);
    }
  };

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/pay/${id}`;
    navigator.clipboard.writeText(url);
    setCopyToast('Link de checkout copiado para a área de transferência!');
    setTimeout(() => setCopyToast(null), 3500);
  };

  const handleProductConfigSaved = (updated: any) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
  };

  return (
    <div className="w-full max-w-[2000px] 2xl:max-w-full mx-auto space-y-6 pb-16 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight">Produtos</h1>
          <p className="text-[#94A3B8] text-sm mt-1">Gerencie os seus produtos, acompanhe vendas e configure pixels de conversão</p>
        </div>
        <Link 
          href="/dashboard/products/new"
          className="laser-button px-5 py-2.5 text-sm font-semibold text-white rounded-xl self-start sm:self-auto shadow-lg"
        >
          <span>+ Novo Produto</span>
        </Link>
      </div>

      {/* Copy Link Toast Feedback */}
      {copyToast && (
        <div className="p-4 rounded-xl bg-violet-950/80 border border-violet-500/30 text-violet-300 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>{copyToast}</span>
          </div>
          <button onClick={() => setCopyToast(null)} className="text-[#94A3B8] hover:text-[#F8FAFC]">✕</button>
        </div>
      )}

      {/* Main Table Box matching Print 1 in Otterfy Theme Lines */}
      <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl overflow-hidden shadow-xl">
        {/* Table Title Bar */}
        <div className="px-6 py-4 border-b border-[#1E1B26] flex items-center justify-between bg-[#0F0E14]">
          <h2 className="text-sm font-bold text-[#F8FAFC] tracking-wide">Lista de produtos</h2>
          <span className="text-xs text-[#94A3B8] font-mono">
            {products.length} {products.length === 1 ? 'produto registrado' : 'produtos registrados'}
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-[#94A3B8] text-sm">A carregar produtos...</div>
        ) : products.length > 0 ? (
          <ProductsTable 
            products={products} 
            onToggleStatus={handleToggleStatus} 
            onCopyLink={handleCopyLink} 
            onOpenConfig={(p) => setConfiguringProduct(p)}
          />
        ) : (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-[#F8FAFC] font-bold text-lg mb-1">Nenhum produto cadastrado</p>
            <p className="text-[#64748B] text-sm mb-6 max-w-sm">Crie o seu primeiro produto para gerar links de checkout imediatos.</p>
            <Link 
              href="/dashboard/products/new"
              className="laser-button px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg"
            >
              Criar Primeiro Produto
            </Link>
          </div>
        )}
      </div>

      {/* Print 2 Configuration Modal for Pixels, Webhook, Utmify, Coupons & Checkout */}
      {configuringProduct && (
        <ProductConfigModal
          product={configuringProduct}
          isOpen={!!configuringProduct}
          onClose={() => setConfiguringProduct(null)}
          onSaved={handleProductConfigSaved}
        />
      )}
    </div>
  );
}
