import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { obterComprovantes, adicionarComprovante } from "@/lib/store";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });

  const comprovantes = await obterComprovantes();
  return NextResponse.json({ comprovantes });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });

  const body = await request.json();
  const { clienteNome, clienteDocumento, valor, dataHora, idTransacaoE2E, observacoes, criadoPor } = body;

  if (!clienteNome || !clienteDocumento || !valor || !dataHora) {
    return NextResponse.json(
      { erro: "Campos obrigatórios: clienteNome, clienteDocumento, valor, dataHora." },
      { status: 400 }
    );
  }

  const novoComprovante = await adicionarComprovante({
    clienteNome,
    clienteDocumento,
    valor: Number(valor),
    dataHora,
    idTransacaoE2E: idTransacaoE2E || undefined,
    observacoes: observacoes || undefined,
    criadoPor: criadoPor || "Usuário",
  });

  return NextResponse.json({ comprovante: novoComprovante }, { status: 201 });
}
