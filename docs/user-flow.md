```mermaid
flowchart TD

    usuario((Usuário))
    home[Página inicial]
    login[Login]
    registrar[Registrar]
    dashboard[Dashboard]
    provas[Provas]
    anotacoes[Anotações]
    config[Configurações]
    ciclo[Ciclo de estudos]
    todo[Todo]

    usuario --> home
    home --> auth{O usuário possui conta?}
    auth -->|Sim| login
    auth -->|Não| registrar

    login --> dashboard
    registrar --> dashboard

    dashboard --> provas
    dashboard --> anotacoes
    dashboard --> config
    dashboard --> todo

    provas --> ciclo
    provas --> config
    provas --> todo
    provas <--> anotacoes

    ciclo <--> anotacoes
    ciclo <--> todo
    ciclo --> config


    subgraph Sidebar [Sidebar - Acesso Global]
        direction LR
        agenda[Google Agenda]
        musica[Música]
        pomodoro[Pomodoro Timer]
    end

    dashboard -.-> Sidebar
```
