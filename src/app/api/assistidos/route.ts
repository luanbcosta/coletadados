import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

export const runtime = 'edge';

function getPrisma(request: Request) {
  // Extract the DB binding from the Cloudflare edge context
  // next-on-pages allows us to get environment variables globally or from request context
  const DB = (process.env as any).DB || (request as any).cf?.env?.DB;
  
  if (!DB) {
    const { getRequestContext } = require('@cloudflare/next-on-pages');
    const dbBinding = getRequestContext().env.DB;
    const adapter = new PrismaD1(dbBinding);
    return new PrismaClient({ adapter });
  }

  const adapter = new PrismaD1(DB);
  return new PrismaClient({ adapter });
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const prisma = getPrisma(request);
    
    const assistido = await prisma.assistido.create({
      data: data,
    });
    
    return NextResponse.json({ success: true, assistido }, { status: 201 });
  } catch (error) {
    console.error('Erro ao salvar assistido:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar os dados' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const prisma = getPrisma(request);
    const assistidos = await prisma.assistido.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, assistidos }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar assistidos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar os dados' },
      { status: 500 }
    );
  }
}
