# Uptake

## Arquitetura da API

A API em `api/src` é organizada por features:

- `modules/<feature>/`: rotas, schemas, service, repository e entidades de domínio da feature.
- `shared/`: domínio, paginação, validação, guardas, erros customizados e serviço CRUD genérico.
- `plugins/`: autenticação, banco de dados e tratamento global de erros.
- `app.ts`: registro central das rotas da aplicação.

As features implementadas são `auth`, `studyGroup`, `content`, `note`, `exam`, `pomodoro`, `studyCycle` e `review`. Os módulos preservam o contrato HTTP existente e filtram todas as consultas pelo `userId` autenticado.

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
- Grupos, conteúdos e notas usam exclusão lógica: remover um grupo oculta conteúdos, notas, provas, sessões de pomodoro, revisões e itens de ciclo relacionados; reativar o grupo restaura essa cadeia.
- Conteúdos são gerenciados dentro de `/study-groups/{groupId}/contents`; clicar em um grupo abre essa tela e `GET /contents` aceita `studyGroupId` para filtrar. A tela permite arrastar para reordenar e envia `PATCH /contents/reorder`.
- Itens do ciclo também usam exclusão lógica para não violar a unicidade de posição.
- `sizeBytes` é calculado no servidor a partir de `markdownContent`, com limite de 2 MB.
- `PATCH` continua substituindo completamente o recurso, preservando o contrato HTTP existente.
- Exames devolvem `noteIds` nas respostas, permitindo editar o vínculo com notas no front.
- Usuários usam `firstName` e `lastName`; a migração divide o nome antigo no primeiro espaço para preservar os dados.
- Notas abrem em abas dentro de `/notes`, com editor CodeMirror, toolbar Markdown, preview Markdown e salvamento manual por `Ctrl/Cmd+S`. O filtro por conteúdo usa `?contentId=<id>`; com um conteúdo selecionado é possível arrastar para reordenar via `PATCH /notes/reorder`.
- Pomodoro é um widget local na sidebar: 25/5/15 min por padrão, pausa longa a cada 4 focos, sinal com toast e beep; não registra histórico.
