import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function diasAtras(dias: number): Date {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return data;
}

async function main() {
  const count = await prisma.comprovante.count();
  if (count > 0) {
    console.log(`Banco já tem ${count} comprovante(s). Seed ignorado.`);
    return;
  }

  await prisma.comprovante.createMany({
    data: [
      {
        clienteNome: "João Pedro Almeida",
        clienteDocumento: "10000000007",
        valor: 287.90,
        dataHora: diasAtras(6),
        idTransacaoE2E: "E000000012026061500000013",
        observacoes: "Cliente enviou print pelo WhatsApp",
        criadoPor: "Ana (Financeiro)",
      },
      {
        clienteNome: "Mariana Costa Silva",
        clienteDocumento: "10000000014",
        valor: 424.90,
        dataHora: diasAtras(5),
        observacoes: "Comprovante sem ID da transação visível na imagem",
        criadoPor: "Ana (Financeiro)",
      },
      {
        clienteNome: "Rafael Souza Lima",
        clienteDocumento: "10000000021",
        valor: 350.00,
        dataHora: diasAtras(5),
        idTransacaoE2E: "E000000032026061600000039",
        criadoPor: "Carlos (Financeiro)",
      },
      {
        clienteNome: "Cliente Novo Sem Pagamento",
        clienteDocumento: "99988877766",
        valor: 500.00,
        dataHora: diasAtras(4),
        observacoes: "Cliente disse que pagou, aguardando confirmação",
        criadoPor: "Carlos (Financeiro)",
      },
    ],
  });

  console.log("Seed concluído: 4 comprovantes criados.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
