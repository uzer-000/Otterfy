import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbStore from '@/lib/store';

const createProductSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  price: z.number().positive('O preço deve ser maior que zero.'),
  description: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal('')),
  category: z.string().optional(),
  currency: z.string().optional(),
  contentDeliveryType: z.string().optional(),
  contentUrl: z.string().optional(),
  materials: z.array(z.object({
    name: z.string(),
    type: z.string(),
    url: z.string().optional()
  })).optional(),
  paymentMethods: z.array(z.string()).optional(),
  allowAffiliation: z.boolean().optional(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const products = await dbStore.getProducts(status);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = createProductSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || 'Dados inválidos.' }, { status: 400 });
    }

    const product = await dbStore.createProduct({
      name: result.data.name,
      price: result.data.price,
      description: result.data.description,
      imageUrl: result.data.imageUrl || undefined,
      category: result.data.category,
      currency: result.data.currency,
      contentDeliveryType: result.data.contentDeliveryType,
      contentUrl: result.data.contentUrl,
      materials: result.data.materials,
      paymentMethods: result.data.paymentMethods,
      allowAffiliation: result.data.allowAffiliation,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
