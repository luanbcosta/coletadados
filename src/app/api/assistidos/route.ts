import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

function getPrisma(request: Request) {
  // Extract the DB binding from the Cloudflare edge context
  const DB = (process.env as any).DB || (request as any).cf?.env?.DB;
  
  if (!DB) {
    const dbBinding = getRequestContext().env.DB;
    const adapter = new PrismaD1(dbBinding);
    return new PrismaClient({ adapter });
  }

  const adapter = new PrismaD1(DB);
  return new PrismaClient({ adapter });
}

export async function POST(request: Request) {
  try {
    let data = await request.json();
    const prisma = getPrisma(request);
    
    // Tratamento de Documentos
    const docs = [];
    if (data.docRG) docs.push("RG");
    if (data.docCPF) docs.push("CPF");
    if (data.docCNH) docs.push("CNH");
    if (data.docCartaoCidadao) docs.push("Cartão Cidadão");
    if (data.docCTPS) docs.push("CTPS");
    if (data.docSUS) docs.push("SUS");
    if (data.docTitulo) docs.push("Título de Eleitor");
    if (data.docCertNasc) docs.push("Certidão de Nascimento");
    if (data.docCertCasam) docs.push("Certidão de Casamento");
    if (docs.length > 0) data.documentosQuePossui = docs.join(", ");
    
    // Tratamento de Benefícios
    const bens = [];
    if (data.benBolsaFamilia) bens.push("Bolsa Família");
    if (data.benBPC) bens.push("BPC");
    if (data.benOutros) bens.push("Outros");
    if (bens.length > 0) data.quaisBeneficios = bens.join(", ") + (data.quaisBeneficios ? " - " + data.quaisBeneficios : "");
    
    // Tratamento de Despesas
    if (data.despEnergia) data.despesasEnergiaEletrica = "Sim";
    if (data.despAgua) data.despesasAgua = "Sim";

    // Remover campos extras que não existem no banco para evitar erro do Prisma
    const extraFields = [
      "docRG", "docCPF", "docCNH", "docCartaoCidadao", "docCTPS", "docSUS", "docTitulo", 
      "docCertNasc", "docCertCasam", "benBolsaFamilia", "benBPC", "benOutros", 
      "despEnergia", "despAgua"
    ];
    extraFields.forEach(field => delete data[field]);
    
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
