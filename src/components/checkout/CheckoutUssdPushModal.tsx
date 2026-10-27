'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatMZN } from '@/lib/utils';

interface CheckoutUssdPushModalProps {
  isOpen: boolean;
  orderId: string;
  customerPhone: string;
  totalAmount: number;
  paymentMethod: 'MPESA' | 'EMOLA';
  upsellUrl?: string;
  checkoutUrl?: string;
  onClose: () => void;
  onSuccess: (orderId: string, redirectUrl?: string) => void;
}

export default function CheckoutUssdPushModal({
  isOpen,
  orderId,
  customerPhone,
  totalAmount,
  paymentMethod,
  upsellUrl,
  checkoutUrl,
  onClose,
  onSuccess,
}: CheckoutUssdPushModalProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [status, setStatus] = useState<'waiting' | 'approved' | 'expired'>('waiting');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const triggeredOrderRef = React.useRef<string | null>(null);

  const triggerPhoneUssdPush = React.useCallback(
    async (targetOrderId: string) => {
      try {
        const res = await fetch('/api/checkout/ussd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: targetOrderId }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'APPROVED') {
          setStatus('approved');
          setTimeout(() => {
            onSuccess(targetOrderId, data.upsellUrl || upsellUrl);
          }, 1500);
        }
      } catch {
        // Polling /api/checkout/status continues in background
      }
    },
    [onSuccess, upsellUrl]
  );

  useEffect(() => {
    if (!isOpen || !orderId) {
      triggeredOrderRef.current = null;
      return;
    }
    if (triggeredOrderRef.current === orderId) return;
    triggeredOrderRef.current = orderId;
    setTimeLeft(60);
    setStatus('waiting');
    void triggerPhoneUssdPush(orderId);
  }, [isOpen, orderId, triggerPhoneUssdPush]);

  const isMpesa = paymentMethod === 'MPESA';
  const brandName = isMpesa ? 'M-Pesa' : 'e-Mola';
  const brandColor = isMpesa ? '#E60000' : '#FF6600';
  const logoSrc = isMpesa ? '/gateways/mpesa.png' : '/gateways/emola.png';

  // Format phone for display (e.g. +258 84 123 4567)
  const formattedPhone = React.useMemo(() => {
    const raw = customerPhone.replace(/\D/g, '');
    const clean = raw.startsWith('258') ? raw.slice(3) : raw;
    if (clean.length === 9) {
      return `+258 ${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5)}`;
    }
    return customerPhone;
  }, [customerPhone]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || status !== 'waiting') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, status]);

  // Polling /api/checkout/status every 2.5s to detect PIN authorization in real-time
  useEffect(() => {
    if (!isOpen || status !== 'waiting' || !orderId) return;

    let isSubscribed = true;

    const checkOrderStatus = async () => {
      try {
        const res = await fetch(`/api/checkout/status?ref=${encodeURIComponent(orderId)}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;

        const data = await res.json();
        if (data.status === 'APPROVED') {
          if (!isSubscribed) return;
          setStatus('approved');

          // Trigger phone vibration if available
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            try { navigator.vibrate([200, 100, 300]); } catch {}
          }

          // Short celebration before redirecting to member area / receipt
          setTimeout(() => {
            const redirectTarget = data.upsellUrl || upsellUrl;
            onSuccess(orderId, redirectTarget);
          }, 1800);
        }
      } catch {
        // Silently retry on next poll
      }
    };

    const interval = setInterval(checkOrderStatus, 2500);
    // Initial immediate check after 2 seconds
    const timeout = setTimeout(checkOrderStatus, 2000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isOpen, status, orderId, upsellUrl, onSuccess]);

  const handleManualCheck = async () => {
    setResending(true);
    setResendMessage('A verificar operadora...');
    try {
      const res = await fetch(`/api/checkout/status?ref=${encodeURIComponent(orderId)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.status === 'APPROVED') {
        setStatus('approved');
        setTimeout(() => {
          onSuccess(orderId, data.upsellUrl || upsellUrl);
        }, 1500);
        return;
      }
      setResendMessage('Ainda aguardando inserção do PIN no seu telemóvel.');
    } catch {
      setResendMessage('Erro de conexão ao verificar. Tente novamente.');
    } finally {
      setTimeout(() => {
        setResending(false);
        setResendMessage(null);
      }, 3000);
    }
  };

  const handleRestartTimer = () => {
    setTimeLeft(60);
    setStatus('waiting');
    setResendMessage('Novo pedido USSD enviado! Verifique o ecrã do seu telemóvel.');
    if (orderId) {
      void triggerPhoneUssdPush(orderId);
    }
    setTimeout(() => setResendMessage(null), 3500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Confirmação de Pagamento ${brandName}`}
    >
      <div
        className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200"
        style={{ backgroundColor: '#FFFFFF', color: '#0F172A' }}
      >
        {/* Subtle accent bar at top */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: brandColor }}
        />

        {status === 'approved' ? (
          // =========================================================================
          // STATE: APPROVED / SUCESSO CONFIRMADO
          // =========================================================================
          <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-xl shadow-emerald-500/20">
              <svg className="w-10 h-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                PIN Confirmado • Pagamento Aprovado!
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                Transação Concluída com Sucesso!
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                O seu pagamento de <strong className="text-emerald-600">{formatMZN(totalAmount)}</strong> foi recebido. Estamos a preparar o seu acesso...
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2 text-xs font-semibold text-slate-500">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>A redirecionar para a entrega imediata...</span>
            </div>
          </div>
        ) : (
          // =========================================================================
          // STATE: WAITING FOR PIN ON PHONE
          // =========================================================================
          <div className="space-y-5">
            {/* Header com Logo e Valor */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl bg-white shadow-xs border p-0.5 flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ borderColor: brandColor }}
                >
                  <Image
                    src={logoSrc}
                    alt={brandName}
                    width={36}
                    height={36}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                    Autorização {brandName}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pedido de Pagamento USSD Push
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Total
                </span>
                <span className="text-base font-black text-[#047857]">
                  {formatMZN(totalAmount)}
                </span>
              </div>
            </div>

            {/* Ilustração Visual do Smartphone com Notificação Pulsante */}
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200/90 flex items-center gap-4">
              {/* Phone graphic with pulsating notification icon */}
              <div className="relative shrink-0 otter-keep-colors">
                <div className="otter-keep-colors w-14 h-20 rounded-2xl bg-slate-900 border-2 border-slate-700 p-1 flex flex-col items-center justify-between shadow-lg">
                  <div className="w-4 h-1 rounded-full bg-slate-700" />
                  {/* Screen message */}
                  <div className="w-full rounded bg-emerald-950/80 p-1 text-[8px] font-mono text-emerald-400 text-center border border-emerald-500/40 leading-none">
                    PIN?
                  </div>
                  <div className="w-3 h-3 rounded-full border border-slate-700 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  </div>
                </div>

                {/* Pulsing ring around phone */}
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full animate-ping opacity-75"
                  style={{ backgroundColor: brandColor }}
                />
                <div
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold shadow-md"
                  style={{ backgroundColor: brandColor }}
                >
                  🔔
                </div>
              </div>

              {/* Informação do Destino */}
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/70 text-[#047857] font-mono text-[10px] font-bold mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Aguardando seu PIN...</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Olhe para o seu telemóvel
                </h4>
                <p className="text-xs font-mono font-bold text-slate-700 mt-0.5 truncate">
                  {formattedPhone}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Uma mensagem de autorização da {isMpesa ? 'Vodacom' : 'Movitel'} acabou de ser enviada ao seu ecrã.
                </p>
              </div>
            </div>

            {/* 3 Passos Simples */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50/70 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-violet-600/20 text-violet-700 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-slate-700">
                  Desbloqueie o ecrã do seu telemóvel e verifique a mensagem pop-up.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50/70 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-violet-600/20 text-violet-700 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-slate-700">
                  Insira o seu <strong>PIN secreto de 4 dígitos</strong> do {brandName} para autorizar os {formatMZN(totalAmount)}.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50/70 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-emerald-600/20 text-emerald-700 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-slate-700">
                  Assim que confirmar no telemóvel, esta tela liberará o seu acesso automaticamente!
                </p>
              </div>
            </div>

            {/* Cronômetro Regressivo & Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Tempo restante para responder:</span>
                <span className={`font-mono font-bold ${timeLeft < 15 ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>
                  00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}s
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-1000 rounded-full"
                  style={{
                    width: `${(timeLeft / 60) * 100}%`,
                    backgroundColor: timeLeft < 15 ? '#EF4444' : brandColor,
                  }}
                />
              </div>
            </div>

            {resendMessage && (
              <p className="text-xs font-semibold text-center text-violet-600 animate-fadeIn">
                {resendMessage}
              </p>
            )}

            {/* Ações de Suporte e Reinício */}
            <div className="pt-2 flex flex-col gap-2">
              {status === 'expired' ? (
                <button
                  type="button"
                  onClick={handleRestartTimer}
                  className="otter-keep-colors w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  <span className="text-white">Tempo Expirado — Tentar Novamente</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={resending}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {resending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                      <span>A verificar pagamento...</span>
                    </>
                  ) : (
                    <>
                      <span>Já inseri o meu PIN (Verificar Agora)</span>
                    </>
                  )}
                </button>
              )}

              {checkoutUrl && /^https?:\/\//i.test(checkoutUrl) && (
                <a
                  href={checkoutUrl}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 text-center shadow-md shadow-emerald-600/20"
                >
                  <span>Não recebeu o pop-up? Abrir tela oficial para colocar PIN</span>
                  <span aria-hidden="true">↗</span>
                </a>
              )}

              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-800 py-1 transition-colors cursor-pointer text-center underline"
              >
                Corrigir número de telemóvel ou cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
