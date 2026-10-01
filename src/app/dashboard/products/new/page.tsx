'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageDropzone from '@/components/ui/ImageDropzone';
import { formatMZN } from '@/lib/utils';

type ProductType = 'ebook' | 'course' | 'saas' | null;

interface MaterialItem {
  id: string;
  name: string;
  type: 'pdf' | 'audio' | 'video' | 'zip' | 'other';
  url: string;
}

interface CourseLesson {
  id: string;
  title: string;
  videoUrl: string;
  durationMinutes: string;
}

export default function NewProductWizardPage() {
  const router = useRouter();

  // Wizard state: 0 = Category modal, 1 = Detalhes, 2 = Conteúdo, 3 = Materiais, 4 = Pagamento, 5 = Revisão
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<ProductType>('ebook');
  const [categoryModalOpen, setCategoryModalOpen] = useState<boolean>(true);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('150.00');
  const [currency] = useState('MZN');
  const [imageUrl, setImageUrl] = useState('');
  const [allowAffiliation, setAllowAffiliation] = useState(false);

  // Content (Step 2)
  const [ebookDeliveryType, setEbookDeliveryType] = useState<'upload' | 'link'>('link');
  const [ebookFileUrl, setEbookFileUrl] = useState('');
  const [saasDeliveryUrl, setSaasDeliveryUrl] = useState('');
  const [courseLessons, setCourseLessons] = useState<CourseLesson[]>([
    { id: '1', title: 'Aula 1: Boas-vindas e Introdução', videoUrl: 'https://youtube.com/watch?v=demo', durationMinutes: '12' },
  ]);

  // Materials (Step 3)
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialType, setNewMaterialType] = useState<'pdf' | 'audio' | 'video' | 'zip'>('pdf');
  const [newMaterialUrl, setNewMaterialUrl] = useState('');

  // Payment (Step 4)
  const [acceptMpesa, setAcceptMpesa] = useState(true);
  const [acceptEmola, setAcceptEmola] = useState(true);

  // Submission & Feedback
  const [loading, setLoading] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const parsedPrice = parseFloat(price) || 0;
  const isPriceValid = parsedPrice >= 50;

  // Category selection handler
  const handleSelectCategory = (cat: ProductType) => {
    setSelectedCategory(cat);
    setCategoryModalOpen(false);
    setCurrentStep(1);
  };

  // Add lesson for course
  const addLesson = () => {
    setCourseLessons([
      ...courseLessons,
      {
        id: Date.now().toString(),
        title: `Aula ${courseLessons.length + 1}: Nova Lição`,
        videoUrl: '',
        durationMinutes: '15',
      },
    ]);
  };

  const removeLesson = (id: string) => {
    setCourseLessons(courseLessons.filter((l) => l.id !== id));
  };

  // Add material
  const addMaterial = () => {
    if (!newMaterialName) return;
    setMaterials([
      ...materials,
      {
        id: Date.now().toString(),
        name: newMaterialName,
        type: newMaterialType,
        url: newMaterialUrl || '#',
      },
    ]);
    setNewMaterialName('');
    setNewMaterialUrl('');
  };

  const removeMaterial = (id: string) => {
    setMaterials(materials.filter((m) => m.id !== id));
  };

  // Final Submit
  const handleCreateProduct = async () => {
    if (!title || parsedPrice < 50) {
      alert('Por favor preencha o título e verifique o preço mínimo de 50 MZN.');
      return;
    }

    setLoading(true);
    try {
      const categoryNames: Record<string, string> = {
        ebook: 'E-book',
        course: 'Curso Online',
        saas: 'SaaS',
      };

      const paymentMethods = [];
      if (acceptMpesa) paymentMethods.push('MPESA');
      if (acceptEmola) paymentMethods.push('EMOLA');

      const contentUrl =
        selectedCategory === 'ebook'
          ? ebookFileUrl
          : selectedCategory === 'saas'
          ? saasDeliveryUrl
          : JSON.stringify(courseLessons);

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: title,
          description,
          price: parsedPrice,
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60',
          category: selectedCategory ? categoryNames[selectedCategory] : 'Digital',
          currency: 'MZN',
          contentDeliveryType: selectedCategory,
          contentUrl,
          materials,
          paymentMethods,
          allowAffiliation,
        }),
      });

      if (res.ok) {
        const prod = await res.json();
        setCreatedProductId(prod.id);
      } else {
        alert('Erro ao criar produto.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao criar produto.');
    } finally {
      setLoading(false);
    }
  };

  const copyCheckoutLink = () => {
    if (!createdProductId) return;
    const url = `${window.location.origin}/pay/${createdProductId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const getCategoryTitle = () => {
    if (selectedCategory === 'ebook') return 'Criar Novo Ebook';
    if (selectedCategory === 'course') return 'Criar Novo Curso Online';
    if (selectedCategory === 'saas') return 'Criar Novo SaaS';
    return 'Criar Novo Produto';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* ============================================================== */}
      {/* MODAL 1: SELETOR DE CATEGORIA (PRINT 1 NO TEMA ROXO DA OTTERFY) */}
      {/* ============================================================== */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl w-full max-w-3xl p-6 sm:p-8 shadow-2xl relative space-y-6 text-[#F8FAFC]">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-2 border-b border-[#1E1B26]">
              <div>
                <h2 className="text-2xl font-black text-[#F8FAFC] tracking-tight">Criar Novo Produto</h2>
                <p className="text-xs text-[#94A3B8] mt-1">Escolha o tipo de produto que deseja criar</p>
              </div>
              <Link
                href="/dashboard/products"
                className="w-8 h-8 rounded-full bg-[#1A1820] text-[#94A3B8] hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </Link>
            </div>

            {/* Grid of Categories (Print 1 style in Otterfy Purple) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. E-book */}
              <div
                onClick={() => handleSelectCategory('ebook')}
                className="group relative bg-[#0F0E14] hover:bg-[#16131F] border border-[#1E1B26] hover:border-violet-500/60 rounded-2xl p-5 cursor-pointer transition-all duration-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-600 text-white shadow-sm">
                      Mais Popular
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-bold text-base text-[#F8FAFC] group-hover:text-violet-300 transition-colors">
                    E-book
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-1">Livros digitais, guias e materiais em PDF</p>
                  <ul className="mt-4 space-y-1.5 text-xs text-[#94A3B8]">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      PDF automático
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      Download direto
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      Proteção DRM
                    </li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-[#1E1B26] flex items-center justify-between text-xs text-violet-400 font-semibold">
                  <span>Selecionar</span>
                  <span>→</span>
                </div>
              </div>

              {/* 2. Curso Online */}
              <div
                onClick={() => handleSelectCategory('course')}
                className="group relative bg-[#0F0E14] hover:bg-[#16131F] border border-[#1E1B26] hover:border-violet-500/60 rounded-2xl p-5 cursor-pointer transition-all duration-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-bold text-base text-[#F8FAFC] group-hover:text-violet-300 transition-colors">
                    Curso Online
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-1">Cursos com vídeo-aulas e materiais</p>
                  <ul className="mt-4 space-y-1.5 text-xs text-[#94A3B8]">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      Vídeo-aulas
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      Materiais extras
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      Certificado
                    </li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-[#1E1B26] flex items-center justify-between text-xs text-violet-400 font-semibold">
                  <span>Selecionar</span>
                  <span>→</span>
                </div>
              </div>

              {/* 3. SaaS */}
              <div
                onClick={() => handleSelectCategory('saas')}
                className="group relative bg-[#0F0E14] hover:bg-[#16131F] border border-[#1E1B26] hover:border-violet-500/60 rounded-2xl p-5 cursor-pointer transition-all duration-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-bold text-base text-[#F8FAFC] group-hover:text-violet-300 transition-colors">
                    SaaS
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-1">Link de acesso com cobrança recorrente</p>
                  <ul className="mt-4 space-y-1.5 text-xs text-[#94A3B8]">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      Link de redirecionamento
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      Recorrência flexível
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      Lembretes automáticos
                    </li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-[#1E1B26] flex items-center justify-between text-xs text-violet-400 font-semibold">
                  <span>Selecionar</span>
                  <span>→</span>
                </div>
              </div>

              {/* 4. Template / Planilha (Em Breve) */}
              <div className="bg-[#0F0E14]/50 border border-[#1E1B26]/60 rounded-2xl p-5 opacity-60">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1E1B26] text-[#94A3B8]">
                    Em Breve
                  </span>
                  <div className="w-6 h-6 rounded-md bg-[#1E1B26] text-[#94A3B8] flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="font-bold text-sm text-[#F8FAFC]">Template/Planilha</h3>
                <p className="text-[11px] text-[#64748B] mt-1">Planilhas, templates e documentos</p>
              </div>

              {/* 5. Pacote / Bundle (Em Breve) */}
              <div className="bg-[#0F0E14]/50 border border-[#1E1B26]/60 rounded-2xl p-5 opacity-60">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1E1B26] text-[#94A3B8]">
                    Em Breve
                  </span>
                  <div className="w-6 h-6 rounded-md bg-[#1E1B26] text-[#94A3B8] flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <h3 className="font-bold text-sm text-[#F8FAFC]">Pacote/Bundle</h3>
                <p className="text-[11px] text-[#64748B] mt-1">Combinação de múltiplos produtos</p>
              </div>

              {/* 6. Software / Plugin (Em Breve) */}
              <div className="bg-[#0F0E14]/50 border border-[#1E1B26]/60 rounded-2xl p-5 opacity-60">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1E1B26] text-[#94A3B8]">
                    Em Breve
                  </span>
                  <div className="w-6 h-6 rounded-md bg-[#1E1B26] text-[#94A3B8] flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <h3 className="font-bold text-sm text-[#F8FAFC]">Software/Plugin</h3>
                <p className="text-[11px] text-[#64748B] mt-1">Aplicativos e automações</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL ONCE PRODUCT IS CREATED */}
      {createdProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#121016] border border-violet-500/40 rounded-3xl w-full max-w-lg p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center text-2xl font-black">
              ✓
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#F8FAFC]">Produto Criado com Sucesso!</h2>
              <p className="text-xs text-[#94A3B8] mt-1">
                Como você é o administrador da plataforma, seu produto foi <strong className="text-emerald-400">Aprovado Imediatamente</strong> e já está ativo para receber pagamentos!
              </p>
            </div>

            {/* Generated Link Box */}
            <div className="p-3.5 rounded-xl bg-[#0F0E14] border border-[#1E1B26] flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-mono text-violet-300">
                {typeof window !== 'undefined' ? `${window.location.origin}/pay/${createdProductId}` : `/pay/${createdProductId}`}
              </span>
              <button
                type="button"
                onClick={copyCheckoutLink}
                className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors cursor-pointer shrink-0"
              >
                {copiedLink ? 'Copiado!' : 'Copiar'}
              </button>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <Link
                href={`/pay/${createdProductId}`}
                target="_blank"
                className="laser-button flex-1 py-3 text-xs font-bold text-white rounded-xl"
              >
                Abrir Checkout
              </Link>
              <Link
                href="/dashboard/products"
                className="flex-1 py-3 bg-[#0F0E14] hover:bg-[#1A1820] border border-[#1E1B26] text-[#94A3B8] hover:text-white rounded-xl text-xs font-semibold text-center transition-colors"
              >
                Ver Meus Produtos
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Stepper Header (Print 2 style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E1B26] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCategoryModalOpen(true)}
              className="text-xs text-violet-400 hover:underline flex items-center gap-1 font-semibold"
            >
              ← Alterar Categoria
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight mt-1">{getCategoryTitle()}</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">Transforme seu conhecimento em um produto digital completo</p>
        </div>

        {/* 5-Step Stepper Component */}
        <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto py-1">
          {[
            { num: 1, label: 'Detalhes' },
            { num: 2, label: 'Conteúdo' },
            { num: 3, label: 'Materiais' },
            { num: 4, label: 'Pagamento' },
            { num: 5, label: 'Revisão' },
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div
                onClick={() => setCurrentStep(s.num)}
                className={`flex items-center gap-1.5 cursor-pointer text-xs font-semibold transition-all ${
                  currentStep === s.num
                    ? 'text-violet-400'
                    : currentStep > s.num
                    ? 'text-emerald-400'
                    : 'text-[#64748B]'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    currentStep === s.num
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : currentStep > s.num
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-[#1E1B26] text-[#64748B]'
                  }`}
                >
                  {currentStep > s.num ? '✓' : s.num}
                </span>
                <span className="hidden md:inline">{s.label}</span>
              </div>
              {idx < 4 && <span className="text-[#1E1B26] text-xs">──</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* ETAPA 1: DETALHES (PRINT 2)                                     */}
      {/* ============================================================== */}
      {currentStep === 1 && (
        <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl p-6 sm:p-8 space-y-6 animate-fadeIn shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Capa, Título, Descrição */}
            <div className="space-y-6">
              {/* Capa do Produto */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#F8FAFC]">
                    Capa do Produto <span className="text-violet-400">*</span>
                  </label>
                  <span className="text-[11px] text-[#64748B]">máx. 10MB</span>
                </div>

                <ImageDropzone
                  value={imageUrl}
                  onChange={(url) => setImageUrl(url)}
                  onRemove={() => setImageUrl('')}
                  label="Capa do Produto"
                  sublabel="Arraste ou clique para selecionar do computador (PNG, JPG, WEBP)"
                  aspectRatio="square"
                />
              </div>

              {/* Título do Produto */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#F8FAFC]">
                    Título do Produto <span className="text-violet-400">*</span>
                  </label>
                  <span className="text-[11px] text-[#64748B]">{title.length}/60</span>
                </div>
                <input
                  type="text"
                  maxLength={60}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Guia Completo de Marketing Digital"
                  className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-[#F8FAFC] focus:outline-none transition-colors"
                />
              </div>

              {/* Descrição */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#F8FAFC]">
                    Descrição <span className="text-violet-400">*</span>
                  </label>
                  <span className="text-[11px] text-[#64748B]">{description.length}/500</span>
                </div>
                <textarea
                  rows={4}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o conteúdo do produto, os benefícios e o que o leitor aprenderá..."
                  className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl p-4 text-xs text-[#F8FAFC] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Right Column: Mercado / Moeda, Preço, Configurações Avançadas */}
            <div className="space-y-6">
              {/* Mercado / Moeda */}
              <div>
                <label className="text-xs font-semibold text-[#F8FAFC] block mb-2">
                  Mercado / Moeda <span className="text-violet-400">*</span>
                </label>
                <div className="w-full bg-[#0F0E14] border border-[#1E1B26] rounded-xl px-4 py-3 text-xs text-[#F8FAFC] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-violet-400 font-mono">MZ</span>
                    <span>Metical — Moçambique (MZN)</span>
                  </div>
                  <span className="text-[#64748B] text-[11px] font-medium flex items-center gap-1">
                    <svg className="w-3 h-3 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <span>Fixo</span>
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] mt-1.5 leading-relaxed">
                  Define o mercado onde este produto será vendido. Os métodos de pagamento disponíveis no checkout serão ajustados automaticamente (M-Pesa & e-Mola).
                </p>
              </div>

              {/* Preço MZN */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#F8FAFC]">
                    Preço (MZN) <span className="text-violet-400">*</span>
                  </label>
                  <span className="text-[11px] text-[#94A3B8]">Mínimo MT 50,00</span>
                </div>
                <div className="flex rounded-xl bg-[#0F0E14] border border-[#1E1B26] focus-within:border-violet-500 overflow-hidden">
                  <span className="px-4 py-3 bg-[#1A1820] text-xs font-bold text-[#94A3B8] border-r border-[#1E1B26] flex items-center">
                    MT
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="50"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0,00"
                    className="flex-1 px-4 py-3 text-sm font-mono font-bold text-[#F8FAFC] bg-transparent focus:outline-none"
                  />
                  <span className="px-4 py-3 text-xs font-mono text-[#64748B] flex items-center">
                    MZN
                  </span>
                </div>
                {!isPriceValid && (
                  <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1">
                    <span>ⓘ</span> Mínimo MT 50,00
                  </p>
                )}
              </div>

              {/* Configurações Avançadas */}
              <div className="pt-4 border-t border-[#1E1B26] space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Configurações Avançadas
                </h4>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[#0F0E14] border border-[#1E1B26]">
                  <div>
                    <span className="text-xs font-semibold text-[#F8FAFC] block">Permitir Afiliação</span>
                    <span className="text-[11px] text-[#64748B]">Permite que afiliados promovam este produto</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowAffiliation(!allowAffiliation)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      allowAffiliation ? 'bg-violet-600' : 'bg-[#1E1B26]'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        allowAffiliation ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stepper Footer Action */}
          <div className="flex justify-end pt-4 border-t border-[#1E1B26]">
            <button
              type="button"
              onClick={() => {
                if (!title) {
                  alert('Por favor digite o título do produto.');
                  return;
                }
                if (!isPriceValid) {
                  alert('O preço mínimo é de 50 MZN.');
                  return;
                }
                setCurrentStep(2);
              }}
              className="laser-button px-6 py-2.5 text-xs font-bold text-white rounded-xl cursor-pointer"
            >
              Avançar para Conteúdo →
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ETAPA 2: CONTEÚDO                                               */}
      {/* ============================================================== */}
      {currentStep === 2 && (
        <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl p-6 sm:p-8 space-y-6 animate-fadeIn shadow-xl">
          <div>
            <h3 className="text-lg font-bold text-[#F8FAFC]">Entrega de Conteúdo</h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Configure o material principal que o comprador receberá após a aprovação do pagamento
            </p>
          </div>

          {/* E-BOOK CONTENT */}
          {selectedCategory === 'ebook' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEbookDeliveryType('link')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    ebookDeliveryType === 'link'
                      ? 'bg-violet-600/15 border-violet-500/30 text-violet-300'
                      : 'bg-[#0F0E14] border-[#1E1B26] text-[#94A3B8]'
                  }`}
                >
                  Link do PDF (Google Drive / Dropbox / S3)
                </button>
                <button
                  type="button"
                  onClick={() => setEbookDeliveryType('upload')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    ebookDeliveryType === 'upload'
                      ? 'bg-violet-600/15 border-violet-500/30 text-violet-300'
                      : 'bg-[#0F0E14] border-[#1E1B26] text-[#94A3B8]'
                  }`}
                >
                  Upload Direto de PDF
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#F8FAFC] block mb-2">
                  URL de Acesso ao E-book (PDF) <span className="text-violet-400">*</span>
                </label>
                <input
                  type="url"
                  value={ebookFileUrl}
                  onChange={(e) => setEbookFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/meu-ebook.pdf"
                  className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-[#F8FAFC] focus:outline-none"
                />
                <p className="text-[11px] text-[#64748B] mt-1.5">
                  O cliente receberá este link imediatamente na tela de sucesso pós-pagamento e por WhatsApp.
                </p>
              </div>
            </div>
          )}

          {/* COURSE CONTENT */}
          {selectedCategory === 'course' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F8FAFC]">Aulas e Módulos do Curso</span>
                <button
                  type="button"
                  onClick={addLesson}
                  className="px-3 py-1.5 rounded-lg bg-violet-600/15 border border-violet-500/30 text-violet-300 text-xs font-semibold hover:bg-violet-600/25 transition-all"
                >
                  + Adicionar Aula
                </button>
              </div>

              <div className="space-y-3">
                {courseLessons.map((lesson, idx) => (
                  <div key={lesson.id} className="p-4 rounded-2xl bg-[#0F0E14] border border-[#1E1B26] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-violet-400">Aula #{idx + 1}</span>
                      {courseLessons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLesson(lesson.id)}
                          className="text-xs text-red-400 hover:underline"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) => {
                          const updated = [...courseLessons];
                          updated[idx].title = e.target.value;
                          setCourseLessons(updated);
                        }}
                        placeholder="Título da Aula"
                        className="bg-[#121016] border border-[#1E1B26] rounded-xl px-3 py-2 text-xs text-[#F8FAFC]"
                      />
                      <input
                        type="text"
                        value={lesson.videoUrl}
                        onChange={(e) => {
                          const updated = [...courseLessons];
                          updated[idx].videoUrl = e.target.value;
                          setCourseLessons(updated);
                        }}
                        placeholder="Link do Vídeo (YouTube, Vimeo, Drive)"
                        className="bg-[#121016] border border-[#1E1B26] rounded-xl px-3 py-2 text-xs text-[#F8FAFC]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SAAS LINK ON DELIVERY */}
          {selectedCategory === 'saas' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#F8FAFC] block mb-2">
                  Link on Delivery / URL de Acesso Imediato <span className="text-violet-400">*</span>
                </label>
                <input
                  type="url"
                  value={saasDeliveryUrl}
                  onChange={(e) => setSaasDeliveryUrl(e.target.value)}
                  placeholder="https://app.suaempresa.com/register?ref=otterfy"
                  className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-[#F8FAFC] focus:outline-none"
                />
                <p className="text-[11px] text-[#64748B] mt-1.5">
                  O cliente será redirecionado para esta URL assim que o pagamento for aprovado pelo M-Pesa / e-Mola.
                </p>
              </div>
            </div>
          )}

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1E1B26]">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 rounded-xl border border-[#1E1B26] text-xs font-semibold text-[#94A3B8] hover:text-white"
            >
              ← Voltar
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="laser-button px-6 py-2.5 text-xs font-bold text-white rounded-xl"
            >
              Avançar para Materiais →
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ETAPA 3: MATERIAIS COMPLEMENTARES                               */}
      {/* ============================================================== */}
      {currentStep === 3 && (
        <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl p-6 sm:p-8 space-y-6 animate-fadeIn shadow-xl">
          <div>
            <h3 className="text-lg font-bold text-[#F8FAFC]">Materiais Complementares</h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Anexe materiais extras acessíveis no dispositivo do cliente (PDFs de apoio, áudios, planilhas ou arquivos de download)
            </p>
          </div>

          {/* Add Material Input Row */}
          <div className="p-4 rounded-2xl bg-[#0F0E14] border border-[#1E1B26] space-y-3">
            <span className="text-xs font-semibold text-[#F8FAFC] block">Adicionar Arquivo / Material</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={newMaterialName}
                onChange={(e) => setNewMaterialName(e.target.value)}
                placeholder="Nome do Material (Ex: Planilha de Apoio)"
                className="bg-[#121016] border border-[#1E1B26] rounded-xl px-3 py-2 text-xs text-[#F8FAFC]"
              />
              <select
                value={newMaterialType}
                onChange={(e) => setNewMaterialType(e.target.value as any)}
                className="bg-[#121016] border border-[#1E1B26] rounded-xl px-3 py-2 text-xs text-[#F8FAFC]"
              >
                <option value="pdf">Documento PDF</option>
                <option value="audio">Áudio / Podcast (MP3)</option>
                <option value="video">Vídeo Adicional</option>
                <option value="zip">Arquivo Compactado (ZIP)</option>
              </select>
              <input
                type="text"
                value={newMaterialUrl}
                onChange={(e) => setNewMaterialUrl(e.target.value)}
                placeholder="Link do Arquivo ou Upload"
                className="bg-[#121016] border border-[#1E1B26] rounded-xl px-3 py-2 text-xs text-[#F8FAFC]"
              />
            </div>
            <button
              type="button"
              onClick={addMaterial}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              + Inserir Material
            </button>
          </div>

          {/* List of Attached Materials */}
          {materials.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#94A3B8]">Materiais Anexados ({materials.length}):</span>
              {materials.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-[#0F0E14] border border-[#1E1B26] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-violet-600/10 text-violet-400 font-mono uppercase font-bold text-[10px]">
                      {m.type}
                    </span>
                    <span className="font-semibold text-[#F8FAFC]">{m.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMaterial(m.id)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1E1B26]">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 rounded-xl border border-[#1E1B26] text-xs font-semibold text-[#94A3B8] hover:text-white"
            >
              ← Voltar
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="laser-button px-6 py-2.5 text-xs font-bold text-white rounded-xl"
            >
              Avançar para Pagamento →
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ETAPA 4: PAGAMENTO (M-PESA & E-MOLA)                            */}
      {/* ============================================================== */}
      {currentStep === 4 && (
        <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl p-6 sm:p-8 space-y-6 animate-fadeIn shadow-xl">
          <div>
            <h3 className="text-lg font-bold text-[#F8FAFC]">Métodos de Pagamento</h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Selecione as carteiras móveis disponíveis no checkout deste produto
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* M-PESA */}
            <div
              onClick={() => setAcceptMpesa(!acceptMpesa)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between ${
                acceptMpesa
                  ? 'bg-red-500/10 border-red-500/40 text-white'
                  : 'bg-[#0F0E14] border-[#1E1B26] text-[#64748B] opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  <img src="/gateways/Mpesa.png" alt="M-Pesa" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#F8FAFC]">M-Pesa (Vodacom)</h4>
                  <p className="text-xs text-[#94A3B8]">Números 84 e 85 • Confirmação USSD Push</p>
                </div>
              </div>
              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                acceptMpesa ? 'bg-red-600 text-white' : 'border border-[#1E1B26]'
              }`}>
                {acceptMpesa && '✓'}
              </span>
            </div>

            {/* E-MOLA */}
            <div
              onClick={() => setAcceptEmola(!acceptEmola)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between ${
                acceptEmola
                  ? 'bg-orange-500/10 border-orange-500/40 text-white'
                  : 'bg-[#0F0E14] border-[#1E1B26] text-[#64748B] opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  <img src="/gateways/emola.png" alt="e-Mola" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#F8FAFC]">e-Mola (Movitel)</h4>
                  <p className="text-xs text-[#94A3B8]">Números 86 e 87 • Confirmação USSD Push</p>
                </div>
              </div>
              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                acceptEmola ? 'bg-orange-600 text-white' : 'border border-[#1E1B26]'
              }`}>
                {acceptEmola && '✓'}
              </span>
            </div>
          </div>

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1E1B26]">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 rounded-xl border border-[#1E1B26] text-xs font-semibold text-[#94A3B8] hover:text-white"
            >
              ← Voltar
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="laser-button px-6 py-2.5 text-xs font-bold text-white rounded-xl"
            >
              Avançar para Revisão →
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ETAPA 5: REVISÃO & PUBLICAÇÃO (APROVADO LOGO COMO ADM)           */}
      {/* ============================================================== */}
      {currentStep === 5 && (
        <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl p-6 sm:p-8 space-y-6 animate-fadeIn shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E1B26]">
            <div>
              <h3 className="text-lg font-bold text-[#F8FAFC]">Revisão do Produto</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">Confira todos os dados antes de publicar</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              ✓ Pronto para Ativação
            </span>
          </div>

          {/* Summary Card */}
          <div className="p-6 rounded-2xl bg-[#0F0E14] border border-[#1E1B26] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {imageUrl ? (
                <img src={imageUrl} alt="Capa" className="w-24 h-24 object-cover rounded-xl border border-[#1E1B26]" />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              )}
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-md bg-violet-600/20 text-violet-400 font-mono text-[10px] font-bold uppercase">
                  {selectedCategory ? selectedCategory.toUpperCase() : 'PRODUTO'}
                </span>
                <h4 className="text-xl font-black text-[#F8FAFC]">{title || 'Título do Produto'}</h4>
                <p className="text-xs text-[#94A3B8] line-clamp-2">{description || 'Sem descrição inserida.'}</p>
                <div className="text-2xl font-black text-emerald-400 font-mono pt-1">
                  {formatMZN(parsedPrice)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#1E1B26] text-xs text-[#94A3B8]">
              <div>
                <span className="block text-[11px] text-[#64748B]">Métodos Aceitos:</span>
                <span className="font-semibold text-[#F8FAFC]">
                  {[acceptMpesa && 'M-Pesa', acceptEmola && 'e-Mola'].filter(Boolean).join(', ') || 'Nenhum'}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-[#64748B]">Materiais Anexados:</span>
                <span className="font-semibold text-[#F8FAFC]">{materials.length} itens adicionais</span>
              </div>
              <div>
                <span className="block text-[11px] text-[#64748B]">Status de Aprovação:</span>
                <span className="font-semibold text-emerald-400">Aprovado Imediatamente (Adm)</span>
              </div>
            </div>
          </div>

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1E1B26]">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2.5 rounded-xl border border-[#1E1B26] text-xs font-semibold text-[#94A3B8] hover:text-white"
            >
              ← Voltar
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleCreateProduct}
              className="laser-button px-8 py-3 text-sm font-bold text-white rounded-xl disabled:opacity-50 cursor-pointer shadow-lg"
            >
              {loading ? 'Publicando Produto...' : 'Concluir & Publicar Produto'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
