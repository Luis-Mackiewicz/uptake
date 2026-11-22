# Rubrica de Avaliação do Projeto

| Campo          | Valor                                      |
| -------------- | ------------------------------------------ |
| Nome completo  | Luis Miguel Oliveira de Almeida Mackiewicz |
| Link do GitHub | https://github.com/Luis-Mackiewicz/uptake  |
| Link do site   | em breve                                   |

## Disciplina: Back-end com IA Generativa

### Autenticação (0,5 ponto)

- [ ] Login com e-mail e senha
- [ ] Senha criptografada no banco
- [ ] Validação de e-mail (regex)
- [ ] Retorno de JWT
- [ ] Logar apenas usuário existente

### Cadastro de Usuário (1 ponto)

- [ ] Cadastro com os campos obrigatórios: nome, e-mail, senha, CPF
- [ ] Validação de CPF
- [ ] Validação de nível de senha
- [ ] Validação de e-mail

### Edição de Usuário (1 ponto)

- [ ] Rota autenticada
- [ ] Só pode editar o próprio usuário
- [ ] Garantir que todos os campos são obrigatórios
- [ ] Validação de CPF
- [ ] Validação de nível de senha
- [ ] Não permitir que o usuário altere o e-mail

### CRUDs Completos (1 ponto)

- [ ] 4 CRUDs completos (exceto o CRUD de usuários)
- [ ] 4 CRUDs com todas as rotas autenticadas
- [ ] Paginação das listagens
- [ ] Não editar/deletar recursos que não existem
- [ ] Ao menos 1 relacionamento entre os recursos

### Configuração de Agentes (0,5 ponto)

- [ ] Criação do arquivo `AGENTS.md`
- [ ] Definição de 3 skills específicas para os agentes
- [ ] Implementação de guardrails para limitar ações e comportamentos do agente
- [ ] Proteção de arquivos sensíveis, impedindo que o agente leia ou exponha variáveis e credenciais do `.env`

---

## Disciplina: Front-end

### Autenticação (0,5 ponto)

- [ ] Campos para e-mail e senha
- [ ] Validação de e-mail (regex)
- [ ] Armazenar o token no `localStorage`
- [ ] Lidar com os erros da API de forma amigável para o usuário
- [ ] Redirecionar para a área logada

### Cadastro de Usuário (1 ponto)

- [ ] Campos obrigatórios: nome, e-mail, senha, CPF
- [ ] Verificação dupla de senha
- [ ] Validação de CPF
- [ ] Validação de e-mail
- [ ] Redirecionar para o login após o cadastro
- [ ] Lidar com as mensagens de erro da API

### Edição de Usuário (1 ponto)

- [ ] Utilizar contexto para exibir informações do usuário globalmente
- [ ] Validação de CPF
- [ ] Validação de nível de senha
- [ ] Confirmação da senha
- [ ] Não permitir que o usuário altere o e-mail

### CRUDs Completos

- [ ] 4 CRUDs completos (exceto o CRUD de usuários)
- [ ] Paginação das listagens
- [ ] Validação dos campos obrigatórios
- [ ] Listagem e cadastro/edição em telas separadas

### Componentização

- [ ] Componentes genéricos e reutilizáveis
- [ ] Telas compostas por vários componentes
- [ ] Separação dos componentes e páginas em pastas separadas
- [ ] Componentes exclusivos da página em funções separadas

---

## Disciplina: Ferramentas DevOps

- [ ] **Organização do `docker-compose.yml`**: código bem indentado, com separação clara de serviços, uso de volumes, redes e variáveis de ambiente
- [ ] **Integração entre serviços**: backend conecta ao MySQL, frontend consome o backend, Nginx atua como proxy
- [ ] **Persistência de dados no MySQL**: uso correto de volumes para manter os dados mesmo após reinício
- [ ] **Configuração do Nginx como proxy reverso**: redirecionamento de requisições para frontend e backend de forma funcional
- [ ] **Isolamento e restrição de acesso via Docker Network**: garantir que apenas o Nginx esteja exposto diretamente fora do container

---

## Disciplina: TechForge (TypeScript e POO)

- [ ] **Encapsulamento e Proteção do Estado**
  - [ ] Proteção do estado interno dos objetos contra modificações indevidas
  - [ ] Uso correto de modificadores de acesso (`private`, `protected`, `public`) ou campos privados nativos (`#field`)
  - [ ] Construtores limpos, com a devida inicialização das propriedades
- [ ] **Acesso Controlado e Propriedades**
  - [ ] Getters e setters (`get`/`set`) usados apenas quando há validações, transformações ou regras de negócio
  - [ ] Atributos não expostos de forma desnecessária
- [ ] **Modelagem do Domínio e Pilares da POO**
  - [ ] Abstração do problema em entidades bem estruturadas (classes e atributos)
  - [ ] Herança e classes abstratas (`abstract class`) onde há reuso legítimo de código
  - [ ] Polimorfismo por contratos comuns ou sobrescrita de métodos
- [ ] **Tipagem Avançada e Recursos do TypeScript**
  - [ ] Estruturas definidas com interfaces e type aliases
  - [ ] Ausência de uso indevido de `any`
  - [ ] Uso de Generics para reuso de código tipado
- [ ] **Aderência aos Princípios SOLID**
  - [ ] Classes com responsabilidade única (S)
  - [ ] Extensão sem alteração do código base (O)
  - [ ] Subclasses substituem as classes base sem quebrar a aplicação (L)
- [ ] **Tratamento de Exceções e Organização do Código**
  - [ ] Erros customizados por meio de classes de exceção
  - [ ] Arquivos organizados em pastas (entidades, serviços, repositórios)
  - [ ] Padronização de nomenclatura segundo as convenções da linguagem

---

## Disciplina: TechAcademy (Evolução do projeto)

- [ ] A proposta desenvolvida tem conexão com a persona/cliente?
- [ ] O projeto utilizou os conceitos e aplicação de TypeScript, sem uso de JS injetado em alguns momentos?
