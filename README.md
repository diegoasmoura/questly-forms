# Questly Forms - Gestão Clínica para Psicólogos

Uma plataforma moderna e intuitiva para psicólogos gerenciarem pacientes, criarem formulários clínicos baseados em evidências e acompanharem a evolução terapêutica através de dados.

## Sistema de Design Visual

### Paleta de Cores

| Elemento | Cor | Hex |
|----------|-----|-----|
| **Background** | slate-100 | `#f1f5f9` |
| **Cards** | white | `#ffffff` |
| **Bordas Cards** | slate-200 | `#e2e8f0` |
| **Sidebar** | slate-900 | `#0f172a` |
| **Accent Primário** | emerald-600 | `#059669` |
| **Accent Hover** | emerald-700 | `#047857` |
| **Texto Principal** | slate-800 | `#1e293b` |
| **Texto Secundário** | slate-500 | `#64748b` |
| **Texto Labels** | slate-400 | `#94a3b8` |

### Sistema de Cores Funcionais

| Status | Cor | Uso |
|--------|-----|-----|
| **Sucesso** | emerald | confirmações, positivos |
| **Info** | blue | informativos |
| **Alerta** | amber | avisos |
| **Erro** | red | erros, perigo |
| **Neutro** | slate | elementos secundários |

## Funcionalidades Principais

- **Home (Visão Geral):** Resumo dinâmico de atividades, estatísticas de pacientes e gráficos de tendências clínicas.
- **Gestão de Pacientes (Clinical Dashboard):** Painel de controle individual com métricas unificadas de engajamento (Sessões vs Instrumentos), alertas de aniversário com visual festivo e tooltip instantâneo.
- **Agenda Profissional:** Gestão integrada de horários recorrentes, visão mensal/lista e detecção de conflitos.
- **Histórico de Frequência:** Registro detalhado de presenças, faltas e reagendamentos inteligentes em cadeia.
- **Gestão Financeira:** Controle de pagamentos por blocos de sessões, conciliação clínica e geração de PDFs profissionais.
- **Acervo Clínico:** Modelos validados como PHQ-9, GAD-7 e a **Anamnese Neuropsicológica Adulto (Completa)**.
- **Construtor de Instrumentos:** Criação de escalas, testes e anamneses personalizadas com SurveyJS v2.

## Regras de Negócio e Lógica do Sistema

### 1. Gestão de Agenda e Horários (Appointments)
- **Configuração no Prontuário:** Slots recorrentes configurados diretamente no perfil do paciente.
- **Data de Início por Slot:** Permite agendamentos futuros e datas de início distintas para cada horário semanal.
- **Inativação Inteligente:** Sugere liberação de horários ao inativar pacientes, preservando o histórico.

### 2. Sistema de Frequência e Status (Attendance)
- **Status da Sessão:** Presença (Verde), Falta (Vermelho) e Justificada (Âmbar).
- **Reagendamento em Cadeia:** Justificativas geram registros filhos vinculados, mantendo a linhagem clínica.
- **Exclusão em Cascata:** Deletar uma justificativa remove automaticamente seus reagendamentos vinculados.

### 3. Gestão Financeira e PDFs (v4.3)
- **Conciliação Clínica:** Vincula pagamentos a sessões específicas para controle de pendências.
- **Relatórios Avançados:** Uso de `jspdf-autotable` para relatórios consolidados com agrupamento por `rowSpan`.
- **Identidade Visual:** Favicon personalizado "Q" e título profissional na aba do navegador.
- **Status do Recibo:** Controle visual de emissão (Emitido, Com Anexo, Pendente).
- **Botões no Card Financeiro:** "Lançar" e "Gerar Relatório Completo" realocados para fora do quadrante cinza, alinhados à direita com `justify-end` (mesmo padrão da aba Agenda).
- **Filtro de Período Compartilhado:** Os filtros "Personalizado" das abas Frequência, Financeiro e Agenda são resetados para "Este Mês" sempre que o usuário alterna entre abas, evitando que um mês selecionado em uma aba persista ao mudar de contexto.

### 4. Operações Individuais (Agenda)
- **DELETE /:id** — exclui um agendamento individual (sem cascata em attendances)
- **POST /** — cria um agendamento individual
- **PUT /:id** — atualiza um agendamento individual (campos parciais)
- **POST /batch** — usado APENAS para salvar configuração completa de slots (settings), não para operações individuais
- **Integridade:** Appointments e Attendances NÃO têm FK direta; excluir um agendamento não afeta registros de presença
- **maxSessions e Timezone:** A função `appointmentOccursOnDate` (e duplicatas) usava `new Date(app.startDate.split("T")[0])`, que interpreta "YYYY-MM-DD" como UTC. No Brasil (UTC-3), `getDay()` retornava o dia errado, impedindo o contador de sessões de incrementar. Corrigido com `parseLocalDateStr` que usa o construtor `Date(year, monthIndex, day)` no timezone local.

### 5. Cadastro de Pacientes e Integridade (v4.4)
- **Campos Obrigatórios (Ética e Segurança):** Nome, CPF, Data de Nascimento, E-mail, Telefone e Contato de Emergência (Nome e Telefone) são mandatórios para garantir a segurança clínica e conformidade com emissão de documentos.
- **Validação de Duplicidade:** O sistema impede o cadastro de CPFs duplicados para o mesmo psicólogo, fornecendo feedback visual imediato.
- **UX de Validação Inteligente:** Em formulários com abas, o sistema detecta campos obrigatórios faltantes e redireciona automaticamente o usuário para a aba correta, exibindo uma mensagem de alerta detalhada.
- **Feedback Visual de Erros:** Substituição de alertas genéricos por mensagens integradas ao design do modal, com animações de atenção (shake) em caso de falha.

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
- **Layout duas colunas:** Calendário (`w-[60%]`) + Agenda (`w-[40%]`) lado a lado com `flex gap-6`
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
- **Navegação Consistente:** Elementos como Avatares, Nomes e Ícones são links diretos para prontuários.
- **Semana de Aniversário:** Visual festivo automático (dourado/confetes) em janela de 7 dias.
- **Métricas de Engajamento:** Comparação entre assiduidade física (Sessões) e digital (Instrumentos).
- **Tooltips Instantâneos:** Balões informativos sem delay.
- **UX de Portals:** Modais usam fragmento na raiz do componente para evitar containing blocks com `transform`; o backdrop cobre 100% da viewport.
- **Gestão UTC:** Datas em UTC, extraídas conforme fuso local.
- **Toasts Flutuantes:** Confirmações em Emerald-600.
- **Clinical Dashboard:** Métricas de engajamento na capa do card.
- **Patient Record:** Padronização de abas com header e botão Save.

### 11. Layout do PatientRecord (Regras para evitar scrollbar externa)

A página `PatientRecord.jsx` usa uma estrutura de layout específica que deve ser mantida para evitar que a barra de rolagem externa apareça ao alternar entre abas:

**Estrutura do Grid:**
- Ambas as colunas (sidebar + conteúdo) DEVEM estar DENTRO do mesmo grid: `<div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full min-h-0">`
- O container externo usa `overflow-hidden` para eliminar a scrollbar da página
- Cada coluna usa `flex flex-col min-h-0` para permitir encolhimento

**Sidebar (coluna esquerda):**
- Card usa `flex-1 flex flex-col min-h-0`
- Conteúdo do paciente usa `flex-1 space-y-3 overflow-y-auto min-h-0` para scroll interno
- Footer (CPF + botão) fica fora da área scrollável, após o `flex-1`
- Email e Telefone são exibidos apenas como texto, SEM botões Enviar/Ligar

**Abas (coluna direita):**
- Header das abas (`shrink-0`) + wrapper de conteúdo (`flex-1 flex flex-col min-h-0`)
- Cada aba usa `flex flex-col flex-1 min-h-0` como wrapper
- O card principal de cada aba (ex: timeline, tabela) usa `flex-1 min-h-0 overflow-y-auto` para scroll interno
- NUNCA usar `overflow-y-auto` no container externo ou na coluna direita

**Cards de estatísticas (overview):**
- Todos os stat cards usam `p-3`, ícone `w-10 h-10 rounded-xl`, número `text-2xl font-black`, label `text-[10px] font-bold uppercase tracking-widest`
- Dispostos em `grid grid-cols-1 md:grid-cols-4 gap-3`

**Cards de conteúdo (Frequência, Financeiro, Agenda):**
- Padrão de duas camadas: card branco externo (`card p-6`) + quadro cinza interno (`p-4 bg-slate-50 rounded-xl border border-slate-200 flex-1 flex flex-col min-h-0`)
- O `flex-1` no quadro cinza faz ele preencher o espaço disponível até os botões de ação

**Botões de ação:**
- Botões simplificados: `btn btn-primary` (verde) e `btn btn-danger` (vermelho)
- Posicionados fora do quadro cinza, alinhados à direita com `justify-end`

**Headers dos cards:**
- Headers usam `mb-8 shrink-0` em vez de `border-b` e ficam dentro do `p-8` do card
- **UX de Registro:** Área clicável para upload de anexos.

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
