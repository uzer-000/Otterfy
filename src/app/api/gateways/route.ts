import { NextResponse } from 'next/server';
import { getAllGateways, saveGatewayConfig } from '@/services/payment/gatewayManager';

export async function GET() {
  try {
    const list = getAllGateways();
    // Return with masked secrets for safety
    const safeList = list.map((g) => {
      const safeCreds: Record<string, string> = {};
      for (const [k, v] of Object.entries(g.credentials || {})) {
        if (k.toLowerCase().includes('secret') || k.toLowerCase().includes('key') || k.toLowerCase().includes('token')) {
          safeCreds[k] = v && v.length > 8 ? `${v.substring(0, 4)}...${v.substring(v.length - 4)}` : (v ? '••••••••' : '');
        } else {
          safeCreds[k] = v;
        }
      }
      return {
        ...g,
        credentials: safeCreds,
      };
    });

    return NextResponse.json({ gateways: safeList });
  } catch (err: any) {
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
  } catch (err: any) {
    console.error('Error updating gateway:', err);
    return NextResponse.json({ error: 'Erro ao salvar gateway.' }, { status: 500 });
  }
}
