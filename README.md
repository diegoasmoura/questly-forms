# Questly Forms - Gestão Clínica para Psicólogos

Uma plataforma moderna e intuitiva para psicólogos gerenciarem pacientes, criarem formulários clínicos baseados em evidências e acompanharem a evolução terapêutica através de dados.

### Altura das Páginas

O **Layout.jsx** usa `h-screen` no container de conteúdo, com `<main className="flex-1 overflow-y-auto">`. Páginas renderizadas dentro do `<main>` usam altura natural do conteúdo com scroll no container principal.

## Sistema de Design Visual (v2 — Atualizado)

### Paleta de Cores

| Elemento | Light | Hex | Dark | Hex |
|----------|-------|-----|------|-----|
| **Background** | Cinza claro | `#F7F8FA` | Cinza escuro | `#15171A` |
| **Superfície (Cards/Sidebar)** | White | `#FFFFFF` | Cinza médio | `#1D2023` |
| **Superfície alt.** | Cinza | `#F1F3F5` | Cinza escuro | `#242830` |
| **Bordas** | Cinza | `#E8ECEF` | Cinza escuro | `#2B2F35` |
| **Primary (Sage)** | Verde sálvia | `#5CBF9D` | — | `#5CBF9D` |
| **Sage Light (bg)** | Verde claro | `#E4F5EE` | Verde escuro | `#1E332C` |
| **Dark Green (text)** | Verde escuro | `#3D786A` | — | `#3D786A` |
| **Blue (accent)** | Azul | `#2E7DFF` | — | `#2E7DFF` |
| **Blue Light (bg)** | Azul claro | `#E7F0FF` | Azul escuro | `#182636` |
| **Peach (accent)** | Pêssego | `#F8A26B` | — | `#F8A26B` |
| **Peach Light (bg)** | Pêssego claro | `#FEEEE1` | Pêssego escuro | `#31241C` |
| **Purple (accent)** | Roxo | `#7C5CFF` | — | `#7C5CFF` |
| **Purple Light (bg)** | Roxo claro | `#F0ECFF` | Roxo escuro | `#241F38` |
| **Texto Principal** | Quase preto | `#1E1F22` | Quase branco | `#F5F6F7` |
| **Texto Secundário** | Cinza | `#495057` | Cinza claro | `#C3C9D0` |
| **Texto Muted** | Cinza claro | `#9BA3AB` | Cinza médio | `#7C848D` |

### Dark Mode

Toggle de tema no header da Home (🌙/☀️) em formato pill com knob gradient. A preferência persiste em `localStorage`. O tema é gerenciado pelo `ThemeContext` que aplica a classe `dark` no `<html>`, ativando as variáveis CSS do tema escuro.

**Hierarquia de superfícies no dark mode:**
- `#15171A` → Canvas / Background
- `#1D2023` → Sidebar / Cards / Painéis
- `#242830` → Superfície alternativa / Hover

### Tipografia

| Uso | Fonte | Weight |
|-----|-------|--------|
| **UI / Body** | Nunito Sans | 400, 600, 700, 800 |
| **Títulos / Logo** | Caveat Brush | 400 (cursiva) |

### Sidebar (Navegação)

| Elemento | Valor |
|----------|-------|
| **Fundo** | `var(--surface)` (light: white, dark: `#1D2023`) |
| **Largura (recolhida)** | 84px |
| **Largura (expandida)** | 220px |
| **Toggle** | Botão circular na borda (absolute, `-right-[13px]`) |
| **Logo** | Gradient circle "Q" + "Questly Forms" (Caveat Brush) |
| **Nav item (inativo)** | `text-[var(--text-muted)]`, hover: `var(--surface-alt)` |
| **Nav item (ativo)** | `bg-[var(--sage-light)] text-[var(--dark-green)]` (dark: `text-[#5CBF9D]`) |
| **Nav item tamanho** | 46×46px, `rounded-[14px]` |
| **Bottom** | Botão "Sair" com icon apenas |

### Home Dashboard — Novo Layout (v3)

**Greeting Section:**
- Saudação dinâmica ("Bom dia / Boa tarde / Boa noite") com nome do usuário
- SVG underline personalizado do nome em `#5CBF9D`
- Blobs decorativos (peach-light, sage-light, purple-light com blur)
- Chips: "3 avaliações pendentes" (peach) e "N novas respostas" (sage)
- Theme toggle gradient, Bell icon com dot, Avatar gradient purple→blue

**Stat Cards (5 colunas):**
- Cada card com ícone (colored bg), trend badge, valor e label
- Cores alternadas: sage (presenças), blue (aniversários), peach (recebimentos), purple (cobranças/faltas)
- Cards com `rounded-[14px]` e sombra sutil

**Content Grid (3 Colunas Assimétricas — 30% / 40% / 30%):**
- **Coluna 1 (30%):** Painel "Agenda de Hoje" com altura fixa de `500px`, timeline de sessões com avatares de cores suaves baseados no hash do paciente e lista de contagem de sessões dos próximos dias na parte inferior.
- **Coluna 2 (40%):** 
  - **Gráfico de Faturamento:** Gráfico de área (Recharts) com curva monotone e gradiente de preenchimento pêssego (`var(--peach)`) exibindo a evolução financeira dos últimos 6 meses.
  - **Grid Lateral:** Exibe lado a lado o card de **Instrumentos Clínicos** (com taxa de resposta) e o card de **Aniversários (7 dias)**.
- **Coluna 3 (30%):**
  - **Perfil da Base:** Consolidação de pacientes ativos no mês, gráfico circular de gênero e gráficos horizontais de faixa etária.
  - **Lembretes Rápidos:** Card de afazeres/lembretes rápidos com input para adição, exclusão e toggle de conclusão (com corte de texto dinâmico), persistido automaticamente no `localStorage`.

### Sistema de Cores Funcionais

| Status | Cor | Hex (light) | Hex (dark) | Uso |
|--------|-----|-------------|------------|-----|
| **Sucesso** | sage (brand) | `#5CBF9D` | `#5CBF9D` | confirmações, respondidos, botão primário |
| **Info** | blue (secondary) | `#2E7DFF` | `#2E7DFF` | informativos, links |
| **Alerta** | amber | `#d97706` | `#fbbf24` | avisos, justificadas, pendentes |
| **Erro** | red | `#ef4444` | `#f87171` | erros, faltas, perigo |
| **Neutro** | slate | `#64748b` | `#94a3b8` | elementos secundários |

## Regras de Negócio e Lógica do Sistema

### 1. Gestão de Agenda e Horários (Appointments)
- **Configuração no Prontuário:** Slots recorrentes configurados diretamente no perfil do paciente.
- **Data de Início por Slot:** Permite agendamentos futuros e datas de início distintas para cada horário semanal.
- **Inativação Inteligente:** Sugere liberação de horários ao inativar pacientes, preservando o histórico.

### 2. Sistema de Frequência e Status (Attendance)
- **Status da Sessão:** Presença (Verde), Falta (Vermelho) e Justificada (Âmbar).
- **Reagendamento em Cadeia:** Justificativas geram registros filhos vinculados, mantendo a linhagem clínica.
- **Exclusão em Cascata:** Deletar uma justificativa remove automaticamente seus reagendamentos vinculados.
- **Coloração dos Eventos no Calendário (Agenda):**
  - Todos os agendamentos iniciam **cinza** (`bg-slate-400`) — representa "Agendado" (neutro, sem ação tomada).
  - A cor só é alterada **após** o psicólogo registrar manualmente o status da sessão via modal de detalhes:
    - **Presença** → `bg-emerald-500` (verde)
    - **Falta** → `bg-red-500` (vermelho)
    - **Justificada** → `bg-amber-500` (âmbar)
  - Esta regra se aplica tanto à **barrinha lateral** dos eventos no calendário (`BigCalendar`) quanto ao **card da sessão** no painel direito e ao **ícone de inicial** do paciente.
  - **Exceção:** O marcador de hoje (círculo preto) e o dia selecionado (círculo âmbar) no calendário são independentes do status da sessão.

### 3. Gestão Financeira e PDFs (v4.3)
- **Conciliação Clínica:** Vincula pagamentos a sessões específicas para controle de pendências.
- **Relatórios Avançados:** Uso de `jspdf-autotable` para relatórios consolidados com agrupamento por `rowSpan`.
- **Identidade Visual:** Favicon personalizado "Q" e título profissional na aba do navegador.
- **Status do Recibo:** Controle visual de emissão (Emitido, Com Anexo, Pendente).
- **Botões no Card Financeiro:** "Lançar" e "Gerar Relatório Completo" realocados para fora do quadrante cinza, alinhados à direita com `justify-end` (mesmo padrão da aba Agenda).
- **Reset de Filtro entre Abas:** Os filtros "Personalizado" das abas Frequência, Financeiro e Agenda são resetados sincronamente via `handleTabChange` ao trocar de aba, evitando que um mês selecionado persista entre contextos.
- **Reset do Seletor Custom:** Ao clicar em "Este Mês" ou "Mês Anterior", o valor interno do seletor "Personalizado" (`customMonth`/`calendarCustomMonth`) também é atualizado. Assim, ao reabrir "Personalizado", o mês exibido corresponde ao filtro ativo.

### 4. Operações Individuais (Agenda)
- **DELETE /:id** — exclui um agendamento individual (sem cascata em attendances)
- **POST /** — cria um agendamento individual
- **PUT /:id** — atualiza um agendamento individual (campos parciais)
- **POST /batch** — usado APENAS para salvar configuração completa de slots (settings), não para operações individuais
- **Integridade:** Appointments e Attendances NÃO têm FK direta; excluir um agendamento não afeta registros de presença
- **maxSessions e Timezone:** A função `appointmentOccursOnDate` (e duplicatas) usava `new Date(app.startDate.split("T")[0])`, que interpreta "YYYY-MM-DD" como UTC. No Brasil (UTC-3), `getDay()` retornava o dia errado, impedindo o contador de sessões de incrementar. Corrigido com `parseLocalDateStr` que usa o construtor `Date(year, monthIndex, day)` no timezone local.

### 5. Cadastro de Pacientes e Integridade (v4.4)
- **Campos Obrigatórios (Ética e Segurança):** Nome, CPF, Data de Nascimento (Identificação), E-mail, Telefone (Contato), Telefone e Nome de Emergência (Emergência) são mandatórios para garantir a segurança clínica e conformidade com emissão de documentos.
- **Abas do Formulário:** Cadastro e edição organizados em 4 abas: Identificação, Contato, Emergência, Endereço. A aba Emergência contém telefone e nome do contato de emergência, separada do contato principal do paciente.
- **Validação de Duplicidade:** O sistema impede o cadastro de CPFs duplicados para o mesmo psicólogo, fornecendo feedback visual imediato.
- **UX de Validação Inteligente:** Em formulários com abas, o sistema detecta campos obrigatórios faltantes e redireciona automaticamente o usuário para a aba correta, exibindo uma mensagem de alerta detalhada.
- **Feedback Visual de Erros:** Substituição de alertas genéricos por mensagens integradas ao design do modal, com animações de atenção (shake) em caso de falha.
- **RG removido** do formulário de cadastro e edição (não é mais solicitado).

### 6. Cadastro de Pacientes e Importação Excel (v4.5)
- **Importação via Excel:** Modelo geração via **ExcelJS** com suporte a 3 formatos de data:
  - **DD-MM-YYYY** (ex: 15-01-1990) - formato brasileiro
  - **YYYY-MM-DD** (ex: 1990-01-15)
  - **Serial do Excel** (ex: 32874)
- **Cabeçalho verde** (Emerald-600)
- **Larguras padronizadas** por coluna
- **Dropdowns** em Gênero e Estado Civil
- **Feedback Visual:** Mensagens detalhadas com linha do erro

### 7. UX de Visualização de Pacientes
- **Modo Card:** Excluir junto com botões de ação (sem botão separado no topo)
- **Modo Lista:** Ordem de botões: Prontuário (destacado) > Editar > Excluir
- **Dropdown de Cadastro:** Cada botão com estado independente; "Cadastrar" (topo) alinhado à direita, "Cadastrar Paciente" (vazio) centralizado

### 8. UX do Calendário (Agenda) e Painel Direito
- **Layout duas colunas:** Calendário (`w-[75%]`) + Agenda/Sidebar (`w-[25%]`) lado a lado com `flex gap-6`
- **Avatares nos cards:** Usam as duas primeiras letras do primeiro nome (ex: "Diego Moura" → `DI`), obtidas via `name.split(" ")[0].slice(0, 2).toUpperCase()`, aplicado em todos os módulos (Agenda, Home, Patients, FormResponses, ResponseDetail, PatientRecord)
- **react-day-picker v9** com DayButton customizado, tintas de fundo (verde/âmbar/vermelho) e barra verde inferior para sessões do paciente
- **Células dinâmicas:** Linhas com `h-0` distribuem altura igualmente via `flex-1 table-fixed`; botões preenchem com `h-full`
- **Filtro permanente:** Painel direito sempre exibe apenas horários do paciente atual via `myAppointmentIds`
- **Cards:** `flex gap-2` com `flex-1` no texto, sem `justify-between` — nome/descrição e horário/botões ficam próximos
- **Frame-wrapper:** Calendário envolto em `p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col h-full`
- **Painel Direito (Agenda):** Estrutura em duas camadas:
  - Wrapper scrollável: `flex-1 min-h-0 overflow-y-auto flex flex-col` — contém o card de detalhes do dia (quadro cinza com `bg-slate-50`, `flex-1` para preencher espaço)
  - Botões de ação: fora do scroll, em div `shrink-0` com `justify-end`, usando `btn btn-primary` (verde, "Lançar") e `btn btn-danger` (vermelho, "Limpar Agenda")
  - Espaçamento: `gap-3` no painel direito separa o quadro cinza dos botões
- **Data do "Lançar":** O botão "Lançar" considera o dia selecionado no calendário. Se o dia clicado estiver no mês exibido, usa esse dia. Caso contrário (navegou para outro mês sem clicar em nenhum dia): se for o mês atual, usa a data de hoje; se for um mês futuro, usa o primeiro dia útil do mês (`getFirstBusinessDay`).
- **Modal de Agendamento (Novo/Editar):**
  - Renderizado fora do container `animate-fade-in` (que aplica `transform`, criando um containing block para `position: fixed`) para que o overlay `backdrop-blur-sm` cubra a viewport inteira, não apenas o painel direito
  - O `return` do componente usa fragmento `<>...</>` para permitir que o modal e o grid de layout coexistam no mesmo nível
  - Slots já configurados são exibidos apenas no painel direito (a seção "Horários já configurados para X" foi removida do modal para evitar duplicação de informação)
  - Cada slot no modal exibe apenas horário e duração (sem label "Semanal" nem nome do paciente)
- **Mês como visão padrão:** Tanto na Agenda quanto no PatientRecord, `selectedDay`/`selectedCalendarDay` inicia como `null`, exibindo a **visão do mês** (todas as sessões do mês visível agrupadas por data). Ao clicar em um dia, o painel direito mostra a **visão do dia**. O label do mês no topo do calendário é clicável (`cursor-pointer`) para retornar à visão do mês. A navegação entre meses (`onNavigate`, period filter, setas) limpa o dia selecionado automaticamente.

### 9. Navegação Suave
- Hook `useNavigateWithTransition` adiciona delay de 300ms antes de trocas de página:

```jsx
import { useNavigateWithTransition } from "../lib/useNavigateWithTransition";

const navigate = useNavigateWithTransition();
navigate("/path"); // com delay padrão (300ms)
navigate("/path", { delay: 0 }); // sem delay (ex: logout)
navigate(-1); // suporta navegação relativa
```

### 10. outras UX
- **Modal de Detalhes do Agendamento (AppointmentDetailModal):** Componente único usado em Home e Agenda. Exibe dados do paciente, status (Presença/Falta/Justificado), telefone formatado (`formatPhone`), link WhatsApp, "Ir para Prontuário" e Excluir Agendamento. Suporta sessões do tipo `fixed` (skipDates para recorrências) e `extra` (atendimentos avulsos via `api.deleteAttendance`).
- **Navegação Consistente:** Elementos como Avatares, Nomes e Ícones são links diretos para prontuários.
- **Semana de Aniversário:** Visual festivo automático (dourado/confetes) em janela de 7 dias.
- **Métricas de Engajamento:** Comparação entre assiduidade física (Sessões) e digital (Instrumentos).
- **Tooltips Instantâneos:** Balões informativos sem delay.
- **UX de Portals:** Modais usam fragmento na raiz do componente para evitar containing blocks com `transform`; o backdrop cobre 100% da viewport.
- **Gestão UTC:** Datas em UTC, extraídas conforme fuso local.
- **Toasts Flutuantes:** Confirmações em Emerald-600, erros em Red-500. Invocar via `toast("mensagem", "success" | "error", durationMs)` — usado no CustomFormBuilder ao salvar.
- **Clinical Dashboard:** Métricas de engajamento na capa do card.
- **Patient Record:** Padronização de abas com header e botão Save (Prontuário incluso). Ordem das abas: Histórico → Agenda → Financeiro → Instrumentos → Prontuário. Aba "Emergência" adicionada ao formulário de edição (Identificação → Contato → Emergência → Endereço).
- **Instrumentos (Share):** Não utiliza mais expiração de links. Removidos: seletor de validade no modal, contagem de expirados, renovação de links, dias restantes nos cards e filtro por expiração. Status passam a ser apenas Pendente e Respondido. Tabela com colunas: Instrumento, Progresso, Status, Última resposta, Criado em, Link, Excluir.
- **Tabelas padronizadas:** Cabeçalhos das tabelas nas abas Financeiro e Instrumentos usam o mesmo padrão: `text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200` com padding `px-2 py-2`.
- **Scroll padding:** Containers com `overflow-y-auto` e cards filhos devem usar `pr-1.5` para evitar que os cards encostem na barra de rolagem vertical.

### 11. Construtor de Instrumentos Customizado

Substitui o SurveyJS FormBuilder por uma solução própria com card-style:

**CustomFormBuilder (`/forms/:id/edit`):**
- **Modo de Exibição:** Seletor "Contínua" / "Paginada" no header. Contínua mostra todas as perguntas juntas; Paginada exibe uma seção por vez com navegação Anterior/Próxima.
- **Organização por seções:** Adicionar, renomear e remover seções. Cada seção vira uma página no modo Paginada.
- **Mover perguntas entre seções:** No painel de edição da pergunta, botões "Mover para [Seção]" para transferir perguntas entre seções.
- **Drag-and-drop nativo:** Reordenar perguntas usando `draggable`, sem dependências externas.
- **Edição inline:** Clique no card para editar título, tipo, opções e configurações diretamente — sem modal.
- **Toolbox visual:** Botões com ícones para cada tipo de pergunta (Texto, Número, Sim/Não, Escolha, Likert, Matriz).
- **Mini-preview:** Cada pergunta exibe uma prévia visual do seu formato de resposta (ex: Likert mostra 6 quadradinhos numerados).
- **Preview ao vivo:** Alternar entre edição e visualização do formulário completo. A prévia respeita o modo de exibição e mostra botão "Finalizar Teste" para simular o fluxo de preenchimento.
- **Exportar JSON:** Download do schema em formato JSON.
- **Toast notifications:** Feedback visual de save/erro via toast flutuante (canto inferior direito).
- **Tipos de pergunta suportados:**
  - **Texto:** Simples ou multiline, com placeholder configurável.
  - **Número:** Com mínimo e máximo.
  - **Sim/Não:** Rótulos personalizáveis (`trueLabel`/`falseLabel`).
  - **Escolha:** Única ou múltipla, com opções editáveis.
  - **Escala Likert:** Opções numeradas com grade visual e legenda.
  - **Matriz:** Linhas × colunas para grids de resposta.

**CustomFormRenderer:**
- Renderiza formulários no formato customizado (não SurveyJS).
- **3 modos de exibição:**
  - **Contínua:** Todas as seções e perguntas em sequência (padrão).
  - **Paginada:** Uma seção por vez com navegação Anterior/Próxima e progresso.
  - **Stepper:** Uma pergunta por vez com grade numérica (1–6), atalhos de teclado e auto-avanço — ideal para escalas longas como YSQ-L3 (232 itens).
- O modo é definido pelo campo `mode` no schema: `"continuous"`, `"paginated"` ou `"stepper"`.
- **Aparência card-style:** Mesma identidade visual do builder, com botões em formato de pílula para seleção, inputs com borda arredondada e foco verde.
- **Suporte a readOnly e preview** para visualização de resultados e teste.
- **Modalidade Contínua:** Exibe todas as perguntas agrupadas por seção com cabeçalhos expansíveis. Mostra botão "Finalizar Teste" em preview.
- **Modalidade Paginada:** Navegação entre seções com botões Anterior/Próxima e indicador de progresso (ex: "1–5 de 20"). Na última seção mostra "Enviar Respostas".
- **Modalidade Stepper:** Card centralizado com pergunta atual, grade numerada para escalas Likert, legendas completas (ex: "1 - Inteiramente falsa"), atalhos de teclado (1–6 para responder, ← → para navegar, Enter para avançar) e auto-avanço 500ms.

### 12. YSQ-L3 (Young Schema Questionnaire)

O instrumento **YSQ-L3** (232 itens, 18 domínios) está disponível no Acervo Clínico:
- Schema em formato SurveyJS no template (`frontend/src/lib/templates.js`).
- Conversão automática via `convertSurveyJSToCustom()` no backend e frontend.
- Pontuação por domínio com 3 faixas clínicas: Baixa, Alta, Muito Alta.
- Cards de severidade no dashboard de respostas com codificação por cores (emerald, amber, red).

### 13. Esquema de Dados do Formulário Customizado

```json
{
  "title": "Meu Instrumento",
  "mode": "continuous",
  "pages": [
    {
      "title": "Seção 1",
      "questions": [
        {
          "id": "q_abc123",
          "type": "boolean",
          "title": "Você concorda?",
          "required": true,
          "trueLabel": "Sim, concordo",
          "falseLabel": "Não concordo"
        }
      ]
    }
  ]
}
```

**Campos do schema:**
- `title` (string): Nome do formulário.
- `mode` (string): Modo de exibição — `"continuous"` (todas juntas), `"paginated"` (uma seção por vez) ou `"stepper"` (uma pergunta por vez, legado YSQ).
- `pages` (array): Lista de seções, cada uma com `title` e `questions`.

**Tipos de pergunta suportados:** `text`, `number`, `boolean`, `choice`, `likert`, `matrix`.

### 14. Layout do PatientRecord (Regras para evitar scrollbar externa)

A página `PatientRecord.jsx` usa uma estrutura de layout específica que deve ser mantida para evitar que a barra de rolagem externa apareça ao alternar entre abas:

**Estrutura do Grid:**
- Ambas as colunas (sidebar + conteúdo) DEVEM estar DENTRO do mesmo grid: `<div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full min-h-0">`
- O container externo usa `overflow-hidden` para eliminar a scrollbar da página
- Cada coluna usa `flex flex-col min-h-0` para permitir encolhimento

**Sidebar (coluna esquerda):**
- Card usa `flex-1 flex flex-col min-h-0`
- Campos do paciente (Email, Telefone, Nascimento, Paciente desde) em div `shrink-0 space-y-3`
- Quadro cinza de Anotações entre os campos e o botão, com `flex-1 overflow-y-auto` para preencher espaço e permitir scroll interno se o texto for longo
- Rótulo "Anotações" fica fora do quadro cinza, alinhado horizontalmente com `px-2` (igual aos demais labels)
- Espaçamento vertical entre campos e Anotações: `pt-3` no wrapper do quadro (equivale ao `space-y-3`)
- Botão "Ver Dados Completos" em div `shrink-0 mt-4`, sem CPF exibido
- Email e Telefone são exibidos apenas como texto, SEM botões Enviar/Ligar

**Abas (coluna direita):**
- Header das abas (`shrink-0`) + wrapper de conteúdo (`flex-1 flex flex-col min-h-0`)
- Cada aba usa `flex flex-col flex-1 min-h-0` como wrapper
- O card principal de cada aba (ex: timeline, tabela) usa `flex-1 min-h-0 overflow-y-auto` para scroll interno
- NUNCA usar `overflow-y-auto` no container externo ou na coluna direita

**Cards de estatísticas (overview):**
- Todos os stat cards usam `p-3`, ícone `w-10 h-10 rounded-xl`, número `text-2xl font-black`, label `text-[10px] font-bold uppercase tracking-widest`
- Dispostos em `grid grid-cols-1 md:grid-cols-4 gap-3`
- Cada card tem `border-l-4` com a cor correspondente ao status (emerald=sucesso, blue=info, amber=alerta, red=erro, slate=neutro)
- As cores seguem o sistema de design visual: apenas as 5 cores do palette (emerald, blue, amber, red, slate) — **não usar** sky, violet, indigo ou outras cores Tailwind fora da paleta definida

**Cards de conteúdo (Frequência, Financeiro, Agenda, Instrumentos, Prontuário):**
- Padrão de duas camadas: card branco externo (`card p-6`) + quadro cinza interno (`p-4 bg-slate-50 rounded-xl border border-slate-200 flex-1 flex flex-col min-h-0`)
- O `flex-1` no quadro cinza faz ele preencher o espaço disponível até os botões de ação
- **Prontuário:** É um formulário (anexos em cima + textarea de anotações em baixo com `flex-1`), não uma tabela, mas segue o mesmo layout de card + quadrante cinza + botões de ação

**Botões de ação:**
- Botões simplificados: `btn btn-primary` (verde) e `btn btn-danger` (vermelho)
- Posicionados fora do quadro cinza, alinhados à direita com `justify-end`

**Headers dos cards:**
- Headers usam `mb-8 shrink-0` em vez de `border-b` e ficam dentro do `p-8` do card
- **UX de Registro:** Área clicável para upload de anexos.

### 15. Padrão de Modais (Backdrop, Posicionamento e Z-Index)

Todo modal que exibe um overlay (backdrop) deve seguir este padrão único:

```jsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
  {/* conteúdo do modal */}
</div>
```

**Regras:**
- **`fixed inset-0`** — cobre a viewport inteira de forma uniforme (não usar `absolute`)
- **`bg-black/50`** — preto com 50% de opacidade, suave mas cobre o conteúdo atrás
- **`backdrop-blur-sm`** — desfoque sutil para suavizar o que está atrás
- **`z-[60]`** — sempre este valor (sidebar usa `z-[10000]` e fica acima de todos os modais)
- **Renderização inline** (dentro do JSX do componente, sem `createPortal`) — a sidebar com `z-[10000]` garante que ela não seja coberta
- **Exceptions:** Se um modal precisar ficar dentro de uma árvore com `transform` (que cria containing block), use `createPortal(..., document.body)` para manter `fixed` funcionando — mas o backdrop e z-index devem ser os mesmos

**Histórico da decisão:**
- `absolute inset-0` foi tentado mas causava artefatos de "camadas" entre textos e não cobria uniformemente
- `bg-slate-900/40`, `bg-slate-900/80` e `bg-emerald-900/60` foram substituídos por `bg-black/50` para consistência visual
- `z-50` e `z-[9999]` foram unificados em `z-[60]`; a sidebar em `z-[10000]` fica acima para não ser coberta pelo backdrop

## Tecnologias

- **Frontend:** React, Tailwind CSS, Lucide React, date-fns, jsPDF, jsPDF-AutoTable.
- **Backend:** Node.js, Express, Prisma ORM (PostgreSQL).
- **Infraestrutura:** Docker, Docker Compose, Nginx.

## Como Iniciar (Desenvolvimento)

1.  **Dependências:** `npm install` (na raiz, frontend e backend).
2.  **Banco de Dados:** `npx prisma db push` (dentro da pasta backend).
3.  **Execução:** `npm run dev` (na raiz).

## Deploy no NAS (TerraMaster / Portainer)

Configuração de produção otimizada para processadores Intel (como o F2-424):

1.  **Arquivos:** Utilize o `docker-compose.nas.yml` e Dockerfiles de produção (`.prod`).
2.  **Variáveis:** Baseie sua configuração no arquivo `.env.docker`.
3.  **Portainer:** Crie um novo Stack, cole o conteúdo do compose e faça o deploy.
4.  **Acesso:** Disponível em `http://IP-DO-NAS:8080`.

---

*Este projeto segue rigorosos padrões de integridade de dados clínicos e UX voltada para produtividade.*
