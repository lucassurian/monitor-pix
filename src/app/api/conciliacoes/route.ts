import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { obterComprovantes } from "@/lib/store";
import { obterBancoAdapter } from "@/lib/bancoAdapter";
import { conciliarTodos } from "@/lib/conciliacao";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });

  const comprovantes = obterComprovantes();

  // Busca lançamentos dos últimos 7 dias — janela suficiente para cobrir
  // o atraso típico entre o pagamento e o cadastro do comprovante.
  const dataFim = new Date();
  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - 7);

  const banco = obterBancoAdapter();
  const lancamentos = await banco.buscarLancamentosPix({
    dataInicio: dataInicio.toISOString(),
    dataFim: dataFim.toISOString(),
  });

  const conciliacoes = conciliarTodos(comprovantes, lancamentos);

  const resumo = {
    total: conciliacoes.length,
    conciliados: conciliacoes.filter((c) => c.status === "conciliado").length,
    pendentes: conciliacoes.filter((c) => c.status === "pendente").length,
    divergentes: conciliacoes.filter((c) => c.status === "divergente").length,
  };

  return NextResponse.json({ conciliacoes, resumo, totalLancamentosBanco: lancamentos.length });
}
