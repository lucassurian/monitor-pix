import https from "https";
import fs from "fs";
import type { BancoAdapter, BuscarLancamentosParams } from "./bancoAdapter";
import type { LancamentoBancario } from "@/types/domain";

// Cache do token OAuth2 em memória (válido por processo)
let tokenCache: { accessToken: string; expiresAt: number } | null = null;

async function obterTokenOAuth2(): Promise<string> {
  // Retorna token em cache se ainda válido (com 60s de margem)
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.accessToken;
  }

  const baseUrl = process.env.BANCO_API_BASE_URL!;
  const clientId = process.env.BANCO_CLIENT_ID!;
  const clientSecret = process.env.BANCO_CLIENT_SECRET!;

  const agente = criarAgenteHTTPS();

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "pix.read",
  });

  const resposta = await fetch(`${baseUrl}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    // @ts-expect-error — Node 18+ aceita agent no fetch via undici
    agent: agente,
  });

  if (!resposta.ok) {
    const texto = await resposta.text();
    throw new Error(`Falha na autenticação Itaú OAuth2: ${resposta.status} ${texto}`);
  }

  const dados = await resposta.json() as { access_token: string; expires_in: number };

  tokenCache = {
    accessToken: dados.access_token,
    expiresAt: Date.now() + dados.expires_in * 1000,
  };

  return tokenCache.accessToken;
}

function criarAgenteHTTPS(): https.Agent | undefined {
  const certPath = process.env.BANCO_CERT_PATH;
  const keyPath = process.env.BANCO_KEY_PATH;

  if (!certPath || !keyPath) return undefined;

  return new https.Agent({
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
    // Para certificados auto-assinados em homologação
    rejectUnauthorized: process.env.NODE_ENV === "production",
  });
}

// Mapeia o payload do Itaú para o tipo interno LancamentoBancario
function mapearLancamento(item: Record<string, unknown>): LancamentoBancario {
  return {
    id: String(item["txid"] ?? item["endToEndId"]),
    pagadorNome: String((item["pagador"] as Record<string, unknown>)?.["nome"] ?? ""),
    pagadorDocumento: String((item["pagador"] as Record<string, unknown>)?.["cpf"] ?? (item["pagador"] as Record<string, unknown>)?.["cnpj"] ?? ""),
    valor: parseFloat(String(item["valor"])),
    dataHora: String(item["horario"] ?? item["dataHoraCriacao"]),
    idTransacaoE2E: String(item["endToEndId"]),
    contaDestino: String((item["recebedor"] as Record<string, unknown>)?.["conta"] ?? "Conta Corrente Itaú"),
  };
}

async function buscarPagina(
  baseUrl: string,
  token: string,
  inicio: string,
  fim: string,
  pagina: number
): Promise<{ lancamentos: LancamentoBancario[]; temMais: boolean }> {
  const agente = criarAgenteHTTPS();

  const params = new URLSearchParams({
    inicio,
    fim,
    paginacao: JSON.stringify({ paginaAtual: pagina, itensPorPagina: 100 }),
  });

  const resposta = await fetch(`${baseUrl}/pix/v2/pix?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    // @ts-expect-error — Node 18+ aceita agent no fetch via undici
    agent: agente,
  });

  if (!resposta.ok) {
    const texto = await resposta.text();
    throw new Error(`Erro ao buscar Pix Itaú: ${resposta.status} ${texto}`);
  }

  const dados = await resposta.json() as {
    pix?: Record<string, unknown>[];
    parametros?: { paginacao?: { paginaAtual: number; totalDePaginas: number } };
  };

  const itens = dados.pix ?? [];
  const paginacao = dados.parametros?.paginacao;
  const temMais = paginacao
    ? paginacao.paginaAtual < paginacao.totalDePaginas - 1
    : false;

  return {
    lancamentos: itens.map(mapearLancamento),
    temMais,
  };
}

export const bancoItauAdapter: BancoAdapter = {
  async buscarLancamentosPix(params: BuscarLancamentosParams): Promise<LancamentoBancario[]> {
    const baseUrl = process.env.BANCO_API_BASE_URL!;
    const token = await obterTokenOAuth2();

    const todos: LancamentoBancario[] = [];
    let pagina = 0;
    let temMais = true;

    // Itera por todas as páginas (Itaú pagina o extrato)
    while (temMais) {
      const resultado = await buscarPagina(baseUrl, token, params.dataInicio, params.dataFim, pagina);
      todos.push(...resultado.lancamentos);
      temMais = resultado.temMais;
      pagina++;
    }

    return todos;
  },
};
