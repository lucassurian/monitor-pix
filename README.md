# Monitor Pix — Conciliação Bancária Automática

Sistema interno para conciliar comprovantes de Pix enviados por clientes (via WhatsApp) com os lançamentos que de fato chegaram na conta da empresa, sem depender de verificação manual no internet banking.

## Como rodar localmente

Pré-requisito: Node.js 18 ou superior instalado.

```bash
npm install
npm run dev
```

Depois abra http://localhost:3000 no navegador.

## Como o sistema funciona hoje (fase 1 — sem banco de dados real)

- Os comprovantes que você cadastra ficam guardados **em memória no servidor** (em `src/lib/store.ts`). Isso significa que, se você reiniciar o servidor (`npm run dev`), os comprovantes cadastrados manualmente serão perdidos — só os 4 comprovantes de exemplo voltam.
- Os lançamentos bancários são **simulados** (mock) em `src/lib/bancoAdapter.ts`, já que a integração com a API do Itaú/Bradesco (Open Finance) ainda depende do processo de homologação.
- A lógica de comparação entre comprovante e lançamento está isolada em `src/lib/conciliacao.ts` — é o "motor" do sistema, e funciona independente de onde os dados vêm.

## Próximos passos (quando você quiser evoluir)

1. **Plugar banco de dados real** (Postgres, por exemplo, via Prisma) — substituindo as funções de `src/lib/store.ts` sem precisar tocar nas telas.
2. **Plugar a API real do banco** — substituindo `bancoMockAdapter` em `src/lib/bancoAdapter.ts` por uma chamada HTTP real ao Open Finance do Itaú/Bradesco, assim que a homologação estiver pronta. Os comentários no arquivo já listam o que essa integração vai exigir (mTLS, OAuth2, paginação).
3. **Adicionar autenticação de login** para a equipe (hoje o app não tem tela de login — é o próximo passo natural).

## Estrutura do projeto

```
src/
  app/
    api/
      comprovantes/       → cadastrar e listar comprovantes
      conciliacoes/        → executa a conciliação (cruza comprovantes x banco)
    page.tsx               → tela principal (dashboard "Monitor Pix")
    layout.tsx
  components/
    ConciliacaoCard.tsx     → card expansível comparando comprovante x lançamento
    NovoComprovanteModal.tsx → formulário de cadastro
    MetricCard.tsx
    StatusBadge.tsx
  lib/
    conciliacao.ts          → motor de conciliação (regras de negócio)
    bancoAdapter.ts          → integração com o banco (hoje mock, plugável depois)
    store.ts                 → armazenamento dos comprovantes (hoje em memória)
  types/
    domain.ts                 → tipos centrais (Comprovante, LancamentoBancario, Conciliacao)
```
