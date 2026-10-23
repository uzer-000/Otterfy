import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { ok: false, error: 'Disparo de vendas de teste desativado.' },
    { status: 403 }
  );
}
