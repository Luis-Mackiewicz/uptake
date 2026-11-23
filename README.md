# Uptake

## Arquitetura da API

A API em `api/src` é organizada por features:

- `modules/<feature>/`: rotas, schemas, service, repository e entidades de domínio da feature.
- `shared/`: domínio, paginação, validação, guardas, erros customizados e serviço CRUD genérico.
- `plugins/`: autenticação, banco de dados e tratamento global de erros.
- `app.ts`: registro central das rotas da aplicação.

As features implementadas são `auth`, `studyGroup`, `content`, `note`, `exam`, `pomodoro`, `studyCycle` e `review`. Os módulos preservam o contrato HTTP existente e filtram todas as consultas pelo `userId` autenticado.
