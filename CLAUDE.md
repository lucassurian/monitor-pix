# Monitor Pix — Handoff para Claude Code

Este documento descreve o estado atual do projeto e os próximos passos a serem implementados. Use-o como ponto de partida para continuar o desenvolvimento com Claude Code.

---

## O que é este projeto

Sistema interno de **conciliação bancária de Pix**. A equipe financeira cadastra os comprovantes que os clientes enviam por WhatsApp (digitando os dados manualmente), e o sistema cruza essas informações com os lançamentos que de fato chegaram na conta da empresa via API do banco, retornando o status de cada pagamento: **Conciliado**, **Pendente** ou **Divergente**.

---

## Estado atual

O projeto está em **Fase 1 (MVP de telas)**: funciona com dados fictícios, sem banco de dados real e sem autenticação. O servidor sobe normalmente com `npm run dev`.

### O que já existe e funciona

- `src/types/domain.ts` — tipos centrais: `Comprovante`, `LancamentoBancario`, `Conciliacao`, `StatusConciliacao`
- `src/lib/conciliacao.ts` — motor de conciliação testado e validado. Faz match por ID E2E (prioritário) ou por valor + documento + janela de 48h
- `src/lib/bancoAdapter.ts` — adapter plugável para o banco. Hoje usa `bancoMockAdapter` (gera lançamentos fictícios). Tem interface `BancoAdapter` pronta para ser substituída pela API real
- `src/lib/store.ts` — store em memória simulando banco de dados. Tem 4 comprovantes de exemplo pré-cadastrados
- `src/app/api/comprovantes/route.ts` — GET lista comprovantes, POST cadastra novo
- `src/app/api/comprovantes/[id]/route.ts` — DELETE remove comprovante
- `src/app/api/conciliacoes/route.ts` — GET executa a conciliação completa e retorna resultado + resumo
- `src/app/page.tsx` — dashboard principal com métricas, filtros, busca e lista de conciliações
- `src/components/ConciliacaoCard.tsx` — card expansível mostrando comprovante x lançamento lado a lado
- `src/components/NovoComprovanteModal.tsx` — formulário modal para cadastrar comprovante
- `src/components/MetricCard.tsx` e `StatusBadge.tsx` — componentes visuais de apoio

### O que ainda NÃO existe (próximos passos)

1. **Autenticação de login** (maior prioridade)
2. **Banco de dados real** (Postgres via Prisma)
3. **Integração real com a API do banco** (Open Finance — Itaú/Bradesco)
4. **Tela de histórico** de conciliações passadas
5. **Notificações** para a equipe quando um item fica divergente por mais de X horas

---

## Próximos passos recomendados (em ordem)

### PASSO 1 — Autenticação com NextAuth.js

O sistema é uma ferramenta interna para 2–5 pessoas da equipe financeira. A autenticação deve ser simples e sem cadastro público.

**Implementar:**
- Instalar `next-auth`
- Criar `src/app/api/auth/[...nextauth]/route.ts`
- Usar provider `Credentials` (login com e-mail + senha definidos em variável de ambiente, sem banco de dados ainda)
- Criar página de login em `src/app/login/page.tsx`
- Proteger todas as rotas da API e a página principal com `getServerSession`
- Criar middleware em `middleware.ts` para redirecionar usuários não autenticados para `/login`

**Variáveis de ambiente necessárias (criar `.env.local`):**
```
NEXTAUTH_SECRET=uma_string_aleatoria_segura
NEXTAUTH_URL=http://localhost:3000
APP_USER_EMAIL=financeiro@suaempresa.com.br
APP_USER_PASSWORD=senha_da_equipe
```

---

### PASSO 2 — Banco de dados com Prisma + PostgreSQL

Hoje os comprovantes ficam em memória e somem ao reiniciar o servidor. Precisamos persistir.

**Implementar:**
- Instalar `prisma` e `@prisma/client`
- Criar `prisma/schema.prisma` com os models `Comprovante` e `ConciliacaoLog` (para guardar histórico)
- Rodar `npx prisma migrate dev` para criar as tabelas
- Substituir as funções de `src/lib/store.ts` (`obterComprovantes`, `adicionarComprovante`, `removerComprovante`) por queries Prisma — manter a mesma assinatura de função para não afetar as telas

**Schema sugerido:**
```prisma
model Comprovante {
  id                String   @id @default(cuid())
  clienteNome       String
  clienteDocumento  String
  valor             Float
  dataHora          DateTime
  idTransacaoE2E    String?
  observacoes       String?
  criadoPor         String
  criadoEm          DateTime @default(now())
}

model ConciliacaoLog {
  id              String   @id @default(cuid())
  comprovanteId   String
  lancamentoE2E   String?
  status          String   // "conciliado" | "pendente" | "divergente"
  scoreConfianca  Int
  criadoEm        DateTime @default(now())
}
```

**Variável de ambiente necessária:**
```
DATABASE_URL=postgresql://usuario:senha@localhost:5432/monitor_pix
```

---

### PASSO 3 — Integração real com a API do banco (Open Finance)

O arquivo `src/lib/bancoAdapter.ts` já tem a interface pronta. Só precisamos criar uma segunda implementação que chama a API real.

**Implementar:**
- Criar `src/lib/bancoAdapterReal.ts` implementando `BancoAdapter`
- A função `buscarLancamentosPix` deve:
  1. Fazer autenticação OAuth2 com o banco (client credentials flow)
  2. Chamar o endpoint de extrato Pix para o período solicitado
  3. Mapear o payload do banco para o tipo `LancamentoBancario`
- Em `bancoAdapter.ts`, trocar `obterBancoAdapter()` para retornar a implementação real quando `process.env.BANCO_API_KEY` estiver definida, e manter o mock como fallback

**Desafios conhecidos da integração Open Finance com bancos tradicionais:**
- Autenticação mTLS (certificado digital A1/A3) — o banco exige que a requisição venha assinada com certificado
- Token OAuth2 com expiração curta — implementar cache/renovação automática
- Paginação do extrato — bancos tradicionais paginam por período (ex: máximo 7 dias por request)
- Webhook de recebimento — considerar registrar um endpoint `/api/webhook/pix` para receber notificações em tempo real, ao invés de só buscar periodicamente

**Variáveis de ambiente necessárias:**
```
BANCO_API_BASE_URL=https://api.itau.com.br  # ou Bradesco
BANCO_CLIENT_ID=seu_client_id
BANCO_CLIENT_SECRET=seu_client_secret
BANCO_CERT_PATH=./certs/certificado.pem     # path do certificado mTLS
```

---

## Decisões de design relevantes

- **Motor de conciliação é puro TypeScript**, sem dependências externas. Pode ser testado isoladamente com `node` puro (sem Next.js). Fica em `src/lib/conciliacao.ts`.
- **O adapter do banco é plugável por design**: a função `obterBancoAdapter()` retorna uma implementação, e o restante do código não sabe se é mock ou real.
- **Um lançamento bancário nunca é reutilizado**: durante uma rodada de conciliação, cada lançamento só pode ser pareado com um comprovante. Isso evita o bug de um único Pix "conciliar" dois comprovantes.
- **Comprovantes com ID E2E são processados primeiro**: o motor ordena os comprovantes antes de rodar, priorizando os que têm ID de transação (match mais confiável) para não "gastar" um lançamento num match fraco quando existe um match forte disponível.

---

## Paleta de cores (Tailwind customizado)

| Token         | Hex       | Uso                              |
|---------------|-----------|----------------------------------|
| `ink-950`     | `#0B0F0E` | Fundo geral da página            |
| `ink-900`     | `#101614` | Fundo de cards                   |
| `ink-700`     | `#212B28` | Bordas                           |
| `paper-50`    | `#F6F7F4` | Texto principal                  |
| `paper-100`   | `#ECEEE8` | Texto secundário                 |
| `pix-500`     | `#32BCAD` | Verde Pix — ações e "Conciliado" |
| `amber-500`   | `#E2A33D` | Pendente                         |
| `coral-500`   | `#E2604F` | Divergente / erro                |

---

## Comandos úteis

```bash
npm run dev      # sobe o servidor local em localhost:3000
npm run build    # build de produção
npm run lint     # checa erros de lint
```
