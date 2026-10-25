import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbStore from '@/lib/store';
import { auth } from '@/lib/auth';
import { getAdminCloudState, isAdminEmail } from '@/lib/adminState';

const updateProductSchema = z.object({
  name: z.string().trim().min(1, 'O nome é obrigatório.').optional(),
  price: z.number().positive('O preço deve ser maior que zero.').optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal('')),
  category: z.string().optional(),
  currency: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  approvalStatus: z.string().optional(),
  zenofyProductId: z.string().optional(),
  contentDeliveryType: z.string().optional(),
  contentUrl: z.string().optional(),
  allowAffiliation: z.boolean().optional(),
  paymentMethods: z.array(z.string()).optional(),
  materials: z.array(z.object({
    name: z.string(),
    type: z.string(),
    url: z.string().optional(),
  })).optional(),
  tracking: z.object({
    metaPixelId: z.string().optional(),
    metaApiToken: z.string().optional(),
    tiktokPixelId: z.string().optional(),
    tiktokAccessToken: z.string().optional(),
    googleAnalyticsId: z.string().optional(),
    googleAdsId: z.string().optional(),
    googleAdsLabel: z.string().optional(),
    utmifyPixelId: z.string().optional(),
    utmifyToken: z.string().optional(),
    gtmId: z.string().optional(),
  }).passthrough().optional(),
  checkoutSettings: z.object({
    zenofyProductId: z.string().optional(),
    coupons: z.array(z.object({
      code: z.string(),
      discountPercent: z.number(),
    }).passthrough()).optional(),
    orderBump: z.object({
      enabled: z.boolean(),
      title: z.string(),
      price: z.number(),
      description: z.string().optional(),
      productId: z.string().optional(),
    }).passthrough().optional(),
    extraOffers: z.array(z.object({
      id: z.string().optional(),
      productId: z.string().optional(),
      title: z.string(),
      price: z.number(),
      description: z.string().optional(),
    }).passthrough()).optional(),
    postPurchase: z.object({
      upsellUrl: z.string().optional(),
      downsellUrl: z.string().optional(),
    }).passthrough().optional(),
    upsellUrl: z.string().optional(),
    downsellUrl: z.string().optional(),
    customCheckout: z.object({
      enabled: z.boolean().optional(),
      themeColor: z.string().optional(),
      guaranteeDays: z.number().optional(),
      urgencyTimer: z.boolean().optional(),
      timerMinutes: z.number().optional(),
      timerText: z.string().optional(),
      bannerUrl: z.string().optional().or(z.literal('')),
      zenofyProductId: z.string().optional(),
    }).passthrough().optional(),
    whatsappSupport: z.object({
      enabled: z.boolean(),
      phone: z.string(),
      message: z.string().optional(),
    }).passthrough().optional(),
  }).passthrough().optional(),
  automation: z.object({
    webhookUrl: z.string().optional(),
    webhookEvents: z.array(z.string()).optional(),
    cartRecoveryEmail: z.boolean().optional(),
    cartRecoveryWhatsapp: z.boolean().optional(),
  }).passthrough().optional(),
}).passthrough();

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await dbStore.getProductById(id);

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(product, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const result = updateProductSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || 'Dados inválidos.' }, { status: 400 });
    }

    const session = await auth();
    const isAdmin = isAdminEmail(session?.user?.email);
    const adminState = await getAdminCloudState();
    const modRecord = adminState.products[id];

    const payload = { ...result.data };
    if (!isAdmin && modRecord && (modRecord.status === 'BLOCKED_BLACK' || modRecord.status === 'REJECTED')) {
      payload.status = 'INACTIVE';
    }

    const updated = await dbStore.updateProduct(id, payload);

    if (!updated) {
      return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await dbStore.deleteProduct(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Produto eliminado com sucesso.' });
  } catch (error) {
    console.error('Erro ao eliminar produto:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
