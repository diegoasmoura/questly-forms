# Curious - Plataforma Clínica de Formulários e Avaliação Neuropsicológica

Sistema completo para psicólogos e profissionais de saúde criarem formulários clínicos, gerenciarem pacientes, coletarem respostas e visualizarem dados clínicos com gráficos de evolução e análise detalhada.

## ✨ Funcionalidades

### 👥 Gestão de Pacientes
- Cadastro completo (nome, email, telefone, data de nascimento, notas clínicas)
- Listagem com busca e contagem de respostas
- Vinculação automática via links compartilhados

### 📁 Prontuário Eletrônico
- Histórico centralizado de todas as respostas do paciente
- **3 modos de visualização:**
  - **Timeline:** Lista cronológica com scoring clínico inline
  - **Tendências:** Gráficos de evolução PHQ-9/GAD-7 ao longo do tempo + resumo de avaliações
  - **Tabela:** Dados detalhados com TanStack Table (agrupamento, filtros, column pinning)
- Análise item-a-item visual (barras coloridas, labels em português)
- Comparação temporal com deltas (↑ +3, ↓ -2)
- Alertas clínicos (ideação suicida, severidade grave)
- Exportação PDF profissional ("Resumo Premium")

### 📊 Visualização de Respostas
- **Dashboard > Responses (Visão do Formulário):**
  - Lista todas as respostas com filtro por paciente
  - Cards com avatar + nome do paciente + email
  - Respostas anônimas identificadas (sem vínculo)
  - Botões: "Ver Prontuário", "Ver Análise", "Exportar"
  - Gráfico de tendência de respostas ao longo do tempo

- **Response Detail (Visão da Resposta Única):**
  - Score + severidade no topo (não perdido no meio!)
  - Análise item-a-item visual para PHQ-9/GAD-7
  - Evolução no tempo com comparações
  - Navegação fluida entre contextos (Prontuário ↔ Respostas)

### 📝 Builder de Formulários
- **SurveyJS Creator v2.5** com todas as funcionalidades:
  - Designer visual (drag & drop)
  - Preview em tempo real
  - Editor JSON com validação
  - Theme Editor
  - Logic Tab (fluxos condicionais)
  - Translation Tab (múltiplos idiomas)
- Suporte a formulários complexos (100+ perguntas)
- Templates clínicos prontos (PHQ-9, GAD-7, Anamnese)
- Importação de JSON avançado (firstPageIsStartPage, previewMode, etc.)

### 📈 Gráficos e Análises
- **Recharts** para visualizações clínicas:
  - Gráficos de tendência longitudinal (PHQ-9 + GAD-7)
  - Linhas de referência para thresholds clínicos
  - Tooltips informativos
  - Gráficos de área para tendências de respostas
- **TanStack Table** para dados tabulares:
  - Virtualização para formulários grandes
  - Column pinning (Data, Score fixos)
  - Agrupamento por seções
  - Toggle de visibilidade
  - Busca integrada

### 🔗 Compartilhamento Inteligente
- Links únicos com tokens UUID
- **Fluxo simplificado:**
  1. Clique "Share" → Veja todos os links existentes
  2. "Novo Link" → Selecione paciente (opcional) → Copiado automaticamente
  3. Abra `/share/:token` → Formulário SurveyJS abre direto
  4. Respostas salvas e vinculadas ao prontuário
- Lista de links com status (Ativo/Inativo)
- Revogação de links com atualização em tempo real
- Contador de links ativos atualizado automaticamente
- Expiração configurável por link
- Associação automática de respostas ao paciente (se vinculado)

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                     │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌───────────────┐ │
│  │Dashboard │ │Patients  │ │Patient Record│ │Response Detail│ │
│  └──────────┘ └──────────┘ └──────────────┘ └───────────────┘ │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌───────────────┐ │
│  │Form      │ │Responses │ │ClinicalCharts│ │  DataTable    │ │
│  │Builder   │ │          │ │(Recharts)    │ │(TanStack)     │ │
│  └──────────┘ └──────────┘ └──────────────┘ └───────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Express)                    │
│                                                                 │
│  JWT Auth | Prisma ORM | PostgreSQL                             │
│  CRUD: Forms, Patients, Responses, Share Links                  │
│  Aggregate stats, CSV export, patient data in responses         │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Com Docker (recomendado)

```bash
docker compose up -d
# Aguardar banco iniciar (primeira vez pode demorar)
cd backend && npx prisma db push
# Acessar:
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
```

### Desenvolvimento local

```bash
# Terminal 1 - Database
docker compose up -d db

# Terminal 2 - Backend
cd backend
npm install
npx prisma db push
npm run dev

# Terminal 3 - Frontend
cd frontend
npm install
npm run dev
```

## 📁 Estrutura

```
surveyJS/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express app + routes
│   │   ├── db.js                  # Prisma client
│   │   ├── middleware/auth.js     # JWT middleware
│   │   └── routes/
│   │       ├── auth.js            # Auth endpoints
│   │       ├── forms.js           # Forms CRUD + stats
│   │       ├── patients.js        # Patients CRUD + records
│   │       ├── responses.js       # Responses + aggregate + patient data
│   │       └── share.js           # Share links management
│   ├── prisma/
│   │   └── schema.prisma          # Database schema (User, Patient, Form, Response, ShareLink)
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx          # Forms list + stats + trend chart
│   │   │   ├── Patients.jsx           # Patient list
│   │   │   ├── PatientRecord.jsx      # Clinical history (3 tabs)
│   │   │   ├── ResponseDetail.jsx     # Single response analysis ⭐ NEW
│   │   │   ├── FormBuilder.jsx        # SurveyJS Creator v2.5
│   │   │   ├── FormResponses.jsx      # Responses viewer (4 tabs)
│   │   │   ├── PatientForm.jsx        # Public form renderer
│   │   │   ├── ShareLink.jsx          # Share confirmation
│   │   │   ├── Login.jsx             # Authentication
│   │   │   └── Register.jsx          # Registration
│   │   ├── components/
│   │   │   ├── ClinicalCharts.jsx     # Recharts components ⭐ NEW
│   │   │   └── DataTable.jsx          # TanStack Table component ⭐ NEW
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # JWT auth
│   │   ├── lib/
│   │   │   ├── api.js                 # API client
│   │   │   ├── pdf.js                 # PDF export
│   │   │   ├── scoring.js             # PHQ-9/GAD-7 scoring
│   │   │   └── templates.js           # Clinical form templates
│   │   └── index.css                  # Tailwind + SurveyJS theme
│   └── Dockerfile
│
├── VISUALIZATION_BENCHMARK.md         # Visualization analysis & recommendations
├── PATIENT_LINKING_SOLUTION.md        # Patient-response linking documentation
├── NAVIGATION_AND_DISPLAY_ARCHITECTURE.md  # Navigation flow documentation
├── CLINICAL_DISPLAY_REORGANIZATION.md # Clinical data display changes
├── SURVEYJS_SETUP_FIXES.md            # SurveyJS setup troubleshooting
└── docker-compose.yml
```

## 🔑 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Dados do usuário |

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | Listar pacientes (com contagem de respostas) |
| GET | `/api/patients/:id` | Prontuário completo (com todas as respostas + form schemas) |
| POST | `/api/patients` | Criar paciente |
| PUT | `/api/patients/:id` | Atualizar paciente |
| DELETE | `/api/patients/:id` | Remover paciente |

### Forms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/forms` | Listar formulários |
| GET | `/api/forms/:id` | Obter formulário (com schema) |
| POST | `/api/forms` | Criar formulário |
| PUT | `/api/forms/:id` | Atualizar formulário |
| DELETE | `/api/forms/:id` | Deletar formulário |
| POST | `/api/forms/:id/duplicate` | Duplicar formulário |
| GET | `/api/forms/:id/stats` | Estatísticas (responseCount, shareLinkCount) |

### Responses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/responses/form/:formId` | Listar respostas (com dados do paciente) ⭐ UPDATED |
| GET | `/api/responses/:id` | Obter resposta única (com paciente + form) ⭐ NEW |
| GET | `/api/responses/form/:formId/aggregate` | Agregação (total, today, week, dailyCounts) |
| GET | `/api/responses/form/:formId/export` | Exportar para CSV |
| DELETE | `/api/responses/:id` | Deletar resposta |

### Share
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/share/create` | Criar link (com patientId opcional) |
| GET | `/api/share/form/:formId` | Listar links de um formulário |
| PATCH | `/api/share/:id/revoke` | Revogar link |
| GET | `/api/share/:token` | Obter formulário via link público |
| POST | `/api/share/:token/submit` | Submeter resposta |

## 🎨 UI Components

- **Tailwind CSS 3** com tema customizado (cores brand-50 a brand-950)
- **Lucide React** para ícones (tree-shakeable)
- **SurveyJS 2.5** para formulários e builder
- **Recharts** para gráficos clínicos (tendências, severidade, sparklines)
- **TanStack Table** para tabelas dinâmicas (virtualização, grouping, pinning)
- Animações CSS (fade-in, slide-in, pulse)
- Design responsivo (mobile-first)

## 📊 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React 18 + Vite 5 | Latest |
| Styling | Tailwind CSS 3 | Latest |
| Charts | Recharts | ⭐ NEW |
| Tables | TanStack Table + React Virtual | ⭐ NEW |
| Forms | SurveyJS (Core + Creator + React UI + PDF) | 2.5.19 ⬆️ |
| Icons | Lucide React | Latest |
| Backend | Node.js 20 + Express 4 | LTS |
| Database | PostgreSQL 16 | Latest |
| ORM | Prisma 5 | Latest |
| Auth | JWT (7 dias) + bcrypt (12 rounds) | - |
| Container | Docker + Docker Compose | - |

## 🔐 Security

- JWT tokens com expiração de 7 dias
- Senhas hasheadas com bcrypt (12 rounds)
- Validação server-side com survey-core
- CORS configurado
- Share links com tokens UUID únicos
- Middleware de autenticação em todas as rotas protegidas

## 📈 Funcionalidades por Contexto

### Dashboard (Visão Geral)
- Estatísticas: Total Forms, Total Responses, Active Links
- Gráfico de tendência de respostas (todos os formulários)
- Cards de formulário com mini trend charts
- Ações: Criar, Duplicar, Compartilhar, Deletar

### Patients > Record (Visão do Paciente)
- Perfil do paciente (avatar, contato, notas)
- 3 tabs: Timeline, Tendências, Tabela
- Timeline: Histórico cronológico com scoring inline
- Tendências: Gráfico PHQ-9/GAD-7 + resumo de avaliações
- Tabela: TanStack Table com grouping e filtros

### Form > Responses (Visão do Formulário)
- 4 tabs: Lista, Tendência, Tabela, Severidade
- Filtro por paciente (com avatares + contagem)
- Cards com identificação clara (paciente vs anônimo)
- Botões de ação: Ver Prontuário, Ver Análise, Exportar

### Response Detail (Visão da Resposta) ⭐ NEW
- Contexto do paciente no topo
- Score + severidade + alerta (destaque)
- Análise item-a-item visual (barras coloridas)
- Evolução temporal com deltas
- Navegação: Ver Prontuário, Ver Todas as Respostas

## 🚀 Próximos Passos (Roadmap)

### Fase 3 (Opcional - se forms >200 perguntas)
- [ ] Migrar para AG Grid para ultra-performance
- [ ] Server-side row models para datasets grandes
- [ ] Integrated charting com AG Grid
- [ ] Excel export nativo

### Features Futuras
- [ ] Comparação entre pacientes (anônima)
- [ ] Notificações (novo formulário completo)
- [ ] Dashboards comparativos de saúde mental
- [ ] Integração com calendários de consultas
- [ ] Módulos de telemedicina
