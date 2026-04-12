# Curious - Form Builder Platform para Psicólogos

Sistema completo para psicólogos e profissionais de saúde criarem formulários clínicos, compartilharem com pacientes e coletarem respostas de forma estruturada.

## ✨ Funcionalidades Profissionais

O Curious foi expandido para ser uma ferramenta completa de gestão clínica:

- **👥 Gestão de Pacientes:** Cadastro completo de pacientes com dados de contato, data de nascimento e notas clínicas.
- **📁 Prontuário Eletrônico:** Histórico centralizado de todas as respostas e formulários enviados para cada paciente.
- **📄 Exportação em PDF:** Geração de relatórios clínicos profissionais com layout de papel timbrado para cada resposta.
- **🎨 Designer (SurveyJS V2):** Arrastar e soltar elementos para construir formulários profissionais.
- **👁️ Preview:** Testar o formulário em tempo real (Desktop, Tablet e Mobile).
- **🧠 Logic & Translation:** Fluxos condicionais e suporte a múltiplos idiomas.
- **🖥️ UI Otimizada:** Interface limpa, profissional e em tela cheia.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                 │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Dashboard    │  │  Patients    │  │Patient Record│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Form Builder  │  │  Responses   │  │ Patient Form │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Express)                │
│                                                             │
│  - JWT Auth | Prisma ORM | PostgreSQL                      │
│  - CRUD: Forms, Patients, Responses, Share Links            │
└─────────────────────────────────────────────────────────────┘
```

## 🔑 API Endpoints (Novos)

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | Listar pacientes |
| GET | `/api/patients/:id` | Prontuário completo |
| POST | `/api/patients` | Criar paciente |
| PUT | `/api/patients/:id` | Atualizar dados |
| DELETE | `/api/patients/:id` | Remover paciente |

## 🚀 Quick Start

### Com Docker (recomendado)

```bash
docker compose up -d
# Aguardar banco iniciar
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
│   │   ├── server.js          # Express app + routes
│   │   ├── db.js              # Prisma client
│   │   ├── middleware/auth.js # JWT middleware
│   │   └── routes/
│   │       ├── auth.js        # /api/auth/register, /login, /me
│   │       ├── forms.js       # /api/forms (CRUD + stats)
│   │       ├── responses.js   # /api/responses (view, aggregate)
│   │       └── share.js       # /api/share (create, revoke links)
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx      # Homepage
│   │   │   ├── Login.jsx        # Login page
│   │   │   ├── Register.jsx     # Registration page
│   │   │   ├── Dashboard.jsx    # Forms management
│   │   │   ├── FormBuilder.jsx  # SurveyJS Creator
│   │   │   ├── FormResponses.jsx# Responses viewer
│   │   │   ├── ShareLink.jsx    # Share confirmation
│   │   │   └── PatientForm.jsx  # Public form renderer
│   │   ├── context/AuthContext.jsx
│   │   ├── lib/api.js           # API client
│   │   └── index.css            # Tailwind + custom styles
│   └── Dockerfile
│
└── docker-compose.yml
```

## 🔑 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Dados do usuário |

### Forms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/forms` | Listar formulários |
| GET | `/api/forms/:id` | Obter formulário |
| POST | `/api/forms` | Criar formulário |
| PUT | `/api/forms/:id` | Atualizar formulário |
| DELETE | `/api/forms/:id` | Deletar formulário |
| POST | `/api/forms/:id/duplicate` | Duplicar formulário |
| GET | `/api/forms/:id/stats` | Estatísticas |

### Responses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/responses/form/:formId` | Listar respostas |
| GET | `/api/responses/form/:formId/aggregate` | Agregação |
| DELETE | `/api/responses/:id` | Deletar resposta |

### Share
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/share/create` | Criar link de compartilhamento |
| GET | `/api/share/form/:formId` | Listar links |
| PATCH | `/api/share/:id/revoke` | Revogar link |
| GET | `/api/share/:token` | Obter formulário público |
| POST | `/api/share/:token/submit` | Submeter resposta |

## 🎨 UI Components

- **Tailwind CSS** com tema customizado (cores brand)
- **Lucide React** para ícones
- **SurveyJS** para formulários
- Animações CSS (fade-in, slide-in, pulse)
- Design responsivo (mobile-first)

## 🔐 Security

- JWT tokens com expiração de 7 dias
- Senhas hasheadas com bcrypt (12 rounds)
- Validação server-side com survey-core
- CORS configurado
- Share links com tokens UUID únicos

## 📊 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 |
| Forms | SurveyJS 1.9 |
| Icons | Lucide React |
| Backend | Node.js 20 + Express 4 |
| Database | PostgreSQL 16 |
| ORM | Prisma 5 |
| Auth | JWT + bcrypt |
| Container | Docker + Docker Compose |
