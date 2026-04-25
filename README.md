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

## Design Responsivo Mobile-First

### Estratégia
O projeto segue o padrão **mobile-first** com experiência otimizada para smartphone:

- **Desktop (≥1024px)**: Sidebar lateral fixa
- **Mobile (<768px)**: Bottom Navigation Bar moderna

### Bottom Navigation
- Barra de navegação inferior com 5 ícones principais
- Indicador visual animado para item ativo
- Animações suaves de entrada
- Suporte a safe-area (notch iPhone/Android)
- Conteúdo principal com padding adequado

### Hooks de Responsividade
```javascript
useIsMobile()   // < 768px
useIsTablet()   // 768px - 1023px
useIsDesktop()  // ≥ 1024px
useIsLargeDesktop() // ≥ 1280px
```

### Próximas Melhorias Planejadas
- Grid de pacientes responsivo (1-4 colunas)
- Agenda com visualização semanal/lista em mobile
- Modais full-screen em mobile
- Cards touch-friendly

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

### 4. Cadastro de Pacientes e Integridade (v4.4)
- **Campos Obrigatórios (Ética e Segurança):** Nome, CPF, Data de Nascimento, E-mail, Telefone e Contato de Emergência (Nome e Telefone) são mandatórios para garantir a segurança clínica e conformidade com emissão de documentos.
- **Validação de Duplicidade:** O sistema impede o cadastro de CPFs duplicados para o mesmo psicólogo, fornecendo feedback visual imediato.
- **UX de Validação Inteligente:** Em formulários com abas, o sistema detecta campos obrigatórios faltantes e redireciona automaticamente o usuário para a aba correta, exibindo uma mensagem de alerta detalhada.
- **Feedback Visual de Erros:** Substituição de alertas genéricos por mensagens integradas ao design do modal, com animações de atenção (shake) em caso de falha.

### 5. Cadastro de Pacientes e Importação Excel (v4.5)
- **Importação via Excel:** Modelo geração via **ExcelJS** com suporte a 3 formatos de data:
  - **DD-MM-YYYY** (ex: 15-01-1990) - formato brasileiro
  - **YYYY-MM-DD** (ex: 1990-01-15)
  - **Serial do Excel** (ex: 32874)
- **Cabeçalho verde** (Emerald-600)
- **Larguras padronizadas** por coluna
- **Dropdowns** em Gênero e Estado Civil
- **Feedback Visual:** Mensagens detalhadas com linha do erro

### 6. UX de Visualização de Pacientes
- **Modo Card:** Excluir junto com botões de ação (sem botão separado no topo)
- **Modo Lista:** Ordem de botões: Prontuário (destacado) > Editar > Excluir
- **Dropdown de Cadastro:** Cada botão com estado independente; "Cadastrar" (topo) alinhado à direita, "Cadastrar Paciente" (vazio) centralizado

### 7. UX do Calendário (Agenda)
- **Visual melhorado:** Cabeçalhos mais legíveis (fundo mais claro, texto maior), título do mês maior
- **Células dinâmicas:** Sem height fixo; scroll quando > 4 sessões por dia
- **Melhor contraste:** Bordas e texto mais escuros para facilitar leitura

### 8. Navegação Suave
- Hook `useNavigateWithTransition` adiciona delay de 300ms antes de trocas de página:

```jsx
import { useNavigateWithTransition } from "../lib/useNavigateWithTransition";

const navigate = useNavigateWithTransition();
navigate("/path"); // com delay padrão (300ms)
navigate("/path", { delay: 0 }); // sem delay (ex: logout)
navigate(-1); // suporta navegação relativa
```

### 9. outras UX
- **Navegação Consistente:** Elementos como Avatares, Nomes e Ícones são links diretos para prontuários.
- **Semana de Aniversário:** Visual festivo automático (dourado/confetes) em janela de 7 dias.
- **Métricas de Engajamento:** Comparação entre assiduidade física (Sessões) e digital (Instrumentos).
- **Tooltips Instantâneos:** Balões informativos sem delay.
- **UX de Portals:** Modais cobrem 100% da tela.
- **Gestão UTC:** Datas em UTC, extraídas conforme fuso local.
- **Toasts Flutuantes:** Confirmações em Emerald-600.
- **Clinical Dashboard:** Métricas de engajamento na capa do card.
- **Patient Record:** Padronização de abas com header e botão Save.
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
