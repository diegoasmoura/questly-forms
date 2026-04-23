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
- **Biblioteca Clínica:** Modelos validados como PHQ-9, GAD-7 e a **Anamnese Neuropsicológica Adulto (Completa)**.
- **Construtor de Formulários:** Criação de escalas e anamneses personalizadas com SurveyJS v2.

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

### 4. Tecnologia e UX
- **Navegação Consistente:** Padronização de interatividade em listas e cards. Elementos como Avatares, Nomes e Ícones agora são links diretos para prontuários, edições e visualizações.
- **Semana de Aniversário (UX Humanizada):** Visual festivo automático (dourado/lança-confetes) ativado em uma janela de 7 dias ao redor do aniversário do paciente (4 dias antes até 3 dias depois).
- **Métricas de Engajamento Unificadas:** Comparação direta entre assiduidade física (Sessões) e engajamento digital (Instrumentos Clínicos) na capa do card.
- **Tooltips Instantâneos:** Substituição dos títulos nativos por balões informativos de alta performance (sem delay).
- **UX de Portals:** Modais de agenda utilizam **React Portals** para cobertura total da tela (100% de largura/altura).
- **Gestão UTC:** Datas armazenadas em UTC e extraídas conforme fuso local para evitar erros de calendário.
- **Feedback Moderno:** Toasts flutuantes (Emerald-600) para confirmação de ações.
- **Clinical Dashboard:** Visualização instantânea de métricas de engajamento (Presenças vs Respostas de Instrumentos) diretamente na capa do card do paciente.

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
