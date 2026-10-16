import { NextResponse } from 'next/server';
import dbStore from '@/lib/store';

export async function GET() {
  const products = await dbStore.getProducts();
  const orders = await dbStore.getOrders();

  const paidOrders = orders.filter((t) => t.status === 'APPROVED');
  const pendingOrders = orders.filter((t) => t.status === 'PENDING');
  const totalRevenueMzn = paidOrders.reduce((acc, t) => acc + t.amount, 0);

  return NextResponse.json({
    protocol: 'model-context-protocol/1.0',
    server: 'otterfy-mcp-server',
    version: '1.0.0',
    capabilities: [
      'get_store_metrics',
      'list_products',
      'list_recent_orders',
      'get_abandoned_carts',
    ],
    snapshot: {
      currency: 'MZN',
      totalProducts: products.length,
      totalOrders: orders.length,
      paidOrdersCount: paidOrders.length,
      pendingOrdersCount: pendingOrders.length,
      totalRevenueMzn,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        priceMzn: p.price,
        couponsCount: p.checkoutSettings?.coupons?.length || 0,
      })),
      recentOrders: orders.slice(0, 10),
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tool = body?.tool || body?.method || 'get_store_metrics';
    const products = await dbStore.getProducts();
    const orders = await dbStore.getOrders();

    if (tool === 'list_products') {
      return NextResponse.json({ tool, result: products });
    }

    if (tool === 'list_recent_orders') {
      return NextResponse.json({ tool, result: orders.slice(0, 20) });
    }

    if (tool === 'get_abandoned_carts') {
      return NextResponse.json({
        tool,
        result: orders.filter((t) => t.status !== 'APPROVED'),
      });
    }

    const paid = orders.filter((t) => t.status === 'APPROVED');
    return NextResponse.json({
      tool: 'get_store_metrics',
      result: {
        currency: 'MZN',
        totalRevenueMzn: paid.reduce((acc, t) => acc + t.amount, 0),
        paidCount: paid.length,
        totalTransactions: orders.length,
        activeProducts: products.length,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid MCP payload' }, { status: 400 });
  }
}
