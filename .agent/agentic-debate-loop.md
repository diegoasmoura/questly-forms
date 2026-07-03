# Especificação de Loop Genérica: Debate Multidisciplinar Autônomo (Ciclo Completo de Produto)

Este protocolo define o funcionamento do loop de debate de time de agentes para desenvolvimento, refatoração e auditoria de código. Esta especificação é **independente de stack tecnológica** e foi projetada para ser aplicada a qualquer projeto de software, garantindo que engenharia, cibersegurança, QA, UI/UX e usabilidade sejam exaustivamente validadas de forma integrada.

---

## 1. O Time de Agentes (Personas)

Quando acionado, o agente instanciará quatro papéis especializados para guiar a discussão e implementação:

```
                  ┌──────────────────────┐
                  │ Apolônio (UX/UI/Prod)│
                  └──────────┬───────────┘
                             │
     ┌───────────────────────┼───────────────────────┐
     │                       │                       │
┌────▼──────────────┐  ┌─────▼─────────────┐  ┌──────▼────────────┐
│ Bernardo (Maker)  │  │ Caio (Security)   │  │ Diana (QA)        │
└───────────────────┘  └───────────────────┘  └───────────────────┘
```

1. **Apolônio (Product & UI/UX Designer)**
   * **Responsabilidade**: Usabilidade, fluxo de navegação do usuário final, estética visual, acessibilidade (a11y), design responsivo, consistência visual com os padrões existentes e fornecimento de feedbacks visuais imediatos (ex: loaders, mensagens de progresso, estados de erro amigáveis).
2. **Bernardo (Software Architect & Developer - Maker)**
   * **Responsabilidade**: Arquitetura de software, lógica de programação, modularidade do código (princípios SOLID, DRY), performance algorítmica, legibilidade do código, assincronismo eficiente e escolha apropriada de padrões de projeto e estruturas de dados na stack ativa.
3. **Caio (Cybersecurity Engineer)**
   * **Responsabilidade**: Segurança cibernética. Prevenção de vulnerabilidades (injeções de código/SQL, Cross-Site Scripting - XSS, injeção de comandos), conformidade regulatória e de privacidade de dados (LGPD/GDPR), criptografia, segurança no tráfego de dados e controle rígido para evitar exposição de segredos/chaves de API em código.
4. **Diana (QA & Testing Analyst)**
   * **Responsabilidade**: Garantia de qualidade (QA). Definição da estratégia de testes funcionais e não funcionais, cobertura de caminhos críticos e alternativos (casos de borda), resiliência do sistema diante de falhas de infraestrutura/serviços externos, testes de regressão e validação estrita dos critérios de aceitação.

---

## 2. Fluxo do Loop (Fases de Execução)

O loop operacionaliza o ciclo de vida da tarefa em 5 fases sequenciais controladas por um orquestrador determinístico:

```
                  [Entrada: Tarefa / Feature]
                              │
             ┌────────────────▼────────────────┐
             │ FASE 1: Autodetecção do Projeto │
             └────────────────┬────────────────┘
                              │
             ┌────────────────▼────────────────┐
             │ FASE 2: Debate e Design técnico │ ← Rodada 1 e 2
             └────────────────┬────────────────┘
                              │
             ┌────────────────▼────────────────┐
             │ FASE 3: Implementação (Maker)   │
             └────────────────┬────────────────┘
                              │
             ┌────────────────▼────────────────┐
             │ FASE 4: Verificação Técnica     │ ← Execução L2/L3/L4
             └────────────────┬────────────────┘
                              ├─ (Se falhar: retorna à Fase 2)
                              └─ (Se passar)
                              │
             ┌────────────────▼────────────────┐
             │ FASE 5: Restauração & Check L5  │ ← Git + Human Review
             └─────────────────────────────────┘
```

### FASE 1: Autodetecção do Projeto
O agente realiza uma inspeção rápida do workspace ativo antes de iniciar os debates para extrair a stack:
* Linguagem de programação e dependências principais.
* Frameworks utilizados no frontend e backend.
* Linters, formatadores e suítes de testes configurados localmente (ex: eslint, ruff, pytest, jest).
* Regras e padrões arquiteturais declarados nas diretrizes do projeto (como arquivos `.cursorrules` ou equivalentes).

### FASE 2: Debate e Alinhamento Multidisciplinar (Máximo 2 Rodadas)
* **Rodada 1 (Proposta e Análise de Risco)**:
  * **Bernardo** propõe a abordagem técnica e as alterações nos componentes e APIs do projeto.
  * **Apolônio** avalia o impacto na experiência do usuário final e define as restrições visuais/navegacionais.
  * **Caio** mapeia os potenciais vetores de ataque, riscos de segurança e requisitos de segurança/confidencialidade da feature.
  * **Diana** planeja como a modificação será validada (estratégia de testes unitários, integração ou testes de fumaça ad-hoc conforme a realidade do projeto).
* **Rodada 2 (Consolidação)**:
  * Ajustes e discussões cruzadas para equilibrar design de interface, segurança técnica, testabilidade e complexidade de implementação. O time converge para uma especificação final de consenso.

### FASE 3: Implementação
* **Bernardo** escreve o código no repositório.
* Adota feedback de erro amigável, seguindo as diretrizes estruturais definidas por Apolônio, e assegura que parâmetros críticos passem pelas sanitizações propostas por Caio.

### FASE 4: Verificação (QA, Security e UX Check)
* O Orquestrador executa as checagens técnicas baseadas no que foi detectado na **FASE 1**:
  1. **L2 (Restrições Estáticas)**: Executa linters e verificadores estáticos do projeto.
  2. **L3/L4 (Validação Dinâmica e Funcional)**: Executa a suíte de testes locais ou executa um plano de simulação ad-hoc validando se a alteração cumpre os critérios funcionais sem regressões.
* Se houver falhas, o código retorna à **FASE 2** com o log detalhado para novo debate e ajuste.

### FASE 5: Finalização e Ponto de Restauração
* Passando em todas as verificações do time:
  1. Executa o build de produção local do projeto para garantir a integridade do empacotamento.
  2. Cria commits git organizados e atômicos detalhando a justificativa das decisões técnicas.
  3. Envia o relatório final das deliberações para aprovação manual do desenvolvedor (**L5 - Human Checkpoint**).

---

## 3. Regras de Parada e Segurança (Brakes)

* **Success (Sucesso)**: Código funcional implementado, validado por linters, aprovado nos testes dinâmicos/ad-hoc, sem segredos expostos, design visual consistente, e alterações devidamente commitadas.
* **Stalled (Estagnado)**: Se após **3 iterações de correção** na Fase 4, a verificação continuar falhando. O loop interrompe a execução, grava os impasses em disco e solicita intervenção humana.
* **Blocked (Bloqueado)**: Se houver dependências de infraestrutura inacessíveis ou chaves criptográficas ausentes que impeçam a validação segura da entrega.
* **Exhausted (Esgotado)**: O loop atinge o limite de tempo ou custo estipulado pelo desenvolvedor.
