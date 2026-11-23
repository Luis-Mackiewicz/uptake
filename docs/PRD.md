# PRD: Uptake

| Campo              | Valor                                      |
| ------------------ | ------------------------------------------ |
| Versão             | 0.1                                        |
| Status             | Rascunho                                   |
| Autor              | Luis Miguel Oliveira de Almeida Mackiewicz |
| Última atualização | 2026-11-20                                 |

## Sumário

1. [Contexto e problema](#1-contexto-e-problema)
2. [Objetivos e métricas](#2-objetivos-e-métricas)
3. [Público](#3-público)
4. [Escopo](#4-escopo)
5. [Estrutura do site e inventário de telas](#5-estrutura-do-site-e-inventário-de-telas)
6. [Requisitos funcionais](#6-requisitos-funcionais)
7. [Regras transversais](#7-regras-transversais)
8. [Modelo de dados](#8-modelo-de-dados)
9. [Requisitos não funcionais e restrições técnicas](#9-requisitos-não-funcionais-e-restrições-técnicas)
10. [Integrações e dependências](#10-integrações-e-dependências)
11. [Riscos, premissas e perguntas em aberto](#11-riscos-premissas-e-perguntas-em-aberto)
12. [Histórico de versões](#12-histórico-de-versões)

---

## 1. Contexto e problema

**Problema:** estudantes de concurso público não têm uma ferramenta feita para essa atividade. Hoje precisam combinar vários aplicativos e métodos (cronômetro, agenda, anotações, arquivos, música, IA), o que fragmenta o estudo e consome tempo de organização.

**Solução:** o **Uptake** é uma plataforma web que reúne em um só lugar as ferramentas de que o concurseiro precisa: organização por matérias, ciclo de estudos dentro de provas, pomodoro, música ambiente, calendário de provas e apoio de inteligência artificial.

## 2. Objetivos e métricas

| Objetivo                                | Métrica                                                                              | Meta                          |
| --------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------- |
| Reunir o estudo em uma única plataforma | Funcionalidades de estudo disponíveis (pomodoro, ciclo, música, IA, provas) | 5 de 5 na entrega             |
| Permitir organização do conteúdo        | Usuário consegue criar grupo, conteúdo e arquivo sem sair da plataforma              | Fluxo completo funcionando    |
| Atender à rubrica da disciplina         | Itens do `docs/rubrica.md` concluídos                                                | 100% marcados na apresentação |

## 3. Público

- **Perfil principal:** estudantes que se preparam para concursos públicos e precisam de apoio para ciclo de estudos, pomodoro, música ambiente e IA.
- **Persona (proposta):** concurseiro que estuda várias matérias ao mesmo tempo, geralmente em horários alternados com trabalho, e precisa saber o que estudar e quando é a próxima prova.
- **Contexto de uso (proposta):** desktop em casa e celular em deslocamento.

## 4. Escopo

### Dentro do escopo

- Front-end com 11 telas, listadas no [inventário de telas](#51-inventário-de-telas)
- Autenticação, cadastro e edição de usuário
- 4 CRUDs completos, todos com rotas autenticadas
- Funcionalidades de estudo: pomodoro, ciclo de estudos dentro de provas, música ambiente e assistente de IA
- Calendário de provas com integração ao Google Agenda
- Back-end, banco MySQL e infraestrutura Docker com Nginx
- Configuração de agentes de IA para desenvolvimento (`AGENTS.md`)

### Fora do escopo (proposta)

- CRUD de usuários além de cadastro e edição do próprio perfil (sem listar nem excluir usuários)
- Perfis de permissão (administrador e usuário comum)
- Recuperação de senha
- Aplicativo mobile nativo e desktop
- Pagamentos e planos pagos
- Telas além das 11 listadas
- Deploy em ambiente de produção

### Fases (proposta)

- **MVP:** autenticação, cadastro, edição, 4 CRUDs, DevOps, dashboard
- **Complemento:** pomodoro, ciclo em provas, música, IA, integração com Google Agenda

## 5. Estrutura do site e inventário de telas

### 5.1 Inventário de telas

| #   | Tela                                                   | Rota (proposta)  | Acesso      | RF relacionado |
| --- | ------------------------------------------------------ | ---------------- | ----------- | -------------- |
| 1   | Apresentação                                           | `/`              | Público     | RF-14          |
| 2   | Login                                                  | `/login`         | Público     | RF-01          |
| 3   | Cadastro                                               | `/cadastro`      | Público     | RF-02          |
| 4   | Dashboard inicial                                      | `/dashboard`     | Autenticado | RF-14          |
| 5   | Conteúdos de um grupo                                  | `/study-groups/:groupId/contents` | Autenticado | RF-05 |
| 6   | Pasta de um conteúdo                                   | `/study-groups/:groupId/contents/:contentId` | Autenticado | RF-06 |
| 7   | Arquivo Markdown específico                            | `/study-groups/:groupId/contents/:contentId/notes/:noteId` | Autenticado | RF-06 |
| 8   | Provas (conteúdos, notas, ciclos em kanban e Google Agenda) | `/exams`         | Autenticado | RF-07, RF-09, RF-13 |
| 9   | Integração com o Google Agenda                         | `/agenda`        | Autenticado | RF-13          |
| 10  | Configurações (inclui edição de perfil)                | `/configuracoes` | Autenticado | RF-03          |
| 11  | Grupo de estudo (ex.: História, Matemática)            | `/study-groups`  | Autenticado | RF-04          |
| 12  | Not found                                              | `*`              | Público     | RT-05          |

### 5.2 Fluxos principais (proposta)

1. Visitante: Apresentação → Cadastro → Login → Dashboard
2. Estudo: Dashboard → Grupo de estudo → Conteúdo → Arquivo
3. Provas: Dashboard → Provas → Google Agenda

## 6. Requisitos funcionais

Prioridade pelo método MoSCoW: **Must** (obrigatório), **Should** (importante), **Could** (desejável).

### RF-01 Autenticação

**Prioridade:** Must

**API**

- Login com e-mail e senha
- Senha armazenada criptografada no banco
- Validação de formato de e-mail (regex)
- Retorno de JWT em login bem-sucedido
- Somente usuário existente consegue logar

**Interface**

- Campos de e-mail e senha
- Validação de e-mail (regex) antes do envio
- Token armazenado no `localStorage`
- Erros da API exibidos de forma amigável
- Redirecionamento para a área logada após o login

### RF-02 Cadastro de usuário

**Prioridade:** Must

**API**

- Campos obrigatórios: nome, sobrenome, e-mail, senha e CPF
- Validação de CPF
- Validação de nível de senha
- Validação de e-mail

**Interface**

- Campos: nome, sobrenome, e-mail, senha e CPF
- Verificação dupla de senha (digitar duas vezes)
- Validação de CPF e de e-mail
- Redirecionamento para o login após o cadastro
- Mensagens de erro da API exibidas ao usuário

### RF-03 Edição de usuário

**Prioridade:** Must

**API**

- Rota autenticada
- O usuário só pode editar o próprio cadastro
- Todos os campos são obrigatórios
- Validação de CPF e de nível de senha
- O e-mail não pode ser alterado

**Interface**

- Informações do usuário exibidas globalmente por meio de contexto
- Validação de CPF e de nível de senha
- Confirmação da senha (digitar duas vezes)
- Campo de e-mail bloqueado para edição

### RF-04 CRUD de Grupos de estudo

**Prioridade:** Must
**Telas:** #10 (e tela de formulário de cadastro/edição, ver [pergunta em aberto 2](#11-riscos-premissas-e-perguntas-em-aberto))
**Descrição (proposta):** o usuário organiza o estudo em grupos por matéria (ex.: História, Matemática).
**Critérios:** segue RT-01 a RT-04. A listagem oferece visão em tabela ou cards, com preferência salva por tela no navegador; ao clicar em um grupo, a aplicação abre `/study-groups/:groupId/contents`.

### RF-05 CRUD de Conteúdos

**Prioridade:** Must
**Telas:** #5
**Descrição (proposta):** o usuário registra conteúdos de estudo dentro de um grupo.
**Critérios:** segue RT-01 a RT-04. O conteúdo pertence a um grupo de estudo (RD-01). A listagem acontece na tela do grupo; a API aceita `GET /contents?studyGroupId=<id>` para filtrar com validação de propriedade. A tela oferece visão em tabela ou cards e reordenação persistida por arraste via `PATCH /contents/reorder`.

### RF-06 CRUD de Arquivos

**Prioridade:** Must
**Telas:** #9
**Descrição (proposta):** o usuário anexa e consulta arquivos ligados a um conteúdo.
**Critérios:** segue RT-01 a RT-04. O arquivo pertence a um conteúdo (RD-02). Nova nota envia apenas `name` e `contentId`; a API gera `title`/`fileName` com `.md` e conteúdo vazio, e a edição ocorre na página. A lista lateral oferece visão em tabela ou cards sem alterar o workspace de abas. A listagem aceita `GET /notes?contentId=<id>`; ao filtrar por conteúdo, a ordem pode ser alterada por arraste e persistida com `PATCH /notes/reorder`. O editor usa CodeMirror com toolbar Markdown para título, negrito, itálico, código, link, listas e citação.

### RF-07 CRUD de Provas

**Prioridade:** Must
**Telas:** #6
**Descrição:** o usuário cadastra provas, vincula grupo, conteúdos e notas, e pode integrar ao Google Agenda (RF-13).
**Critérios:** segue RT-01 a RT-04. A listagem oferece visão em tabela ou cards, exibindo título, data, grupo, local e quantidades de conteúdos e notas vinculadas. A API impede notas de conteúdos não selecionados na prova.

### RF-08 Pomodoro

**Prioridade:** Should
**Descrição:** temporizador de foco e pausa disponível globalmente na sidebar.
**Critérios:** padrões de 25 min de foco, 5 min de pausa curta e 15 min de pausa longa; tempos configuráveis no widget; pausa longa a cada 4 focos; sinal visual e sonoro ao finalizar cada fase; estado apenas local, sem histórico de sessões.

### RF-09 Ciclo de estudos em Provas

**Prioridade:** Should
**Descrição:** organização da rotina de estudos dentro de uma prova.
**Critérios:** o aluno cria ciclos com nome, grupo, conteúdos e prioridade Alta/Média/Baixa. A tela de Provas mostra um kanban com uma coluna por prioridade; ciclos podem ser arrastados entre colunas e reordenados. A API persiste posição e prioridade. A ação de avançar percorre os conteúdos do ciclo e incrementa a rodada ao final.

### RF-10 Revisão

**Prioridade:** Removida
**Descrição:** a funcionalidade de revisão espaçada foi removida do produto.
**Critérios:** rotas, tipos, componentes, dados e documentação de Revisões não fazem mais parte da aplicação. `/reviews` redireciona para o dashboard.

### RF-11 Música ambiente

**Prioridade:** Could
**Descrição:** reprodução de música ou sons ambiente durante o estudo.
**Critérios:** _a definir (fonte do áudio: arquivos próprios, serviço externo ou links)._

### RF-12 Assistente de inteligência artificial

**Prioridade:** Could
**Descrição:** apoio de IA ao estudo dentro da plataforma.
**Critérios:** _a definir (o que a IA faz: resumir conteúdo, gerar questões, tirar dúvidas; qual API)._
**Observação:** não confundir com os agentes de desenvolvimento (RNF-04).

### RF-13 Integração com o Google Agenda

**Prioridade:** Should
**Descrição:** o usuário vincula provas ao Google Agenda.
**Critérios:** _a definir (conectar conta, criar evento a partir de uma prova, sincronização em um ou dois sentidos)._

### RF-14 Apresentação e dashboard

**Prioridade:** Must
**Descrição:** a tela de apresentação explica o produto para visitantes. O dashboard inicial resume a rotina do usuário logado.
**Critérios:** _a definir (quais informações o dashboard mostra)._

## 7. Regras transversais

Valem para os CRUDs (RF-04 a RF-07), salvo indicação contrária.

- **RT-01 Autenticação:** todas as rotas dos CRUDs exigem usuário autenticado. Sem autenticação, retornar 401.
- **RT-02 Paginação:** toda listagem é paginada. Definir valor padrão e máximo de itens por página.
- **RT-03 Recurso inexistente:** visualizar, editar ou remover um ID que não existe retorna 404 e não altera dados.
- **RT-04 Validação:** campos obrigatórios validados na API e na interface. Dados inválidos retornam erro com mensagem clara.
- **RT-05 Rota inexistente (front-end):** rota que não existe exibe a tela Not found (#11).
- **RT-06 Telas separadas (front-end):** listagem e cadastro/edição dos CRUDs ficam em telas separadas (exigência da rubrica).

## 8. Modelo de dados

- **RD-01:** Conteúdo pertence a um Grupo de estudo (N:1).
- **RD-02:** Arquivo pertence a um Conteúdo (N:1).
- **RD-03:** Prova pode estar associada a um Grupo de estudo (N:1).
- **RD-04 (decisão):** bloquear com `409` a remoção de grupo com conteúdos, provas ou ciclos ativos; de conteúdo com notas, provas ou ciclos ativos; e de nota com provas ativas. Novas exclusões não cascateiam.
- **RD-05:** Prova associa conteúdos e notas; notas só podem ser vinculadas a conteúdos da própria prova.
- **RD-06:** Ciclo pertence a uma prova, usa prioridade 1/2/3 (Alta/Média/Baixa) e posição por prioridade; seus conteúdos formam a sequência do ciclo.

A rubrica exige ao menos 1 relacionamento entre os recursos. RD-01 já atende.

## 9. Requisitos não funcionais e restrições técnicas

### RNF-01 Componentização do front-end

- Componentes genéricos e reutilizáveis
- Telas compostas por vários componentes
- Componentes e páginas em pastas separadas
- Componentes exclusivos de uma página em funções separadas

### RNF-02 DevOps

- `compose.yaml` organizado, com serviços separados, volumes, redes e variáveis de ambiente
- Backend, frontend e Nginx se comunicam entre si e o backend conecta ao MySQL
- Dados do MySQL persistem em volume após reinício
- Nginx configurado como proxy reverso, redirecionando requisições para frontend e backend
- Isolamento por Docker network: apenas o Nginx fica exposto fora do container

### RNF-03 Qualidade do código (TechForge, TypeScript e POO)

- **Encapsulamento:** estado interno protegido com modificadores de acesso (`private`, `protected`, `public`) ou campos privados nativos (`#field`), com construtores limpos que inicializam as propriedades
- **Acesso controlado:** `get`/`set` usados apenas quando há validação, transformação ou regra de negócio
- **Modelagem de domínio:** entidades bem estruturadas, herança e classes abstratas onde há reuso legítimo, polimorfismo por contratos comuns ou sobrescrita de métodos
- **Tipagem:** interfaces e type aliases, sem uso indevido de `any`, e Generics para reuso de código tipado
- **SOLID:** responsabilidade única (S), extensão sem alterar o código base (O) e substituição de subclasses (L)
- **Exceções e organização:** erros customizados via classes de exceção, arquivos em pastas (entidades, serviços, repositórios) e nomenclatura padronizada conforme a linguagem

### RNF-04 Agentes de desenvolvimento

- Arquivo `AGENTS.md` criado na raiz do projeto
- 3 skills específicas definidas para os agentes
- Guardrails que limitam ações e comportamentos do agente
- Proteção de arquivos sensíveis: o agente não pode ler nem expor variáveis e credenciais do `.env`

### RNF-05 Segurança (proposta)

- Senhas nunca retornam em respostas da API
- `.env` fora do controle de versão (`.gitignore`)
- Dados pessoais (CPF) tratados conforme a LGPD

## 10. Integrações e dependências

- **Google Agenda:** exige projeto na Google Cloud, OAuth e API do Calendar (RF-13)
- **API de IA:** definir provedor e chave (RF-12)
- **MySQL, Nginx e Docker:** infraestrutura do projeto (RNF-02)
- **Música ambiente:** definir fonte (RF-11)

## 11. Riscos, premissas e perguntas em aberto

### Perguntas em aberto

1. Quais são os 4 recursos dos CRUDs? A proposta (grupos, conteúdos, arquivos, provas) está correta?
2. **Contagem de telas:** a rubrica exige listagem e cadastro/edição em telas separadas. Com 4 CRUDs, isso dá 8 telas, mais login, cadastro e edição de perfil, totalizando 11. As 11 telas atuais incluem apresentação, dashboard, Google Agenda e Not found, que não entram nessa conta. Confirmar com o professor se o número é 11 no total ou 11 só de rubrica.
3. Cada usuário vê apenas os próprios registros ou todos veem tudo?
4. Exclusão definitiva ou lógica (soft delete)?
5. Valores padrão e máximo da paginação?
6. O que cada funcionalidade de estudo (RF-08 a RF-14) deve fazer exatamente?

### Riscos

| Risco                                                          | Mitigação                                       |
| -------------------------------------------------------------- | ----------------------------------------------- |
| Integração com Google Agenda consome mais tempo que o previsto | Tratar como Should e deixar para a segunda fase |
| Escopo de funcionalidades de estudo crescer além do prazo      | Priorizar MVP e registrar o resto como fase 2   |
| Número de telas não cobrir a rubrica                           | Resolver a pergunta 2 antes de implementar      |

### Premissas (proposta)

- A autenticação usa JWT e não há perfis de permissão
- O CPF é obrigatório no cadastro por exigência da rubrica

## 12. Histórico de versões

| Versão | Data       | Mudança                                                                                                                                           |
| ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1    | —          | Rascunho inicial                                                                                                                                  |
| 0.2    | 2026-11-20 | Refatoração: IDs de requisitos, separação entre RF e RNF, regras transversais, modelo de dados, inventário de telas, riscos e perguntas em aberto |
