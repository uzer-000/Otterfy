import { NextResponse } from 'next/server';
import dbStore from '@/lib/store';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const allOrders = await dbStore.getOrders({ status, startDate, endDate });

    const total = allOrders.length;
    const skip = (page - 1) * limit;
    const paginatedOrders = allOrders.slice(skip, skip + limit);

    return NextResponse.json({
      data: paginatedOrders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      }
    });
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
