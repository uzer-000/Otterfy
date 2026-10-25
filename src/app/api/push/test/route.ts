import { NextResponse } from 'next/server';
import { getPushSubscriptions } from '@/services/tracking/webhookConfig';
import { dispatchSaleWebPush } from '@/services/tracking/dispatcher';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const subs = await getPushSubscriptions();
    if (subs.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum dispositivo registrado ainda. Abra a dashboard no telemóvel e clique em Ativar Notificações.',
        subscribedCount: 0,
      }, { status: 400 });
    }

    const testOrder = {
      id: `TEST-${Date.now().toString(36).toUpperCase()}`,
      amount: 197,
      customerName: 'Cliente Teste',
      customerPhone: '+258840000000',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
    };

    await dispatchSaleWebPush(testOrder, { name: 'Produto Teste' });

    return NextResponse.json({
      success: true,
      message: `Notificação enviada com sucesso para ${subs.length} dispositivo(s)!`,
      subscribedCount: subs.length,
    });
  } catch (err: any) {
    console.error('[Push Test Error]:', err);
    return NextResponse.json({
      success: false,
      error: err?.message || 'Erro ao enviar notificação de teste.',
    }, { status: 500 });
  }
}
