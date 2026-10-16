'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Save,
  Layers,
} from 'lucide-react';
import { Product } from '@/lib/db';

export interface QuizQuestion {
  id: string;
  question: string;
  subtitle?: string;
  options: { id: string; label: string; badge?: string }[];
}

export interface QuizFunnel {
  id: string;
  title: string;
  slug: string;
  headline: string;
  description: string;
  targetProductId: string;
  couponCode?: string;
  collectLeadBeforeRedirect: boolean;
  pixelId?: string;
  accentColor: string;
  buttonText: string;
  views: number;
  completions: number;
  questions: QuizQuestion[];
}

export const QUIZ_STORAGE_KEY = 'otterfy_quiz_funnels_v1';

export const DEFAULT_QUIZZES: QuizFunnel[] = [
  {
    id: 'quiz-padrao',
    title: 'Diagnóstico Rápido de Perfil Digital',
    slug: 'diagnostico-digital',
    headline: 'Descubra em 60 segundos o plano ideal para escalar os seus resultados em Moçambique',
    description: 'Responda a 3 perguntas rápidas para desbloquear uma recomendação personalizada com desconto especial.',
    targetProductId: '',
    couponCode: 'BEMVINDO10',
    collectLeadBeforeRedirect: true,
    pixelId: '',
    accentColor: '#10b981',
    buttonText: 'Desbloquear Oferta Recomendada →',
    views: 148,
    completions: 94,
    questions: [
      {
        id: 'q1',
        question: 'Qual é o seu principal objetivo neste momento?',
        subtitle: 'Escolha a opção que melhor descreve o seu momento atual.',
        options: [
          { id: 'o1', label: 'Começar do zero e fazer as primeiras vendas em MT', badge: 'Iniciante' },
          { id: 'o2', label: 'Automatizar vendas com M-Pesa e e-Mola 24h/dia', badge: 'Escala' },
          { id: 'o3', label: 'Aumentar a conversão do meu checkout atual', badge: 'Avançado' },
        ],
      },
      {
        id: 'q2',
        question: 'Quanto tempo por dia pode dedicar à implementação?',
        subtitle: 'O método adapta-se à sua rotina.',
        options: [
          { id: 'o4', label: '30 a 60 minutos por dia' },
          { id: 'o5', label: '1 a 3 horas por dia' },
          { id: 'o6', label: 'Dedicação integral ao negócio' },
        ],
      },
      {
        id: 'q3',
        question: 'Qual meio de pagamento os seus clientes mais utilizam?',
        subtitle: 'Importante para configurarmos o seu funil.',
        options: [
          { id: 'o7', label: 'M-Pesa (Vodacom)' },
          { id: 'o8', label: 'e-Mola (Movitel)' },
          { id: 'o9', label: 'Ambos (M-Pesa + e-Mola)' },
        ],
      },
    ],
  },
];

export default function QuizBuilderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quizzes, setQuizzes] = useState<QuizFunnel[]>(DEFAULT_QUIZZES);
  const [selectedQuizId, setSelectedQuizId] = useState<string>(DEFAULT_QUIZZES[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch(console.error);

    try {
      const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuizzes(parsed);
          setSelectedQuizId(parsed[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const persistQuizzes = (next: QuizFunnel[], msg = 'Funil de Quiz guardado com sucesso!') => {
    setQuizzes(next);
    try {
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const activeQuiz = quizzes.find((q) => q.id === selectedQuizId) || quizzes[0];

  const updateActiveQuiz = (patch: Partial<QuizFunnel>) => {
    if (!activeQuiz) return;
    const next = quizzes.map((q) => (q.id === activeQuiz.id ? { ...q, ...patch } : q));
    setQuizzes(next);
  };

  const handleCreateQuiz = () => {
    const newId = `quiz-${Date.now().toString().slice(-5)}`;
    const newQuiz: QuizFunnel = {
      id: newId,
      title: `Novo Funil Quiz #${quizzes.length + 1}`,
      slug: newId,
      headline: 'Responda a este diagnóstico rápido para descobrir a solução ideal para si',
      description: 'Leva menos de 1 minuto e desbloqueia uma condição especial no final.',
      targetProductId: products[0]?.id || '',
      couponCode: '',
      collectLeadBeforeRedirect: true,
      pixelId: '',
      accentColor: '#10b981',
      buttonText: 'Ir para o Checkout Seguro →',
      views: 0,
      completions: 0,
      questions: [
        {
          id: `q-${Date.now()}`,
          question: 'Qual é a sua maior dificuldade hoje?',
          subtitle: 'Selecione uma opção abaixo:',
          options: [
            { id: 'opt-1', label: 'Quero resultados rápidos e práticos' },
            { id: 'opt-2', label: 'Preciso de acompanhamento passo a passo' },
          ],
        },
      ],
    };
    const next = [...quizzes, newQuiz];
    persistQuizzes(next, 'Novo Funil de Quiz criado!');
    setSelectedQuizId(newId);
  };

  const handleDeleteQuiz = (id: string) => {
    if (quizzes.length <= 1) return;
    const next = quizzes.filter((q) => q.id !== id);
    persistQuizzes(next, 'Quiz removido.');
    setSelectedQuizId(next[0].id);
  };

  const addQuestion = () => {
    if (!activeQuiz) return;
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: `Pergunta #${activeQuiz.questions.length + 1}`,
      subtitle: 'Escolha uma das alternativas:',
      options: [
        { id: `o-${Date.now()}-1`, label: 'Opção A' },
        { id: `o-${Date.now()}-2`, label: 'Opção B' },
      ],
    };
    updateActiveQuiz({ questions: [...activeQuiz.questions, newQuestion] });
  };

  const updateQuestion = (qId: string, patch: Partial<QuizQuestion>) => {
    if (!activeQuiz) return;
    const nextQuestions = activeQuiz.questions.map((q) => (q.id === qId ? { ...q, ...patch } : q));
    updateActiveQuiz({ questions: nextQuestions });
  };

  const removeQuestion = (qId: string) => {
    if (!activeQuiz || activeQuiz.questions.length <= 1) return;
    updateActiveQuiz({ questions: activeQuiz.questions.filter((q) => q.id !== qId) });
  };

  const copyQuizLink = (quizId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(`${origin}/quiz/${quizId}`);
    setCopiedId(quizId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            Funis Interativos de Alta Conversão
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Construtor de Quiz & Pré-Checkout</h1>
          <p className="text-sm text-[#8b8b9e] mt-0.5">
            Qualifique leads com perguntas rápidas e redirecione automaticamente para o checkout do produto ideal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCreateQuiz}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-bold text-white transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            Novo Quiz
          </button>

          {activeQuiz && (
            <Link
              href={`/quiz/${activeQuiz.id}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
            >
              <ExternalLink className="w-4 h-4" />
              Testar Quiz ao Vivo
            </Link>
          )}
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
        {/* Left column: Quiz Selector & Metrics */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#11111a] border border-white/[0.06] rounded-2xl p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#8b8b9e]">
              Meus Funis de Quiz ({quizzes.length})
            </h2>

            <div className="space-y-2">
              {quizzes.map((quiz) => {
                const isSelected = quiz.id === activeQuiz?.id;
                const convRate = quiz.views > 0 ? Math.round((quiz.completions / quiz.views) * 100) : 0;
                return (
                  <div
                    key={quiz.id}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40'
                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                    }`}
                    onClick={() => setSelectedQuizId(quiz.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-white">{quiz.title}</h3>
                        <p className="text-[11px] text-[#8b8b9e] mt-0.5">
                          {quiz.questions.length} etapas • {convRate}% conclusão
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyQuizLink(quiz.id);
                        }}
                        className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs text-white"
                        title="Copiar link público do Quiz"
                      >
                        {copiedId === quiz.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-[#8b8b9e]" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {activeQuiz && (
            <div className="bg-[#11111a] border border-white/[0.06] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8b8b9e]">
                  Desempenho do Funil
                </span>
                <BarChart3 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#0a0a0f] border border-white/[0.05]">
                  <div className="text-[11px] text-[#8b8b9e]">Visitas Iniciais</div>
                  <div className="text-xl font-extrabold text-white mt-0.5">{activeQuiz.views}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#0a0a0f] border border-white/[0.05]">
                  <div className="text-[11px] text-[#8b8b9e]">Idas ao Checkout</div>
                  <div className="text-xl font-extrabold text-emerald-400 mt-0.5">{activeQuiz.completions}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Active Quiz Editor */}
        {activeQuiz && (
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#11111a] border border-white/[0.06] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Configuração Geral & Destino do Quiz
                </h2>
                {quizzes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteQuiz(activeQuiz.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar Quiz
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="quiz-title" className="block text-xs font-semibold text-white mb-1.5">
                    Nome Interno do Quiz
                  </label>
                  <input
                    id="quiz-title"
                    type="text"
                    value={activeQuiz.title}
                    onChange={(e) => updateActiveQuiz({ title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white"
                  />
                </div>

                <div>
                  <label htmlFor="quiz-product" className="block text-xs font-semibold text-white mb-1.5">
                    Produto de Destino (Checkout Final)
                  </label>
                  <select
                    id="quiz-product"
                    value={activeQuiz.targetProductId}
                    onChange={(e) => updateActiveQuiz({ targetProductId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white"
                  >
                    <option value="">Selecionar produto recomendado...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.price.toLocaleString('pt-MZ')} MT)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="quiz-headline" className="block text-xs font-semibold text-white mb-1.5">
                    Headline Pública do Quiz
                  </label>
                  <input
                    id="quiz-headline"
                    type="text"
                    value={activeQuiz.headline}
                    onChange={(e) => updateActiveQuiz({ headline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white"
                  />
                </div>

                <div>
                  <label htmlFor="quiz-coupon" className="block text-xs font-semibold text-white mb-1.5">
                    Cupom Aplicado Automaticamente (Opcional)
                  </label>
                  <input
                    id="quiz-coupon"
                    type="text"
                    placeholder="Ex: BEMVINDO10"
                    value={activeQuiz.couponCode || ''}
                    onChange={(e) => updateActiveQuiz({ couponCode: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white uppercase font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="quiz-cta" className="block text-xs font-semibold text-white mb-1.5">
                    Texto do Botão Final (CTA)
                  </label>
                  <input
                    id="quiz-cta"
                    type="text"
                    value={activeQuiz.buttonText}
                    onChange={(e) => updateActiveQuiz({ buttonText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeQuiz.collectLeadBeforeRedirect}
                  onChange={(e) => updateActiveQuiz({ collectLeadBeforeRedirect: e.target.checked })}
                  className="rounded border-white/20 text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold text-white">
                    Capturar Nome e WhatsApp antes de redirecionar para o Checkout
                  </div>
                  <div className="text-[11px] text-[#8b8b9e]">
                    Permite recuperar o cliente no WhatsApp caso ele saia antes de concluir o M-Pesa/e-Mola.
                  </div>
                </div>
              </label>
            </div>

            {/* Questions Editor */}
            <div className="bg-[#11111a] border border-white/[0.06] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Etapas & Perguntas do Quiz ({activeQuiz.questions.length})
                </h2>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Pergunta
                </button>
              </div>

              <div className="space-y-4">
                {activeQuiz.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-[#0a0a0f] border border-white/[0.06] space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-400">Etapa #{idx + 1}</span>
                      {activeQuiz.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="text-xs text-rose-400 hover:underline"
                        >
                          Remover etapa
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      aria-label={`Texto da pergunta ${idx + 1}`}
                      value={q.question}
                      onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#11111a] border border-white/[0.08] text-sm font-semibold text-white"
                    />

                    <div className="space-y-2 pl-3 border-l-2 border-emerald-500/30">
                      {q.options.map((opt, oIdx) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <span className="text-xs text-[#8b8b9e] w-5">{oIdx + 1}.</span>
                          <input
                            type="text"
                            aria-label={`Opção ${oIdx + 1} da pergunta ${idx + 1}`}
                            value={opt.label}
                            onChange={(e) => {
                              const nextOpts = q.options.map((item) =>
                                item.id === opt.id ? { ...item, label: e.target.value } : item
                              );
                              updateQuestion(q.id, { options: nextOpts });
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-[#11111a] border border-white/[0.06] text-xs text-white"
                          />
                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() =>
                                updateQuestion(q.id, {
                                  options: q.options.filter((item) => item.id !== opt.id),
                                })
                              }
                              className="text-xs text-[#8b8b9e] hover:text-rose-400 px-1.5"
                              title="Remover opção"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() =>
                          updateQuestion(q.id, {
                            options: [
                              ...q.options,
                              { id: `opt-${Date.now()}`, label: `Nova opção ${q.options.length + 1}` },
                            ],
                          })
                        }
                        className="text-[11px] font-semibold text-emerald-400 hover:underline pt-1"
                      >
                        + Adicionar alternativa
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => persistQuizzes(quizzes)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
                >
                  <Save className="w-4 h-4" />
                  Guardar Funil de Quiz
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
