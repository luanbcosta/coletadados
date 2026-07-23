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
    if (data.docCarteiraIdoso) docs.push("Carteira do Idoso");
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

    // Ajustar campos compostos (Outros)
    if (data.genero === "Outros" && data.generoOutros) data.genero = data.generoOutros;
    if (data.casa === "Alugada" && data.valorAluguel) data.casa = "Alugada, R$ " + data.valorAluguel;
    if (data.tipoHabitacao === "Misto" && data.tipoHabitacaoOutro) data.tipoHabitacao = data.tipoHabitacaoOutro;
    if (data.energiaEletrica === "Outros" && data.energiaEletricaOutro) data.energiaEletrica = data.energiaEletricaOutro;
    if (data.abastecimentoAgua === "Outros" && data.abastecimentoAguaOutro) data.abastecimentoAgua = data.abastecimentoAguaOutro;
    if (data.saneamentoBasico === "Outros" && data.saneamentoBasicoOutro) data.saneamentoBasico = data.saneamentoBasicoOutro;
    if (data.transporte === "Outros" && data.transporteOutros) data.transporte = data.transporteOutros;
    if (data.propriedadeInternet) data.tipoConexaoInternet = (data.tipoConexaoInternet || "") + " (" + data.propriedadeInternet + ")";
    if (data.escolaridadeStatus) data.escolaridade = data.escolaridadeStatus + (data.escolaridadeAno ? " - Ano " + data.escolaridadeAno : "");

    // Filtrar estritamente apenas os campos que existem no schema do Prisma
    const validKeys = [
      "nucleoRegional", "povoado", "nome", "nomeSocial", "filiacao", "dataNascimento", "idade",
      "naturalidade", "genero", "racaEtnia", "estadoCivil", "possuiDeficiencia",
      "qualDeficiencia", "ilhaPovoado", "endereco", "telefone", "possuiDocumentacao",
      "documentosQuePossui", "outroDocumento", "numeroRg", "numeroCpf", "nis",
      "matriculaCertidao", "dataRegistroCertidao", "livroCertidao", "folhaCertidao",
      "termoCertidao", "tempoResidePovoado", "casa", "casaCedidaPorQuem",
      "tipoHabitacao", "quantosComodosEDescricao", "energiaEletrica",
      "abastecimentoAgua", "saneamentoBasico", "possuiConexaoInternet",
      "tipoConexaoInternet", "transporte", "trabalhaAtualmente", "funcao",
      "localTrabalho", "modalidadeTrabalho", "seAutonomoFormalInformal",
      "remuneracao", "exerceTrabalhoDomesticoDomicilio", "recebeBeneficio",
      "quaisBeneficios", "escolaridade", "escolaridadePossui",
      "quaisEscolasServemIlhaPovoados", "despesasEnergiaEletrica", "despesasAgua",
      "despesasAlimentacao", "despesasOutros", "possuiFilhos", "quantosFilhos",
      "idadeFilhos", "possuiProblemaSaude", "qualProblemaSaude", "fazTratamento",
      "fazUsoMedicacao", "quaisMedicacoes", "medicacaoUsoContinuo",
      "quaisMedicacoesUsoContinuo", "qualPostoSaudeFrequenta",
      "possuiPostoSaude", "possuiAgenteSaude", "nomeAgenteSaude",
      "demandaDefensoria", "demandasPosteriores", "orgaoEncaminhado"
    ];

    const cleanData: Record<string, any> = {};
    for (const key of validKeys) {
      if (data[key] !== undefined && data[key] !== null) {
        // Garantir que idadeFilhos e quantosFilhos e remuneracao sejam string
        if (["idadeFilhos", "quantosFilhos", "remuneracao", "idade", "numeroRg", "numeroCpf", "nis", "matriculaCertidao", "livroCertidao", "folhaCertidao", "termoCertidao"].includes(key) && typeof data[key] !== 'string') {
          cleanData[key] = String(data[key]);
        } else {
          cleanData[key] = data[key];
        }
      }
    }
    
    const assistido = await prisma.assistido.create({
      data: cleanData,
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID não fornecido' }, { status: 400 });
    }
    
    const prisma = getPrisma(request);
    
    await prisma.assistido.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Erro ao deletar assistido:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar o registro' },
      { status: 500 }
    );
  }
}
