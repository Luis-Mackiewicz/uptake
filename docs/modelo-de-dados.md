# Modelo de dados do Uptake

Este documento complementa a seção 8 do [PRD](./PRD.md) e registra as decisões do modelo implementado em `api/prisma/schema.prisma`. Todos os nomes de modelos, tabelas e colunas são em inglês; a explicação permanece em português.

## Decisões principais

1. **Arquivo e anotação são a mesma coisa.** A entidade `Note` guarda o conteúdo de um arquivo `.md`: `fileName`, `markdownContent` (`LONGTEXT`), `mimeType` (`text/markdown`) e `sizeBytes`. O texto fica no banco por ser fácil de ler, editar e buscar; não há servidor de arquivos no MVP.
2. **Caminho do conteúdo:** `StudyGroup → Content → Note` (RD-01 e RD-02). Um grupo `History` pode ter vários conteúdos, e cada conteúdo pode ter vários `.md`, como `brazil_history.md` e `independence.md`.
3. **Exam pode vincular várias Notes, de grupos diferentes** (RF-07). A tabela `ExamNote` resolve o N:N com chave primária composta. Assim, a prova de 28/01/2027 pode usar notas de History, Math e Physics.
4. **Exam também pode pertencer a um StudyGroup** (`studyGroupId` opcional), conforme RD-03.
5. **Isolamento por usuário:** todo registro tem `userId`. Toda consulta deve filtrar `userId = usuário autenticado` **e** `deletedAt = null`.
6. **Exclusão lógica (RD-04):** nenhum `DELETE` físico. A remoção é bloqueada com `409` quando existem vínculos ativos: grupo com conteúdos, provas ou ciclos; conteúdo com notas, provas ou ciclos; nota com provas. Assim nenhum conteúdo ou nota fica órfão. Novas exclusões não cascateiam; vínculos históricos com registros excluídos são preservados. Por isso todas as relações usam `onDelete: Restrict`. Como as chaves únicas continuam valendo para linhas excluídas, um cadastro repetido **reativa** a linha existente (limpa `deletedAt`) em vez de inserir duplicata.
7. **Música ambiente** (RF-11) fica em `User.musicUrl`; não há tabela própria.
8. **Google Calendar** (RF-13): a conexão OAuth por usuário fica em `GoogleCalendarConnection`, com tokens criptografados pela aplicação. O `googleEventId` em `Exam` guarda o evento remoto correspondente.
9. **Paginação:** `page` começa em 1, padrão de 20 itens por página e máximo de 100, para todas as listagens (RT-02).

## Dicionário de nomes

| Português | Inglês (modelo/tabela) |
| --- | --- |
| Usuário | `User` |
| Grupo de estudo | `StudyGroup` |
| Conteúdo | `Content` |
| Arquivo / anotação | `Note` |
| Prova | `Exam` |
| Prova ↔ anotação | `ExamNote` |
| Prova ↔ conteúdo | `ExamContent` |
| Sessão de pomodoro | `PomodoroSession` |
| Ciclo de estudos | `StudyCycle` |
| Conteúdo do ciclo | `StudyCycleContent` |
| Conexão com o Google Agenda | `GoogleCalendarConnection` |

## Diagrama entidade-relacionamento

```mermaid
erDiagram
    USER ||--o{ STUDY_GROUP : "creates"
    USER ||--o{ CONTENT : "creates"
    USER ||--o{ NOTE : "creates"
    USER ||--o{ EXAM : "creates"
    USER ||--o{ POMODORO_SESSION : "records"
    USER ||--o{ STUDY_CYCLE : "builds"
    USER ||--o| GOOGLE_CALENDAR_CONNECTION : "connects"

    STUDY_GROUP ||--o{ CONTENT : "contains"
    STUDY_GROUP ||--o{ EXAM : "optionally links"
    STUDY_GROUP ||--o{ STUDY_CYCLE : "groups"
    CONTENT ||--o{ NOTE : "contains"
    CONTENT ||--o{ POMODORO_SESSION : "focuses"
    CONTENT ||--o{ EXAM_CONTENT : "belongs to"
    CONTENT ||--o{ STUDY_CYCLE_CONTENT : "belongs to"
    EXAM ||--o{ EXAM_NOTE : "links"
    EXAM ||--o{ EXAM_CONTENT : "links"
    EXAM ||--o{ STUDY_CYCLE : "has"
    NOTE ||--o{ EXAM_NOTE : "is linked to"
    STUDY_CYCLE ||--o{ STUDY_CYCLE_CONTENT : "has"

    USER {
        int id PK
        string firstName
        string lastName
        string email UK
        string cpf UK
        string passwordHash
        string musicUrl "optional"
        datetime deletedAt "optional"
    }
    STUDY_GROUP {
        int id PK
        string name
        string description "optional"
        int userId FK
        datetime deletedAt "optional"
    }
    CONTENT {
        int id PK
        string title
        string description "optional"
        int studyGroupId FK
        int position "ordem no grupo"
        int userId FK
        datetime deletedAt "optional"
    }
    NOTE {
        int id PK
        string title
        string fileName
        string markdownContent
        string mimeType
        int sizeBytes
        int contentId FK
        int position "ordem no conteúdo"
        int userId FK
        datetime deletedAt "optional"
    }
    EXAM {
        int id PK
        string title
        string description "optional"
        date examDate
        string location "optional"
        int studyGroupId FK "optional"
        string googleEventId "optional"
        int userId FK
        datetime deletedAt "optional"
    }
    EXAM_NOTE {
        int examId PK, FK
        int noteId PK, FK
        datetime createdAt
    }
    EXAM_CONTENT {
        int examId PK, FK
        int contentId PK, FK
        datetime createdAt
    }
    POMODORO_SESSION {
        int id PK
        int userId FK
        int contentId FK "optional"
        int focusMinutes
        int breakMinutes
        datetime startedAt
        datetime finishedAt "optional"
        boolean completed
    }
    STUDY_CYCLE {
        int id PK
        string name
        boolean active
        int currentRound
        int nextItemOrder
        int examId FK
        int studyGroupId FK
        int priority "1 alta, 2 média, 3 baixa"
        int position
        int userId FK
        datetime deletedAt "optional"
    }
    STUDY_CYCLE_CONTENT {
        int cycleId PK, FK
        int contentId PK, FK
        int position
        int minutesPerSession
        datetime createdAt
    }
    GOOGLE_CALENDAR_CONNECTION {
        int id PK
        int userId FK, UK
        string googleEmail
        string encryptedAccessToken
        string encryptedRefreshToken
        datetime tokenExpiresAt
        datetime syncedAt "optional"
    }
```

## Tabelas e finalidade

| Tabela | Finalidade | Relações principais |
| --- | --- | --- |
| `User` | Login, cadastro e edição do perfil; preferência de música | 1:N com todos os recursos |
| `StudyGroup` | Matéria ou área (History, Math) | N:1 com `User`; 1:N com `Content`, `Exam`, `StudyCycle` |
| `Content` | Assunto estudado dentro do grupo | N:1 com `StudyGroup` e `User`; 1:N com `Note`, `ExamContent`, `StudyCycleContent` |
| `Note` | Arquivo `.md` do usuário | N:1 com `Content`; N:N com `Exam` |
| `Exam` | Prova/concurso com data | N:1 opcional com `StudyGroup`; N:N com `Content` e `Note`; 1:N com `StudyCycle` |
| `ExamNote` | Junção explícita entre prova e nota | N:1 com `Exam` e `Note` |
| `ExamContent` | Junção explícita entre prova e conteúdo | N:1 com `Exam` e `Content` |
| `PomodoroSession` | Histórico de sessões de foco | N:1 opcional com `Content` |
| `StudyCycle` | Ciclo de estudo de uma prova | N:1 com `Exam`, `StudyGroup` e `User`; prioridade e posição no kanban |
| `StudyCycleContent` | Conteúdo sequenciado do ciclo | N:1 com `StudyCycle` e `Content` |
| `GoogleCalendarConnection` | Credenciais OAuth e sincronização | 1:1 com `User` |

## Como gravar um `.md`

1. A interface envia apenas `name` e `contentId` para `POST /notes`.
2. A API normaliza `name` para `Resumo.md`, usa o mesmo valor em `title` e `fileName` e cria a nota com `markdownContent` vazio.
3. A edição acontece na página da nota; `PATCH /notes/:id` recebe `title`, `fileName`, `markdownContent`, `contentId`, `mimeType` e `sizeBytes`.
4. O servidor valida UTF-8 e o limite de 2 MB no `markdownContent` recebido no `PATCH`.
5. Para baixar, a API devolve `markdownContent` com o nome original e o MIME `text/markdown`.

## Consultas e índices

- Filtro obrigatório em toda listagem: `userId` + `deletedAt: null`.
- `@@index([userId, deletedAt])` nas entidades do usuário.
- `@@unique([userId, name])` em `StudyGroup`; `@@unique([contentId, fileName])` em `Note`; `@@unique([examId, priority, position])` em `StudyCycle`; `@@unique([cycleId, position])` em `StudyCycleContent`.
- `@@index([studyGroupId, position])` em `Content` e `@@index([contentId, position])` em `Note`. `position` não é único porque a exclusão lógica preserva linhas antigas.
- `@@id([examId, noteId])` e `@@id([examId, contentId])` impedem vínculos duplicados entre prova e nota/conteúdo.
- `@@id([cycleId, contentId])` impede conteúdo duplicado no mesmo ciclo.
- `email` e `cpf` são únicos em `User`; `passwordHash` nunca é retornado pela API.

## Reativação de registros excluídos

Como o `deletedAt` não remove a linha, as chaves únicas continuam valendo. Antes de criar um registro, a API deve:

1. Buscar a linha pela chave natural, **incluindo** registros com `deletedAt` preenchido: `email`/`cpf` em `User`, `[userId, name]` em `StudyGroup`, `[contentId, fileName]` em `Note` e `userId` em `GoogleCalendarConnection`.
2. Se existir e estiver excluída, atualizar a linha com os novos dados e `deletedAt: null` (reativação).
3. Se existir e estiver ativa, retornar erro de conflito (409).
4. Se não existir, criar normalmente.

Em grupos excluídos antes da regra de bloqueio, a reativação ainda restaura filhos antigos com o mesmo `deletedAt`; novas exclusões não geram essa cascata. Filhos reativados continuam visíveis apenas se o pai também estiver ativo.

## Fora do MVP

- Entidade `Todo`/tarefa (aparece no `user-flow.md`, mas não no PRD).
- Tabela específica para música ambiente.
- Histórico completo de execução dos ciclos de estudo.
- Versionamento de arquivos `.md`.
