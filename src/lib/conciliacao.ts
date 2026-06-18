import type {
  Comprovante,
  LancamentoBancario,
  Conciliacao,
  StatusConciliacao,
} from "@/types/domain";

/**
 * MOTOR DE CONCILIAÇÃO
 * -----------------------------------------------------------------------
 * Responsável por cruzar um comprovante (informado pela equipe, a partir
 * do que o cliente envia) com os lançamentos de Pix que de fato chegaram
 * na conta, conforme retornado pela API do banco.
 *
 * Regras de comparação, em ordem de prioridade:
 *
 * 1. ID da transação E2E (ponta-a-ponta) — se o comprovante tiver esse ID
 *    e ele bater com um lançamento, é o match mais forte possível.
 * 2. Combinação de valor + documento do pagador + janela de tempo — usado
 *    quando o comprovante não trouxe o ID E2E (comum em prints de WhatsApp).
 * 3. Se nada bater, fica "pendente" (ainda pode chegar depois) ou
 *    "divergente" (achou algo parecido, mas com diferenças que merecem
 *    atenção humana).
 */

// Tolerâncias de comparação — ajustáveis conforme a realidade operacional
const TOLERANCIA_VALOR_CENTAVOS = 1; // diferença de até R$ 0,01 é considerada igual (arredondamento)
const JANELA_TEMPO_HORAS = 48; // um comprovante pode ser conciliado com lançamento até 48h de distância

function normalizarDocumento(doc: string): string {
  return doc.replace(/\D/g, "");
}

function diferencaEmReais(a: number, b: number): number {
  return Math.abs(Math.round(a * 100) - Math.round(b * 100)) / 100;
}

function diferencaEmHoras(dataA: string, dataB: string): number {
  const a = new Date(dataA).getTime();
  const b = new Date(dataB).getTime();
  return Math.abs(a - b) / (1000 * 60 * 60);
}

interface ResultadoMatch {
  lancamento: LancamentoBancario | null;
  status: StatusConciliacao;
  motivosDivergencia: string[];
  scoreConfianca: number;
}

/**
 * Tenta encontrar o melhor lançamento bancário correspondente a um comprovante,
 * dentro de uma lista de lançamentos ainda não conciliados.
 */
export function encontrarMelhorMatch(
  comprovante: Comprovante,
  lancamentosDisponiveis: LancamentoBancario[]
): ResultadoMatch {
  // 1. Match forte por ID E2E
  if (comprovante.idTransacaoE2E) {
    const porE2E = lancamentosDisponiveis.find(
      (l) => l.idTransacaoE2E.toLowerCase() === comprovante.idTransacaoE2E!.toLowerCase()
    );
    if (porE2E) {
      const motivos: string[] = [];
      const diffValor = diferencaEmReais(comprovante.valor, porE2E.valor);
      if (diffValor > TOLERANCIA_VALOR_CENTAVOS / 100) {
        motivos.push(
          `Valor do comprovante (R$ ${comprovante.valor.toFixed(2)}) difere do valor recebido (R$ ${porE2E.valor.toFixed(2)})`
        );
      }
      return {
        lancamento: porE2E,
        status: motivos.length > 0 ? "divergente" : "conciliado",
        motivosDivergencia: motivos,
        scoreConfianca: motivos.length > 0 ? 70 : 100,
      };
    }
  }

  // 2. Match por valor + documento + janela de tempo
  const candidatos = lancamentosDisponiveis.filter((l) => {
    const mesmoDocumento =
      normalizarDocumento(l.pagadorDocumento) === normalizarDocumento(comprovante.clienteDocumento);
    const valorProximo = diferencaEmReais(l.valor, comprovante.valor) <= 0.5; // tolerância maior para pré-filtro
    const dentroDaJanela = diferencaEmHoras(l.dataHora, comprovante.dataHora) <= JANELA_TEMPO_HORAS;
    return mesmoDocumento && valorProximo && dentroDaJanela;
  });

  if (candidatos.length === 0) {
    return {
      lancamento: null,
      status: "pendente",
      motivosDivergencia: ["Nenhum lançamento bancário correspondente encontrado até agora."],
      scoreConfianca: 0,
    };
  }

  // Escolhe o candidato com menor diferença de valor e depois menor diferença de tempo
  candidatos.sort((a, b) => {
    const diffValorA = diferencaEmReais(a.valor, comprovante.valor);
    const diffValorB = diferencaEmReais(b.valor, comprovante.valor);
    if (diffValorA !== diffValorB) return diffValorA - diffValorB;
    return diferencaEmHoras(a.dataHora, comprovante.dataHora) - diferencaEmHoras(b.dataHora, comprovante.dataHora);
  });

  const melhor = candidatos[0];
  const motivos: string[] = [];
  const diffValor = diferencaEmReais(melhor.valor, comprovante.valor);

  if (diffValor > TOLERANCIA_VALOR_CENTAVOS / 100) {
    motivos.push(
      `Valor do comprovante (R$ ${comprovante.valor.toFixed(2)}) difere do valor recebido (R$ ${melhor.valor.toFixed(2)})`
    );
  }
  if (!comprovante.idTransacaoE2E) {
    motivos.push("Comprovante sem ID de transação E2E — conciliado por valor, documento e data.");
  }

  let scoreConfianca = 90;
  if (diffValor > 0) scoreConfianca -= 30;
  if (!comprovante.idTransacaoE2E) scoreConfianca -= 10;

  return {
    lancamento: melhor,
    status: diffValor > TOLERANCIA_VALOR_CENTAVOS / 100 ? "divergente" : "conciliado",
    motivosDivergencia: motivos,
    scoreConfianca: Math.max(scoreConfianca, 0),
  };
}

/**
 * Processa uma lista de comprovantes contra uma lista de lançamentos bancários,
 * retornando o resultado completo da conciliação para cada comprovante.
 *
 * Importante: lançamentos já usados em um match não são reutilizados para
 * outro comprovante na mesma rodada, evitando que um único Pix recebido
 * "concilie" com dois comprovantes diferentes por engano.
 */
export function conciliarTodos(
  comprovantes: Comprovante[],
  lancamentos: LancamentoBancario[]
): Conciliacao[] {
  const lancamentosRestantes = [...lancamentos];
  const resultados: Conciliacao[] = [];

  // Comprovantes com ID E2E são processados primeiro (match mais confiável e específico)
  const ordenados = [...comprovantes].sort((a, b) => {
    if (a.idTransacaoE2E && !b.idTransacaoE2E) return -1;
    if (!a.idTransacaoE2E && b.idTransacaoE2E) return 1;
    return 0;
  });

  for (const comprovante of ordenados) {
    const match = encontrarMelhorMatch(comprovante, lancamentosRestantes);

    if (match.lancamento) {
      const idx = lancamentosRestantes.findIndex((l) => l.id === match.lancamento!.id);
      if (idx >= 0) lancamentosRestantes.splice(idx, 1);
    }

    resultados.push({
      id: `conc_${comprovante.id}`,
      comprovante,
      lancamento: match.lancamento,
      status: match.status,
      motivosDivergencia: match.motivosDivergencia,
      conciliadoEm: match.status === "conciliado" ? new Date().toISOString() : null,
      scoreConfianca: match.scoreConfianca,
    });
  }

  return resultados;
}
