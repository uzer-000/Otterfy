'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Lock,
  User,
  Phone,
} from 'lucide-react';
import { DEFAULT_QUIZZES, QUIZ_STORAGE_KEY, QuizFunnel } from '@/app/dashboard/quiz/page';
import { Product } from '@/lib/db';

export default function PublicQuizPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = typeof params?.quizId === 'string' ? params.quizId : '';

  const [quiz, setQuiz] = useState<QuizFunnel>(DEFAULT_QUIZZES[0]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(console.error);

    try {
      const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (saved) {
        const parsed: QuizFunnel[] = JSON.parse(saved);
        const found = parsed.find((q) => q.id === quizId || q.slug === quizId);
        if (found) {
          setQuiz(found);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [quizId]);

  const totalQuestions = quiz.questions.length;
  const currentQuestion = quiz.questions[stepIndex];
  const progressPercent = completed
    ? 100
    : Math.min(95, Math.round(((stepIndex + 1) / (totalQuestions + 1)) * 100));

  const handleSelectOption = (optionLabel: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionLabel }));

    if (stepIndex + 1 < totalQuestions) {
      setStepIndex(stepIndex + 1);
    } else {
      setAnalyzing(true);
      setTimeout(() => {
        setAnalyzing(false);
        setCompleted(true);
      }, 900);
    }
  };

  const handleProceedToCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = quiz.targetProductId || products[0]?.id;
    if (!targetId) {
      router.push('/loja');
      return;
    }
    const query = new URLSearchParams();
    if (quiz.couponCode) query.set('coupon', quiz.couponCode);
    if (leadName.trim()) query.set('name', leadName.trim());
    if (leadPhone.trim()) query.set('phone', leadPhone.trim());
    const qs = query.toString();
    router.push(`/pay/${targetId}${qs ? `?${qs}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-[#07070c] text-white flex flex-col justify-between">
      {/* Top Progress Header */}
      <header className="border-b border-white/[0.06] bg-[#0b0b13]">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#8b8b9e]">
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              {quiz.title}
            </span>
            <span>{progressPercent}% concluído</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Quiz Stage */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="max-w-xl w-full bg-[#11111a] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {analyzing ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto animate-pulse">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white">
                A analisar as suas respostas e preparar a melhor condição...
              </h2>
              <p className="text-xs text-[#8b8b9e]">
                Verificando disponibilidade para pagamento via M-Pesa e e-Mola.
              </p>
            </div>
          ) : !completed && currentQuestion ? (
            <>
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Pergunta {stepIndex + 1} de {totalQuestions}
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
                  {currentQuestion.question}
                </h1>
                {currentQuestion.subtitle && (
                  <p className="text-xs sm:text-sm text-[#8b8b9e]">{currentQuestion.subtitle}</p>
                )}
              </div>

              <div className="space-y-3 pt-2">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.label)}
                    className="w-full text-left p-4 rounded-2xl bg-[#0a0a0f] hover:bg-emerald-500/10 border border-white/[0.08] hover:border-emerald-500/40 transition-all flex items-center justify-between gap-3 group"
                  >
                    <span className="text-sm font-semibold text-white group-hover:text-emerald-300">
                      {opt.label}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#8b8b9e] group-hover:text-emerald-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <form onSubmit={handleProceedToCheckout} className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Diagnóstico Concluído com Sucesso!
              </div>

              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  {quiz.headline}
                </h1>
                <p className="text-xs sm:text-sm text-[#8b8b9e] leading-relaxed">
                  {quiz.description}
                </p>
              </div>

              {quiz.couponCode && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 flex items-center justify-between">
                  <span>Cupom desbloqueado automaticamente:</span>
                  <span className="font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-slate-950">
                    {quiz.couponCode}
                  </span>
                </div>
              )}

              {quiz.collectLeadBeforeRedirect && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label htmlFor="quiz-lead-name" className="block text-xs font-semibold text-white mb-1">
                      Seu Nome Completo
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#8b8b9e] absolute left-3.5 top-3" />
                      <input
                        id="quiz-lead-name"
                        type="text"
                        required
                        placeholder="Ex: João Mondlane"
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="quiz-lead-phone" className="block text-xs font-semibold text-white mb-1">
                      Seu WhatsApp / Telemóvel (M-Pesa ou e-Mola)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#8b8b9e] absolute left-3.5 top-3" />
                      <input
                        id="quiz-lead-phone"
                        type="tel"
                        required
                        placeholder="Ex: 84 123 4567"
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                {quiz.buttonText || 'Desbloquear Oferta Recomendada →'}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="py-5 text-center text-xs text-[#8b8b9e] border-t border-white/[0.05]">
        <span className="inline-flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          Ambiente Seguro Otterfy • Dados protegidos
        </span>
      </footer>
    </div>
  );
}
