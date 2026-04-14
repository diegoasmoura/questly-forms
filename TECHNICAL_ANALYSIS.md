# Análise Técnica Completa - SurveyJS Clinical Platform

## 1. SCHEMA DO BANCO DE DADOS (Prisma)

### 1.1 Estrutura de Modelos

```prisma
User
├── id (PK)
├── email (UNIQUE)
├── name
├── password
└── Relacionamentos:
    ├── forms: Form[]
    ├── patients: Patient[]
    └── responses: Response[]

Patient
├── id (PK)
├── name, cpf, rg, email, phone, birthDate
├── Dados demográficos (gender, maritalStatus, profession)
├── Endereço (cep, street, number, complement, neighborhood, city, state)
├── Contato emergência (emergencyName, emergencyPhone)
├── notes
├── psychologistId (FK) → User
└── Relacionamentos:
    ├── responses: Response[]
    └── shareLinks: ShareLink[]
    
Constraints:
├── @@unique([email, psychologistId]) ⚠️ Impede pacientes duplicados por email/psicólogo
└── @@unique([cpf, psychologistId]) ⚠️ Impede pacientes duplicados por CPF/psicólogo

Form
├── id (PK)
├── title
├── schema (Json)
├── createdBy (FK) → User
└── Relacionamentos:
    ├── responses: Response[]
    └── shareLinks: ShareLink[]

ShareLink
├── id (PK)
├── token (UNIQUE) ⚠️ Cada link tem token único
├── formId (FK)
├── patientId (FK) ⚠️ NULLABLE - permite links sem paciente específico
├── patientName (String)
├── patientEmail (String)
├── createdAt, expiresAt
├── active (Boolean)
└── Relacionamentos:
    ├── form: Form
    └── patient: Patient (optional)

Response
├── id (PK)
├── formId (FK)
├── patientId (FK) ⚠️ NULLABLE
├── userId (FK) ⚠️ NULLABLE
├── data (Json) - dados das respostas
├── createdAt
└── Relacionamentos:
    ├── form: Form
    ├── patient: Patient (optional)
    └── user: User (optional)
```

### 1.2 Análise de Restrições

❌ **PROBLEMA CRÍTICO IDENTIFICADO:**
- NÃO existe constraint UNIQUE em Response(formId, patientId)
- Um mesmo paciente pode ter ILIMITADAS respostas do mesmo formulário
- Tecnicamente, isso é por design para histórico, MAS...
- Permite criar múltiplos ShareLinks para o MESMO form/patient sem aviso

✅ **O que FUNCIONA bem:**
- Token é UNIQUE em ShareLink
- Cada link tem um identificador único
- patientId é NULLABLE (permite formulários anônimos)
- Cascade delete funciona bem

### 1.3 Fluxo de Dados

```
ShareLink criado
    ↓
generate token (UUID sem hífens)
    ↓
token é enviado via link: /form/{token}
    ↓
Usuário acessa PatientForm.jsx
    ↓
getSharedForm(token) busca form pelo token
    ↓
Usuário preenche e submete
    ↓
submitSharedForm(token) cria Response
    ├── formId: do ShareLink
    ├── patientId: do ShareLink (pode ser null)
    └── data: JSON com respostas
    ↓
Response está associada ao paciente (se houver patientId)
```

---

## 2. LÓGICA DE COMPARTILHAMENTO ATUAL

### 2.1 Endpoint de Criação (Backend)

**Arquivo:** `backend/src/routes/share.js` → `POST /share/create`

```javascript
// Fluxo
1. Recebe: { formId, patientId?, patientName?, patientEmail?, expiresAt? }
2. Valida:
   ✓ formId é obrigatório
   ✓ Usuário é dono do formulário
   ✓ Se patientId: usuário é psicólogo daquele paciente
3. Cria ShareLink:
   - token = UUID sem hífens (aleatório)
   - active = true por padrão
   - expiresAt = data opcional
4. Retorna link com URL completa

// ❌ NÃO VALIDA:
- Se já existe link ativo para este form/patient
- Se já existe link expirado (pode reutilizar sim, mas app cria novo)
```

### 2.2 Validações (ou Falta Delas)

```
✓ De Propriedade:
  - Verifica se user criou o formulário
  - Verifica se user é psicólogo do paciente
  
✗ De Duplicação:
  - NÃO verifica se existe ShareLink ativo para form/patient
  - Permite criar 5 links para o MESMO formulário
  - CADA RESPOSTA vai para UMA resposta diferente (mas datada)
  - PROBLEMA: Pode confundir se há múltiplos links

✗ De Expiração:
  - NÃO invalida links antigos automaticamente
  - Backend verifica expiração no GET (verifica se expirado)
  - Frontend ASSUME que expiração funciona

✗ Sobre respostas duplicadas:
  - Um paciente pode preencher o mesmo form múltiplas vezes
  - Todas as respostas são ligadas ao mesmo paciente
  - NÃO há "prevent duplicate submission"
```

### 2.3 Fluxo na UI (PatientRecord.jsx)

```javascript
// Aba "Compartilhamento"
1. Clica "Enviar Formulário"
2. Modal abre:
   - Dropdown: seleciona formulário
   - Input date: data de expiração (padrão 30 dias)
3. Ao confirmar:
   - Chama api.createShareLink()
   - Copia link para clipboard
   - Modal fecha
4. Lista TODOS os links do paciente:
   - Mostra links ativos em card separado
   - Mostra link, botão copiar, botão deletar
   - Nome do formulário
   - Status (Ativo/Inativo)
   - Data de expiração
```

---

## 3. SISTEMA DE RESPOSTAS

### 3.1 Endpoints de Resposta (Backend)

**Arquivo:** `backend/src/routes/responses.js`

```
GET /responses/form/:formId
├── Lista TODAS as respostas de um formulário
├── Inclui dados do paciente
├── Ordena por createdAt DESC
└── Retorna: Response[] com form, patient data

GET /responses/:id
├── Pega uma resposta específica
├── Verifica se user é dono do form
└── Retorna: Response com form, patient data

POST /share/:token/submit (public)
├── Usuário não autenticado submete via link
├── Busca ShareLink pelo token
├── Verifica se está ativo e não expirou
├── Cria Response com patientId do link
└── Retorna: { success: true, responseId }

DELETE /responses/:id
└── Apaga uma resposta
```

### 3.2 Lógica de Busca de Respostas

#### No PatientRecord.jsx:

```javascript
// Ao carregar page:
useEffect(() => {
  loadPatient(); // Busca patient com responses incluídas
}, [id]);

// API não possui endpoint específico
// patient.responses vem do RELACIONAMENTO do Prisma
// No backend/routes/patients.js → GET /patients/:id
// Deve fazer: patient com { responses: Response[] }
```

#### No ResponseDetail.jsx:

```javascript
// Ao abrir resposta específica:
const loadResponse = async () => {
  const data = await api.getResponse(id);
  // data = { form, patient, data, createdAt... }
  
  // Se há patientId, busca TODAS as respostas desse paciente
  if (data.patientId) {
    const patientData = await api.getPatient(data.patientId);
    setPatientResponses(patientData.responses || []);
  }
};

// Usa patientResponses para:
// - Mostrar contador "Histórico do Paciente"
// - Comparar escores anterior/atual
```

### 3.3 Timeline na UI (PatientRecord.jsx)

**Aba "Linha do Tempo"** mostra:

```
┌─── Respondidos (answered) ────────────────────
│
├─ Link com Response
│  ├─ Icone + Formulário.title
│  ├─ Status: ✓ Respondido
│  ├─ Data enviado & Data respondido
│  ├─ Botão "Análise" → /responses/{responseId}
│  └─ Botão "PDF" → download do relatório
│
├─ Se clica (expand):
│  ├─ Score (PHQ-9/GAD-7)
│  ├─ Interpretation
│  ├─ Item-by-item breakdown
│  └─ Search bar para filtrar respostas

└─── Aguardando Resposta (pending) ────────────────────
   ├─ Link SEM Response
   ├─ Status: Pendente
   ├─ Dias restantes até expiração
   └─ Sem ação possível (esperar)
```

---

## 4. UI/UX ATUAL

### 4.1 PatientRecord.jsx - Layout

```
┌─────────────────────────────────────────────────────┐
│  LEFT SIDEBAR (1/4)              │  MAIN (3/4)      │
├─────────────────────────────────┼──────────────────┤
│ • Profile Avatar                 │ Abas:            │
│ • Patient Name                   │ ◯ Linha do Tempo │
│ • ID Number                      │ ◯ Tendências     │
│ • Email (botão enviar)           │ ◯ Dados Brutos   │
│ • Phone (botão ligar)            │ ◯ Compartilh.    │
│ • Birth Date                     │                  │
│ • Patient Since                  │ Conteúdo da Aba  │
│ • Ver Dados Completos (modal)    │ (varia)          │
│ • Notas Clínicas (text)          │                  │
└─────────────────────────────────┴──────────────────┘
```

### 4.2 Aba "Compartilhamento" (Share Tab)

```
┌────────────────────────────────────────────────────┐
│ Compartilhar Formulários                           │
│ Envie formulários para que PACIENTE preencha       │
│                              [Enviar Formulário]   │
├────────────────────────────────────────────────────┤
│                                                    │
│ Status: "Nenhum formulário enviado ainda"         │
│ (ou lista de links)                               │
│                                                    │
│ Cada link mostra:                                 │
│ • Status: [● Ativo] ou [● Inativo]                │
│ • Form title                                      │
│ • Created: data & hora                            │
│ • Expires: data                                   │
│ • [URL Input] [Copy Btn] [Delete Btn]             │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 4.3 Modal "Enviar Formulário"

```
┌─────────────────────────────────────────────────────┐
│ Enviar Formulário para PACIENTE_NAME          [x]   │
│ Crie um link para que o paciente preencha          │
├─────────────────────────────────────────────────────┤
│ Selecione um Formulário *                          │
│ [Dropdown: PHQ-9 | GAD-7 | Outro]                 │
│                                                     │
│ Data de Expiração *                               │
│ [Date Input: DD/MM/YYYY]                          │
│ O link expirará automaticamente nesta data        │
│ Padrão: 30 dias a partir de hoje                  │
│                                                     │
│ [         Gerar e Copiar Link        ] [Cancelar] │
└─────────────────────────────────────────────────────┘
```

### 4.4 Aba "Linha do Tempo" Detalhes

```
Seção: Respondidos
├─ Card por resposta:
│  ├─ [Icone] Formulário Title
│  ├─ Enviado em: DD/MM hh:mm · ✓ Respondido
│  ├─ Respondido em: DD/MM hh:mm
│  └─ [Análise] [PDF] [>]
│
│  Se clicado (expand):
│  ├─ Score Card (PHQ-9: 15 · Moderado)
│  ├─ Alert (se há risco → vermelho pulsante)
│  ├─ Interpretation text
│  ├─ Search bar (filtrar respostas)
│  └─ Tabela Item-by-Item

Seção: Aguardando Resposta
└─ Card por link sem resposta:
   ├─ Formulário Title
   ├─ Enviado em: data & hora
   ├─ [Pendente] [Enviado] [X dias restantes]
   └─ Sem ações
```

### 4.5 ResponseDetail.jsx - View Completa

```
┌─────────────────────────────────────────────────────┐
│ [<] PHQ-9: Análise Clínica                          │
│     Coletado em: DD/MM/YYYY hh:mm                   │
│                              [Ver Prontuário] [...] │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [Avatar P] PACIENTE_NAME                           │
│ email@example.com                                  │
│ [✓ Vínculo Ativo]              Histórico: 5 resp.  │
│                                                     │
│ Score Card (Grande):                               │
│ [  15  ]  Análise de Depressão                      │
│  [ pts ]  MODERADO                                 │
│            Interpretação...                         │
│            Máximo: 27 pontos                        │
│                                                     │
│ ⚠️ ALERTA CLÍNICO (se aplica)                      │
│                                                     │
│ Item-by-Item Analysis:                             │
│ • Interest: 2 | Down: 1 | Sleep: 2 | ...           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 5. FLUXOS QUE FALTAM ou SÃO PROBLEMÁTICOS

### 5.1 Edição de Data de Expiração

```
❌ NÃO IMPLEMENTADO
- Link criado com expiração X
- Usuário gostaria de ADIAR a expiração
- Atualmente: precisa DELETAR e CRIAR novo
- Solução: Patch /share/:id com novo expiresAt
```

### 5.2 Prevenção de Duplicação de Links

```
❌ NÃO VALIDADO NO BACKEND
- Usuário clica "Enviar Formulário" 2x
- Cria 2 ShareLinks diferentes para MESMO form/patient
- Cada um tem token diferente
- Paciente fica com 2 links iguais
- UI mostra ambos

❌ NÃO VALIDA NO FRONTEND
- Dropdown sempre disponível
- Sem ícone/label "Já enviado"
- Sem opção de "reutilizar link anterior"

FLUXO IDEAL SERIA:
1. Usuário tenta enviar form X
2. Backend verifica: existe link ativo para form X + patient Y?
3. Se SIM: retorna link existente em vez de criar novo
4. Se NÃO: cria novo
```

### 5.3 Distinguir Nova Resposta de Anterior

```
❌ PROBLEMA ATUAL:
- Timeline mostra resposta por resposta
- Usuário não consegue ver se é REATUALIZAÇÃO ou NOVO PREENCHIMENTO
- Histórico completo está lá, mas não é óbvio

UI MOSTRA:
✓ Data/hora da resposta
✓ Se mudou de score (pode calcular diferença)
✗ Não mostra "diff" visual
✗ Não marca como "versão 2"

EXEMPLO:
┌─ Respondido: 15 (Moderado)
│  Enviado em: 01/04/2026 10:30
│  Respondido em: 01/04/2026 11:45
│  Versão: 1/3 ← FALTA
└─ Respondido: 22 (Grave)
   Enviado em: 01/04/2026 14:00
   Respondido em: 02/04/2026 09:15
   Versão: 2/3 ← FALTA
```

### 5.4 Fluxo de "Reabertura" para Edição

```
❌ NÃO IMPLEMENTADO
- Resposta submetida
- Paciente descobre erro/quer editar
- Atualmente: precisa criar NOVO link e NOVA resposta

IDEALMENTE:
1. Gerar link Edit do mesmo formulário
2. Paciente abre
3. Pre-populated com dados anteriores
4. Salva como "versão 2" do mesmo link

OBS: Baixa prioridade, design decideá
```

### 5.5 Feedback Visual de Status

```
❌ FALTA CLAREZA:
Links no Share Tab mostram:
✓ Status [Ativo] [Inativo]
✓ Expiração
✗ Não mostra:
  - Se foi respondido (falta link entre ShareLink → Response)
  - Quantas vezes foi preenchido
  - Data última resposta
  - Se expirou hoje
```

---

## 6. RECOMENDAÇÕES DE UX/UI

### 6.1 Prevenção de Duplicação

```
OPÇÃO A: Backend + Smart UI
┌─────────────────────────────────────────┐
│ Selecione um Formulário *               │
│ ┌─────────────────────────────────────┐│
│ │ PHQ-9                               ││
│ │ GAD-7                               ││
│ │ Avaliação Inicial ₹ PENDENTE        ││ ← Label mostra status!
│ │ Escala Genérica   ₹ RESPONDIDO      ││
│ └─────────────────────────────────────┘│
│                                         │
│ Ações:
│ • Se PENDENTE: mostrar link existente
│ • Se RESPONDIDO: opção "Enviar novo"
│ • Se nunca enviado: criar novo
└─────────────────────────────────────────┘

Backend:
POST /share/create
├── Recebe { formId, patientId }
├── Query: existe ShareLink ativo?
├── Se SIM: retorna existente + flag "reusing"
└── Se NÃO: cria novo
```

### 6.2 Visualização de Histórico

```
TIMELINE MELHORADA:
┌──────────────────────────────────────────────┐
│ Respondidos (3 UNIDADES)                     │
├──────────────────────────────────────────────┤
│ PHQ-9 • Histórico: 3 respostas                │
│                                              │
│ ┌────────────────────────────────────────┐   │
│ │ 🔴 22 · GRAVE                          │   │ ← Última
│ │    Respondido: 02/04 09:15             │   │
│ │    [Análise] [PDF] [Compare]           │   │
│ └────────────────────────────────────────┘   │
│                                              │
│ ┌────────────────────────────────────────┐   │
│ │ 🟡 15 · MODERADO                       │   │ ← Anterior
│ │    Respondido: 01/04 11:45             │   │
│ │    Δ +7 pts ↑ (piorou)                │   │
│ │    [Análise] [PDF]                     │   │
│ └────────────────────────────────────────┘   │
│                                              │
│ ┌────────────────────────────────────────┐   │
│ │ 🟢 08 · MÍNIMO                         │   │ ← Primeira
│ │    Respondido: 25/03 14:22             │   │
│ │    [Análise] [PDF]                     │   │
│ └────────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

### 6.3 Aba Compartilhamento Mejorada

```
┌─────────────────────────────────────────────────┐
│ Compartilhar Formulários           [+ Enviar]   │
├─────────────────────────────────────────────────┤
│                                                 │
│ FORMULÁRIOS ENVIADOS:                          │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ PHQ-9                                       │ │
│ │ Status: ✓ RESPONDIDO · 1 resposta          │ │
│ │ Última resposta: 02/04/2026                │ │
│ │ Link ativo até: 15/05/2026                 │ │
│ │                                             │ │
│ │ [Copiar Link] [↻ Enviar Novo] [Editar Ex] │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ GAD-7                                       │ │
│ │ Status: ⏱ PENDENTE                          │ │
│ │ Dias restantes: 7                          │ │
│ │ Link ativo até: 08/04/2026                 │ │
│ │                                             │ │
│ │ [Copiar Link] [Reenviar] [Editar Ex]       │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Escala Genérica                             │ │
│ │ Status: ❌ EXPIRADO                          │ │
│ │ Expirou em: 01/04/2026                     │ │
│ │                                             │ │
│ │ [Copiar Link] [Renovar] [Deletar]          │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 6.4 Modal Melhorado

```
┌────────────────────────────────────────────────┐
│ Enviar Formulário para João Silva         [x]  │
│ Crie um link para que o paciente preencha     │
├────────────────────────────────────────────────┤
│ Selecione um Formulário *                     │
│                                               │
│ ┌──────────────────────────────────────────┐  │
│ │ 📋 PHQ-9 (Depressão)                     │  │
│ │    ⏱ Pendente desde 01/04                │  │
│ │    Link expira: 15/05                    │  │
│ └──────────────────────────────────────────┘  │
│                                               │
│ ┌──────────────────────────────────────────┐  │
│ │ 📋 GAD-7 (Ansiedade)                     │  │
│ │    ✓ Respondido (3 respostas)            │  │
│ │    Link expira: 20/05                    │  │
│ └──────────────────────────────────────────┘  │
│                                               │
│ Data de Expiração *                          │
│ [15/05/2026 ──────────] ⚡ Extensão Rápida   │
│ [  +7 dias  ] [30 dias] [  +90 dias ]        │
│                                               │
│ Avisos:                                       │
│ ℹ️ Já há 1 link ativo para este formulário    │
│    [ ] Reutilizar link anterior              │
│    [ ] Gerar novo link (descartando antigo)   │
│                                               │
│ [Gerar e Copiar] [Cancelar]                  │
└────────────────────────────────────────────────┘
```

---

## 7. MUDANÇAS TÉCNICAS NECESSÁRIAS

### 7.1 No Banco de Dados

```sql
-- 1. MIGRAÇÃO: Adicionar constraint de duplicação (OPCIONAL)
-- Se quiser prevenir múltiplos links ativos:
ALTER TABLE "ShareLink" 
ADD CONSTRAINT unique_active_form_patient 
UNIQUE (formId, patientId) 
WHERE active = true AND (expiresAt IS NULL OR expiresAt > now());

-- OU criar via Prisma migration:

model ShareLink {
  ...fields...
  
  // Adicionar índice
  @@unique([formId, patientId], where: { active: true, expiresAt: { gt: now() } })
}

-- 2. Adicionar campo de versão em Response (OPCIONAL)
model Response {
  ...
  version Int @default(1)  // 1ª, 2ª... resposta
  previousResponseId String? // Link para versão anterior
  ...
}

-- 3. Adicionar campo de "link update count" em ShareLink
model ShareLink {
  ...
  updatedAt DateTime @updatedAt
  ...
}
```

### 7.2 No Backend

```javascript
// 1. NOVO ENDPOINT: Atualizar expiração
PATCH /share/:id/extend
├── Recebe: { days: number } ou { expiresAt: date }
├── Verifica: user é owner do form
├── Atualiza: ShareLink.expiresAt
└── Retorna: link atualizado

// 2. MODIFICAR: POST /share/create (smart duplicate check)
POST /share/create
├── Recebe: { formId, patientId, expiresAt }
├── Query 1: Existe link ATIVO?
│   ├── WHERE formId = X AND patientId = Y
│   ├── AND active = true
│   ├── AND (expiresAt IS NULL OR expiresAt > NOW())
├── Se SIM:
│   ├── Response com flag { reused: true, existingLink }
│   └── Código 200 (não erro!)
├── Se NÃO: cria normalmente
└── Include no response: shareUrl, isNew, responseId

// 3. MELHORAR: GET /share/patient/:patientId
GET /share/patient/:patientId
├── Mais otimizado: incluir agregação
├── Links com status (pending/answered/expired)
├── Últimas N respostas por link
├── Return format:
{
  links: [
    {
      id, token, formId, active, expiresAt,
      form: { title },
      lastResponse: { id, createdAt, data },
      responseCount: 3,
      status: 'pending' | 'answered' | 'expired'
    }
  ]
}

// 4. NOVO: POST /responses/by-patient-form
POST /responses/by-patient-form
├── Recebe: { patientId, formId }
├── Retorna: histórico completo com order/versioning
└── { responses: [{ ...data }, ...] }
```

### 7.3 No Frontend

```javascript
// 1. NOVO HOOK: useShareLinkStatus
const useShareLinkStatus = (link) => {
  const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
  const isPending = link.active && !link.responseId && !isExpired;
  const isAnswered = !!link.responseId;
  const status = isExpired ? 'expired' : isPending ? 'pending' : 'answered';
  const daysRemaining = link.expiresAt ? 
    Math.ceil((new Date(link.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  
  return { status, daysRemaining, isPending, isExpired, isAnswered };
};

// 2. NOVO COMPONENTE: ShareLinkCard
<ShareLinkCard link={link} onRenew={handleRenew} onDelete={handleDelete} />
├── Mostra status visual
├── Shows contador de respostas
├── Rename/Delete/Copy actions
└── Days remaining badge

// 3. MODIFIED: PatientRecord Share Tab
// Agrupar por status: Respondidos | Aguardando | Expirados
// Mostra agregação por formulário
// Botão "Enviar Novo" vs "Renovar"

// 4. NOVO ALGORITMO: Modal de "Enviar Formulário"
const handleSendForm = async (formId) => {
  // Antes de criar:
  const existingLink = await api.checkExistingLink(formId, patientId);
  
  if (existingLink?.active) {
    // Mostrar opção:
    // "Já existe link ativo. Deseja:"
    // [ ] Reutilizar (copiar)
    // [x] Gerar novo (o anterior vira inativo)
  } else if (existingLink?.expired) {
    // "Link anterior expirou. Deseja:"
    // [ ] Renovar com mesma expiração
    // [x] Gerar novo
  }
};
```

---

## 8. CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Backend (Essencial)

- [ ] Endpoint PATCH `/share/:id/extend` (extend expiração)
- [ ] Modificar POST `/share/create` com smart duplicate check
- [ ] Melhorar GET `/share/patient/:patientId` com status agregado
- [ ] Adicionar campo `version` em Response (migration)
- [ ] Adicionar endpoint POST `/responses/by-patient-form` (histórico)

### Fase 2: Frontend (Essencial)

- [ ] Criar hook `useShareLinkStatus()`
- [ ] Criar componente `ShareLinkCard`
- [ ] Melhorar aba "Compartilhamento" com status visual
- [ ] Modificar modal "Enviar Formulário" com smart logic
- [ ] Adicionar badge de versão em timeline

### Fase 3: UX Polish (Desejável)

- [ ] Mostrar diferença de scores entre versões (+7 pts ↑)
- [ ] "Compare" button entre versões
- [ ] Avisos de expiração em breve
- [ ] Dashboard de análise por formulário
- [ ] Relatório de "compliance" (% respondido)

---

## 9. PROBLEMAS CRÍTICOS vs. DESIGN CHOICES

```
✅ ESTÁ BOM:
- Token único em ShareLink
- Cascade delete funciona
- Response pode ser múltipla (histórico)
- Expiração funciona tecnicamente

⚠️ ENFINAMENTOS:
- Sem prevenção de link duplicado (easy fix)
- Sem UI clara de status (easy fix)
- Sem controle de versioning (nice-to-have)

🔴 CRÍTICO:
- Nenhum, sistema funciona!
- Apenas melhorias de UX
```

