import { NextResponse } from 'next/server';
import {
  getAllIntegrations,
  saveIntegrationConfig,
  getWebhookLogs,
} from '@/services/tracking/webhookConfig';

export async function GET(req: Request) {
  try {
    const integrations = getAllIntegrations();
    const logs = getWebhookLogs(30);

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

    return NextResponse.json({
      integrations,
      logs,
      incomingEndpoints: {
        zenofy: `${baseUrl}/api/webhooks/zenofy`,
        e2payment: `${baseUrl}/api/webhooks/e2payment`,
        escalepay: `${baseUrl}/api/webhooks/escalepay`,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/webhooks/config:', err);
    return NextResponse.json({ error: 'Erro ao carregar configurações de webhook.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, status, fields, events } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da integração é obrigatório.' }, { status: 400 });
    }

    const updated = saveIntegrationConfig(id, {
      status,
      fields,
      events,
    });

    return NextResponse.json({
      success: true,
      message: `Configuração de ${id} salva com sucesso.`,
      integrations: updated,
    });
  } catch (err: any) {
    console.error('Error in POST /api/webhooks/config:', err);
    return NextResponse.json({ error: 'Erro ao salvar configuração de webhook.' }, { status: 500 });
  }
}
