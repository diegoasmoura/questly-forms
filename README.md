# Curious - Form Builder Platform

Sistema completo para profissionais de saúde criarem formulários, compartilharem com pacientes e coletarem respostas.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                 │
│  Port: 3000                                                 │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Landing Page │  │  Auth (JWT)  │  │  Dashboard   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Form Builder  │  │  Responses   │  │ Patient Form │      │
│  │(SurveyJS)    │  │  Viewer      │  │  (Public)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────┬───────────────────────────────┘
                              │ REST API (JSON)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Express)                │
│  Port: 3001                                                 │
│                                                             │
│  - JWT Authentication (bcrypt)                              │
│  - CRUD: Forms, Responses, Share Links                     │
│  - Server-side validation with survey-core                 │
│  - PostgreSQL via Prisma ORM                               │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (PostgreSQL)                      │
│  Port: 5432                                                 │
│                                                             │
│  Users → Forms → ShareLinks                                 │
│              → Responses                                    │
└─────────────────────────────────────────────────────────────┘
```

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
