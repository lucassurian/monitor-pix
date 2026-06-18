import type { Comprovante } from "@/types/domain";

/**
 * STORE EM MEMÓRIA (placeholder de banco de dados)
 * -----------------------------------------------------------------------
 * Por enquanto, os comprovantes cadastrados pela equipe ficam guardados
 * em memória no servidor (reiniciam quando o servidor reinicia). Isso é
 * propositalmente simples: serve para validar as telas e o motor de
 * conciliação antes de conectar um banco de dados real (Postgres).
 *
 * Quando formos plugar o banco de dados, esta função `obterComprovantes`,
 * `adicionarComprovante` e `removerComprovante` serão substituídas por
 * chamadas reais (ex: via Prisma), mantendo a mesma assinatura para não
 * impactar as telas que já consomem esses dados.
 */

let comprovantesSeed: Comprovante[] = [
  {
    id: "comp_1",
    clienteNome: "João Pedro Almeida",
    clienteDocumento: "10000000007",
    valor: 287.90,
    dataHora: diasAtras(2),
    idTransacaoE2E: "E000000012026061500000013",
    observacoes: "Cliente enviou print pelo WhatsApp",
    criadoEm: diasAtras(2),
    criadoPor: "Ana (Financeiro)",
  },
  {
    id: "comp_2",
    clienteNome: "Mariana Costa Silva",
    clienteDocumento: "10000000014",
    valor: 424.90,
    dataHora: diasAtras(1),
    observacoes: "Comprovante sem ID da transação visível na imagem",
    criadoEm: diasAtras(1),
    criadoPor: "Ana (Financeiro)",
  },
  {
    id: "comp_3",
    clienteNome: "Rafael Souza Lima",
    clienteDocumento: "10000000021",
    valor: 350.00, // valor levemente diferente do lançamento real, de propósito, para ilustrar divergência
    dataHora: diasAtras(1),
    idTransacaoE2E: "E000000032026061600000039",
    criadoEm: diasAtras(1),
    criadoPor: "Carlos (Financeiro)",
  },
  {
    id: "comp_4",
    clienteNome: "Cliente Novo Sem Pagamento",
    clienteDocumento: "99988877766",
    valor: 500.00,
    dataHora: diasAtras(0),
    observacoes: "Cliente disse que pagou, aguardando confirmação",
    criadoEm: diasAtras(0),
    criadoPor: "Carlos (Financeiro)",
  },
];

function diasAtras(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return data.toISOString();
}

export function obterComprovantes(): Comprovante[] {
  return comprovantesSeed;
}

export function adicionarComprovante(comprovante: Omit<Comprovante, "id" | "criadoEm">): Comprovante {
  const novo: Comprovante = {
    ...comprovante,
    id: `comp_${Date.now()}`,
    criadoEm: new Date().toISOString(),
  };
  comprovantesSeed = [novo, ...comprovantesSeed];
  return novo;
}

export function removerComprovante(id: string): void {
  comprovantesSeed = comprovantesSeed.filter((c) => c.id !== id);
}
