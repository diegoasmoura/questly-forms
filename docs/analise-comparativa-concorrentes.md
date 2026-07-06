# Análise Comparativa de Concorrentes — QuestlyForms

Este documento compara o QuestlyForms com o cenário competitivo nacional (Corpora, Clínica Ágil, Psicoplanner, GestorPsi, Allminds e Sintropia) e detalha como podemos capturar o nicho de formulários clínicos baseados em evidência.

## 1. Cenário Competitivo (Competitive Landscape)

A partir da pesquisa de mercado, mapeamos as principais propostas de valor e limitações dos concorrentes frente à nossa plataforma:

### Corpora (R$ 150/mês)
* **Foco**: Suíte completa com design moderno e interface fluida.
* **Fraqueza**: Não possui diferenciação no construtor de formulários.
* **Vantagem QF**: Nosso **CustomFormBuilder** com cálculo dinâmico de pontuação e severidade entrega um valor muito superior para psicólogos que dependem de instrumentos específicos (como Terapia de Esquemas).

### Clínica Ágil (R$ 199/mês)
* **Foco**: Suíte complexa voltada para clínicas grandes com múltiplos profissionais.
* **Fraqueza**: Interface sobrecarregada, fluxo burocrático e falta de foco em evolução clínica digitalizada.
* **Vantagem QF**: UX Notion/Linear-like rápida, focada no fluxo individual e evolução baseada em gráficos clínicos interativos.

### Psicoplanner (R$ 100/mês)
* **Foco**: Gestão integrada com assistente de IA.
* **Fraqueza**: Sem formulários clínicos estruturados e sem biblioteca de escalas validadas.
* **Vantagem QF**: Possuímos a maior biblioteca nativa de testes científicos (BDI-II, BAI, DASS-21, YSQ-L3), oferecendo evidência mensurável.

### GestorPsi (R$ 80/mês)
* **Foco**: Pragmático, com muitos anos de mercado.
* **Fraqueza**: Interface visual antiga (UX datada), sem suporte a formulários modernos ou compartilhamento dinâmico.
* **Vantagem QF**: Identidade visual premium, suporte a PWA (offline) e links públicos de agendamento que geram leads diretamente no funil Kanban.

### Allminds (Preço Desconhecido)
* **Foco**: Ecossistema voltado para comunidade, cursos e gestão clínica.
* **Fraqueza**: Prontuário eletrônico básico, sem automações ou inteligência baseada em dados.
* **Vantagem QF**: Foco total na excelência da prática clínica e acompanhamento de progresso do paciente baseado em evidências.

### Sintropia (R$ 90/mês)
* **Foco**: Notas inteligentes de sessão estruturadas por Inteligência Artificial.
* **Fraqueza**: Ausência de instrumentos validados e testes psicológicos estruturados.
* **Vantagem QF**: Nossa biblioteca de escalas robusta aliada à futura integração da API do Gemini para estruturação de anotações (SOAP/RPD).

---

## 2. O Grande Diferencial: "Evidence-Based Clinical Forms"

O maior gap do mercado brasileiro de psicologia de gestão é a **falta de inteligência clínica nos dados**. Concorrentes tratam formulários como arquivos de texto estáticos ou PDFs anexados. 

O QuestlyForms lidera ao centralizar o fluxo de evolução do paciente em dados estruturados:
* **Lógica de Scoring**: O cálculo em [scoring.js](file:///home/clenio/Documentos/Meusagentes/questly-forms/frontend/src/lib/scoring.js) classifica a severidade de ansiedade, estresse e TDAH na hora, gerando alertas imediatos de ideação suicida (ex: no PHQ-9).
* **YSQ-L3 Nativo**: O questionário longo de esquemas de Young (232 perguntas) com divisão automática em 18 esquemas e gráfico de gravidade é um diferencial gigante que atrai instantaneamente terapeutas de esquema (que antes gastavam horas tabulando no Excel).
* **Gráficos Temporais de Evolução**: Visualização instantânea de progressão terapêutica (PHQ-9/GAD-7) que servem de evidência de melhora para o paciente, operadoras de saúde e supervisores.

---

## 3. O que Agregar no QuestlyForms?

Sugerimos as seguintes implementações estratégicas para o QuestlyForms:

1. **Smart Notes / Notas Rápidas por IA (Inspirado no Sintropia)**:
   - Integrar a API do Gemini para permitir que o psicólogo digite palavras-chave ou anotações rápidas pós-sessão e o sistema gere um relatório clínico estruturado no padrão **SOAP** (Subjetivo, Objetivo, Avaliação, Plano) ou **RPD** (Registro de Pensamentos Disfuncionais).

2. **Triagem Automática Pré-Consulta no CRM (Inspirado no Allminds/Clínica Ágil)**:
   - Quando o paciente se cadastrar ou agendar pelo link público `/booking/:slug`, o sistema pode disparar uma escala de triagem rápida (como DASS-21). A pontuação e o nível de estresse/ansiedade alimentam o card correspondente no Kanban do CRM como tags, permitindo que o psicólogo analise a demanda antes da primeira sessão.

3. **Laudos e Atestados com Assinatura Eletrônica**:
   - Módulo de assinatura eletrônica simples (com registro de IP, geolocalização e hashes de segurança) para permitir que psicólogos enviem laudos e declarações assinadas digitalmente diretamente pelo sistema.
