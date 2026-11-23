# Uptake

## Arquitetura da API

A API em `api/src` é organizada por features:

- `modules/<feature>/`: rotas, schemas, service, repository e entidades de domínio da feature.
- `shared/`: domínio, paginação, validação, guardas, erros customizados e serviço CRUD genérico.
- `plugins/`: autenticação, banco de dados e tratamento global de erros.
- `app.ts`: registro central das rotas da aplicação.

As features implementadas são `auth`, `studyGroup`, `content`, `note`, `exam`, `pomodoro` e `studyCycle`. Os módulos preservam o contrato HTTP existente e filtram todas as consultas pelo `userId` autenticado. A antiga feature `review` foi removida; `/reviews` redireciona para o dashboard.

## Setup local da API

Pré-requisitos: Node.js 22+ e MySQL/MariaDB local.

```bash
cp api/.env.example api/.env
```

Edite apenas o `api/.env` local, substituindo os placeholders de `DATABASE_URL`, `JWT_SECRET` e demais variáveis. Para banco local fora de containers, mantenha o host `127.0.0.1`; em containers, use o host do serviço de banco.

```bash
cd api
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

A API sobe em `http://localhost:3500` por padrão. As migrations ficam em `api/prisma/migrations` e devem ser geradas localmente quando o schema mudar.

## Validação

```bash
cd api
npm run typecheck
npm test
npm run build
npm start
```

`npm test` executa testes unitários com `node:test` e não exige banco. O smoke test HTTP exige banco local e a API rodando.

## Setup local do front

O front em `web/` usa Next.js 16, React 19, Tailwind CSS 4 e consome a API por um rewrite local. Com a API rodando na porta `3500`:

```bash
cp web/.env.example web/.env.local
cd web
npm install
npm run dev
```

O front sobe em `http://localhost:3000`. As requisições para `/api/*` são proxyadas para `API_PROXY_TARGET` (padrão `http://127.0.0.1:3500`), sem necessidade de CORS. A sessão guarda o JWT no `localStorage` e envia `Authorization: Bearer <token>` nas rotas protegidas.

```bash
cd web
npm run lint
npm run typecheck
npm run build
```

## Comportamentos do MVP

- Rotas protegidas exigem `Authorization: Bearer <token>`; token ausente retorna `401`.
- Paginação usa `page=1` e `limit=20` por padrão, com `limit` máximo de `100`.
- Grupos, conteúdos, notas e provas alternam entre tabela e cards; a preferência é salva por tela no navegador.
- Grupos, conteúdos e notas usam exclusão lógica e só podem ser removidos sem vínculos ativos: grupo sem conteúdos, provas ou ciclos; conteúdo sem notas, provas ou ciclos; nota sem provas. Isso evita órfãos e mantém vínculos históricos com registros excluídos.
- Conteúdos são gerenciados dentro de `/study-groups/{groupId}/contents`; clicar em um grupo abre essa tela e `GET /contents` aceita `studyGroupId` para filtrar. A tela permite arrastar para reordenar e envia `PATCH /contents/reorder`. Clicar em um conteúdo abre a pasta em `/study-groups/{groupId}/contents/{contentId}`.
- Ciclos usam exclusão lógica; ao remover um ciclo, a posição dos demais ciclos da mesma prioridade é normalizada.
- Nova nota recebe apenas um `name`; a API gera `title` e `fileName` com `.md` e inicia com `markdownContent` vazio para edição na página.
- `sizeBytes` é calculado no servidor a partir de `markdownContent`, com limite de 2 MB.
- `PATCH` continua substituindo completamente o recurso, preservando o contrato HTTP existente.
- Exames devolvem `contentIds` e `noteIds` nas respostas. Notas só podem ser vinculadas a conteúdos selecionados na prova.
- Ciclos pertencem a uma prova e aparecem em um kanban em `/exams`, com colunas fixas Alta, Média e Baixa. `/cycles` redireciona para `/exams`.
- Usuários usam `firstName` e `lastName`; a migração divide o nome antigo no primeiro espaço para preservar os dados.
- A sidebar mostra uma árvore de arquivos `grupo/ → conteúdo/ → nota.md`, com criar/renomear/excluir direto na árvore. A rota `/notes` continua disponível para criar e abrir notas.
- Notas abrem em abas no editor de `/study-groups/{groupId}/contents/{contentId}/notes/{noteId}`, com editor CodeMirror, toolbar Markdown, preview Markdown e salvamento manual por `Ctrl/Cmd+S`. A lista da pasta permite arrastar para reordenar via `PATCH /notes/reorder`.
- Pomodoro é um widget local na sidebar com modos `Pomodoro`, `Break` e `Long break`, relógio editável e botão `Start/Pausar`: 25/5/15 min por padrão, pausa longa a cada 4 focos, sinal com toast e beep; não registra histórico.
