import { NextResponse } from 'next/server';
import { getAllGatewaysAsync, saveGatewayConfig } from '@/services/payment/gatewayManager';

export async function GET() {
  try {
    const list = await getAllGatewaysAsync();
    return NextResponse.json({ gateways: list });
  } catch (err: unknown) {
    console.error('Error fetching gateways:', err);
    return NextResponse.json({ error: 'Erro ao carregar gateways.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, status, environment, credentials } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do gateway é obrigatório.' }, { status: 400 });
    }

    const updated = saveGatewayConfig(id, {
      status,
      environment,
      credentials,
    });

    return NextResponse.json({
      success: true,
      message: `Configuração do gateway ${id} salva com sucesso.`,
      gateways: updated,
    });
  } catch (err: unknown) {
    console.error('Error updating gateway:', err);
    return NextResponse.json({ error: 'Erro ao salvar gateway.' }, { status: 500 });
  }
}
