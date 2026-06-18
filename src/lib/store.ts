import type { Comprovante } from "@/types/domain";
import { prisma } from "./prisma";

function toComprovante(row: {
  id: string;
  clienteNome: string;
  clienteDocumento: string;
  valor: number;
  dataHora: Date;
  idTransacaoE2E: string | null;
  observacoes: string | null;
  criadoPor: string;
  criadoEm: Date;
}): Comprovante {
  return {
    id: row.id,
    clienteNome: row.clienteNome,
    clienteDocumento: row.clienteDocumento,
    valor: row.valor,
    dataHora: row.dataHora.toISOString(),
    idTransacaoE2E: row.idTransacaoE2E ?? undefined,
    observacoes: row.observacoes ?? undefined,
    criadoPor: row.criadoPor,
    criadoEm: row.criadoEm.toISOString(),
  };
}

export async function obterComprovantes(): Promise<Comprovante[]> {
  const rows = await prisma.comprovante.findMany({ orderBy: { criadoEm: "desc" } });
  return rows.map(toComprovante);
}

export async function adicionarComprovante(
  dados: Omit<Comprovante, "id" | "criadoEm">
): Promise<Comprovante> {
  const row = await prisma.comprovante.create({
    data: {
      clienteNome: dados.clienteNome,
      clienteDocumento: dados.clienteDocumento,
      valor: dados.valor,
      dataHora: new Date(dados.dataHora),
      idTransacaoE2E: dados.idTransacaoE2E ?? null,
      observacoes: dados.observacoes ?? null,
      criadoPor: dados.criadoPor,
    },
  });
  return toComprovante(row);
}

export async function removerComprovante(id: string): Promise<void> {
  await prisma.comprovante.delete({ where: { id } });
}
