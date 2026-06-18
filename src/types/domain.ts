// Tipos centrais do domínio do Monitor Pix

/** Status possível de uma conciliação entre comprovante e lançamento bancário */
export type StatusConciliacao = "conciliado" | "pendente" | "divergente";

/** Comprovante de Pix informado manualmente (a partir do que o cliente envia por WhatsApp) */
export interface Comprovante {
  id: string;
  clienteNome: string;
  clienteDocumento: string; // CPF ou CNPJ do pagador, como informado no comprovante
  valor: number; // em reais
  dataHora: string; // ISO 8601
  idTransacaoE2E?: string; // ID ponta-a-ponta do Pix, se o comprovante trouxer (ex: E00000000202401011200abcdef123456)
  observacoes?: string;
  criadoEm: string; // ISO 8601
  criadoPor: string; // nome/usuário de quem cadastrou
}

/** Lançamento de Pix recebido, conforme retornado pela API do banco (ou pelo adapter mock) */
export interface LancamentoBancario {
  id: string;
  pagadorNome: string;
  pagadorDocumento: string;
  valor: number;
  dataHora: string; // ISO 8601
  idTransacaoE2E: string; // sempre presente, vem do banco
  contaDestino: string;
}

/** Resultado de uma conciliação entre um comprovante e (possivelmente) um lançamento */
export interface Conciliacao {
  id: string;
  comprovante: Comprovante;
  lancamento: LancamentoBancario | null;
  status: StatusConciliacao;
  motivosDivergencia: string[]; // explica por que está divergente ou pendente
  conciliadoEm: string | null; // ISO 8601, quando ficou conciliado
  scoreConfianca: number; // 0-100, quão confiável é o match (mesmo quando há divergência leve)
}

/** Filtros usados no dashboard / lista de conciliações */
export interface FiltroConciliacao {
  status?: StatusConciliacao | "todos";
  busca?: string; // busca livre por nome, documento ou ID E2E
  dataInicio?: string;
  dataFim?: string;
}
