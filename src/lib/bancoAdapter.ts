import type { LancamentoBancario } from "@/types/domain";

/**
 * ADAPTER DO BANCO
 * -----------------------------------------------------------------------
 * Esta é a camada que isola o resto do sistema de "como" os lançamentos
 * bancários são obtidos. Hoje ela retorna dados fictícios (mock), para que
 * o restante do app (telas, motor de conciliação) possa ser construído e
 * testado sem depender da homologação da API do banco.
 *
 * QUANDO A API REAL ESTIVER DISPONÍVEL (Open Finance Itaú/Bradesco):
 * Substitua a implementação de `buscarLancamentosPix` por uma chamada HTTP
 * real, mantendo a mesma assinatura de função e o mesmo formato de retorno
 * (LancamentoBancario[]). Nenhuma outra parte do sistema precisa mudar.
 *
 * Pontos que a integração real vai precisar resolver (deixados como TODO):
 * - Autenticação mTLS / certificado digital exigido pelo Open Finance
 * - Renovação de token OAuth2
 * - Paginação de extrato (bancos tradicionais paginam por período)
 * - Mapeamento do payload específico do banco para o tipo LancamentoBancario
 */

export interface BuscarLancamentosParams {
  dataInicio: string; // ISO 8601
  dataFim: string; // ISO 8601
}

export interface BancoAdapter {
  buscarLancamentosPix(params: BuscarLancamentosParams): Promise<LancamentoBancario[]>;
}

// ---------------------------------------------------------------------
// Implementação MOCK — dados fictícios para desenvolvimento e testes
// ---------------------------------------------------------------------

const NOMES_FICTICIOS = [
  "João Pedro Almeida",
  "Mariana Costa Silva",
  "Rafael Souza Lima",
  "Beatriz Fernandes",
  "Lucas Martins Oliveira",
  "Camila Rodrigues",
  "Gustavo Henrique Pereira",
  "Fernanda Albuquerque",
];

function gerarDocumentoFicticio(seed: number): string {
  const base = String(10000000000 + seed * 7919).padStart(11, "0").slice(0, 11);
  return base;
}

function gerarIdE2EFicticio(seed: number, data: Date): string {
  const yyyymmdd = data.toISOString().slice(0, 10).replace(/-/g, "");
  return `E${String(seed).padStart(8, "0")}${yyyymmdd}${String(seed * 13).padStart(6, "0")}`;
}

/**
 * Gera uma lista de lançamentos fictícios para simular o extrato de Pix
 * recebido pelo banco. Os valores e datas variam de forma determinística
 * (baseado em seed) para que o comportamento seja consistente entre execuções.
 */
function gerarLancamentosFicticios(params: BuscarLancamentosParams): LancamentoBancario[] {
  const inicio = new Date(params.dataInicio).getTime();
  const fim = new Date(params.dataFim).getTime();
  const quantidade = 9;
  const lancamentos: LancamentoBancario[] = [];

  for (let i = 0; i < quantidade; i++) {
    const proporcao = quantidade === 1 ? 0 : i / (quantidade - 1);
    const timestamp = inicio + proporcao * (fim - inicio);
    const data = new Date(timestamp);
    const nome = NOMES_FICTICIOS[i % NOMES_FICTICIOS.length];
    const valor = Number((150 + ((i * 137) % 900) + 0.9).toFixed(2));

    lancamentos.push({
      id: `lanc_${i + 1}`,
      pagadorNome: nome,
      pagadorDocumento: gerarDocumentoFicticio(i + 1),
      valor,
      dataHora: data.toISOString(),
      idTransacaoE2E: gerarIdE2EFicticio(i + 1, data),
      contaDestino: "Conta Corrente •••• 4521",
    });
  }

  return lancamentos;
}

export const bancoMockAdapter: BancoAdapter = {
  async buscarLancamentosPix(params: BuscarLancamentosParams) {
    // Simula latência de rede de uma API real
    await new Promise((resolve) => setTimeout(resolve, 300));
    return gerarLancamentosFicticios(params);
  },
};

// ---------------------------------------------------------------------
// Ponto único de obtenção do adapter ativo.
// Quando a API real estiver pronta, troque a constante abaixo.
// ---------------------------------------------------------------------
export function obterBancoAdapter(): BancoAdapter {
  return bancoMockAdapter;
}
