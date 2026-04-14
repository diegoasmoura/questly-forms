# Curious - Gestão Clínica para Psicólogos

Uma plataforma moderna e intuitiva para psicólogos gerenciarem pacientes, criarem formulários clínicos baseados em evidências e acompanharem a evolução terapêutica através de dados.

## 🚀 Funcionalidades Principais

- **📊 Home (Visão Geral):** Resumo dinâmico de atividades, estatísticas de pacientes e gráficos de tendências clínicas (PHQ-9, GAD-7).
- **👥 Gestão de Pacientes:** Cadastro completo com prontuário digital, histórico de respostas e análise de evolução detalhada.
- **📚 Biblioteca Clínica:** Modelos validados prontos para uso (Anamneses, Escalas de Depressão, Ansiedade, etc.).
- **📝 Construtor de Formulários (SurveyJS v2):** Construtor visual avançado com abas de Lógica, Temas, Tradução e Editor JSON.
- **🔗 Compartilhamento Seguro:** Gere links únicos para pacientes com vinculação automática ou respostas anônimas.
- **📈 Análise Clínica Avançada:** Visualização item-a-item, scores automáticos, alertas de risco (ex: ideação suicida) e comparação temporal (deltas).
- **📄 Relatórios PDF:** Exporte resumos clínicos e prontuários profissionais em PDF com um clique.

## 🌟 Novidades Recentes

- **SurveyJS v2.5.19:** Upgrade completo do motor de formulários para a versão mais recente, garantindo estabilidade, novos recursos e UI aprimorada.
- **Arquitetura de Navegação 360°:** Navegação fluida entre Dashboard, Prontuário do Paciente e Análise Detalhada de Respostas.
- **Reorganização Clínica:** Hierarquia de informação otimizada (Resumo → Detalhe → Dados Brutos), com resultados críticos sempre no topo.
- **Vínculo Inteligente:** Sistema aprimorado para diferenciar respostas de pacientes identificados vs. respostas anônimas via link.
- **Sistema de Compartilhamento Avançado:**
  - **Prevenção de Duplicatas:** Links duplicados são reutilizados automaticamente com confirmação
  - **Status Visual:** Badges coloridos (Pendente, Respondido, Expirado) com bolinhas indicativas
  - **Renovação Flexível:** Dropdown com opções de 7, 15, 30, 60, 90 dias ou personalizado (mesma UX no modal e nos cards)
  - **Badge de Versão:** Indicação de quantas vezes o paciente respondeu (v2, v3...)
  - **Comparação de Scores:** Delta de pontos entre respostas (↑7 pts, ↓3 pts)
  - **Compliance Tracker:** Barra de statistics mostrando pendentes/respondidos/expirados
  - **Hooks Reutilizáveis:** `useShareLinkStatus()` para gerenciamento de estado
  - **Cards Otimizados:** Layout compacto com datas, link e ações na mesma view

## 📋 Regras e Fluxos

### 1. Gestão de Compartilhamento (Share Links)

#### Ciclo de Vida de um Link
- **Criação:** Links são gerados apenas dentro do Prontuário do Paciente (aba "Compartilhamento")
- **Validade:** Padrão de 30 dias a partir da data de criação (configurável)
- **Status:** Um link pode estar **Pendente**, **Respondido** ou **Expirado**
  - **Pendente:** Link ativo aguardando resposta
  - **Respondido:** Paciente respondeu o formulário
  - **Expirado:** Link venceu sem resposta ou foi revogado
- **Renovação:** Links podem ser renovados por mais 7, 15, 30, 60 ou 90 dias
- **Exclusão:** Links podem ser deletados completamente a qualquer momento

#### Localização do Compartilhamento
- ✅ **Permitido:** Within PatientRecord → "Compartilhamento" tab (Professional only)
- ❌ **Não Permitido:** MyForms page (para evitar mistura de pacientes)

#### Dados do Link
Cada link compartilhado contém:
- `id`: Identificador único do link
- `token`: UUID para URL pública (ex: `/form/a79928b7b2464719b5064feb086433b7`)
- `formId`: Qual formulário será respondido
- `patientId`: Paciente vinculado (para rastreamento automático de respostas)
- `createdAt`: Data e hora de criação
- `expiresAt`: Data e hora de expiração
- `active`: Status (true = ativo, false = expirado/revogado)

### 2. Respostas e Rastreamento

#### Vínculo de Respostas
- Respostas via link compartilhado são automaticamente vinculadas ao paciente
- Cada resposta registra data/hora e status de conclusão
- Timeline do paciente mostra: Respondidos (✅) vs Aguardando Resposta (⏳)

#### Status de Resposta
- **Respondidos:** Link foi respondido (exibe data/hora da resposta)
- **Aguardando Resposta:** Link enviado mas sem resposta (exibe dias restantes)
- **Expirado:** Link ultrapassou data de expiração (sem mais aceitar respostas)

### 3. Autenticação e Permissões

#### Autenticação
- Sistema baseado em JWT (JSON Web Tokens)
- Login obrigatório para acessar dashboard
- Tokens armazenados em localStorage

#### Permissões por Recurso
| Recurso | Proprietário | Visualiza | Edita | Deleta |
|---------|-------------|-----------|-------|--------|
| Formulário | Psicólogo criador | ✅ Seus formas | ✅ | ✅ |
| Paciente | Psicólogo vinculado | ✅ Seus pacientes | ✅ | ✅ |
| Link de Compartilhamento | Proprietário de forma | ✅ Seus links | ✅ | ✅ |
| Resposta | Respondente | ✅ Anônimo se via link | ❌ | ❌ |

#### Regras de Acesso
- Um psicólogo só vê e gerencia seus próprios formulários e pacientes
- Um paciente só recebe links válidos e ativos
- Respostas anônimas não mostram dados do paciente

### 4. Fluxo de Trabalho Padrão

```
1. Psicólogo cria Formulário (MyForms)
   ↓
2. Psicólogo acessa Prontuário do Paciente
   ↓
3. Clica em "Compartilhamento" → "Enviar Formulário"
   ↓
4. Seleciona formulário + data de expiração (padrão 30 dias)
   ↓
5. Link gerado automaticamente (copiável)
   ↓
6. Link enviado ao paciente (por WhatsApp, email, etc.)
   ↓
7. Paciente acessa link e responde formulário
   ↓
8. Resposta vinculada automaticamente ao paciente
   ↓
9. Psicólogo vê resultado na Timeline do Prontuário
```

### 5. Operações com Links

#### Criar Link
- Requer: Acesso ao formulário + Paciente selecionado
- Retorna: URL pública + link para compartilhamento
- Smart Duplicate: Se já existir link ativo, reutiliza e notifica

#### Visualizar Links
- Mostra todos os links do paciente com status:
  - **Pendente:** Links válidos (aceita respostas)
  - **Respondido:** Links com resposta completa
  - **Expirado:** Links vencidos sem resposta

#### Copiar Link
- Copia URL para clipboard
- Formato: `http://[host]/form/[token]`

#### Renovar Link
- Adiciona dias à data de expiração atual
- Opções: 7, 15, 30, 60, 90 dias ou personalizado
- Para links respondidos: calcula a partir de agora
- Para links pendentes/expirados: adiciona aos dias restantes

#### Revogar/Deletar Link
- Remove link completamente do banco de dados
- Link não mais funciona
- Respostas já coletadas não são afetadas

### 6. Validações

#### Data de Expiração
- Mínimo: Data atual (não permite datas passadas)
- Padrão: 30 dias a partir de hoje
- Máximo: Sem limite (pode ser 1 ano, 10 anos, etc.)

#### Nomes de Pacientes
- Campo obrigatório no link (para referência)
- Pode ser diferente do nome no prontuário

#### Segurança
- Links são UUIDs únicos (não-sequenciais)
- Sem autenticação necessária para respondent (acesso via token)
- Cada usuário só vê seus próprios links

## 🛠️ Tecnologias

- **Frontend:** React, Tailwind CSS, Lucide React, SurveyJS v2, Recharts, TanStack Table.
- **Backend:** Node.js, Express, Prisma ORM.
- **Banco de Dados:** PostgreSQL (Supabase/Docker).
- **Infraestrutura:** Docker & Docker Compose.
- **Autenticação:** JWT (JSON Web Tokens)

## 🏁 Como Iniciar

### Pré-requisitos
- Node.js (v18+)
- Docker Desktop rodando

### Passo a Passo

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure o Banco de Dados:**
   - Certifique-se que o Docker está aberto.
   - O banco de dados iniciará automaticamente no modo desenvolvimento.

3. **Inicie o Ambiente de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   - O Frontend rodará em: `http://localhost:5173`
   - O Backend rodará em: `http://localhost:3001`

4. **Sincronização do Banco (se necessário):**
   ```bash
   cd backend
   npx prisma db push
   npx prisma generate
   ```

### Docker Compose

Para iniciar toda a stack (Frontend, Backend, Banco):
```bash
docker-compose up -d
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### Users
- Psicólogos registrados no sistema
- Autenticação via email/senha

#### Patients
- Dados demográficos e clínicos
- Vinculo com psicólogo (psychologistId)
- Histórico de endereço e contatos

#### Forms
- Formulários criados por psicólogos
- Schema JSON (estrutura de perguntas)
- Propriedade: createdBy (ID do psicólogo)

#### ShareLinks
- Links de compartilhamento
- Vinculo com Form + Patient
- Status (active), expiração e timestamps

#### Responses
- Respostas coletadas
- Vinculo com Form + Patient
- Dados das respostas em JSON

## 🔌 API Endpoints (Principais)

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Usuário atual

### Formulários
- `GET /api/forms` - Listar meus formulários
- `POST /api/forms` - Criar formulário
- `PUT /api/forms/:id` - Editar formulário
- `DELETE /api/forms/:id` - Deletar formulário

### Pacientes
- `GET /api/patients` - Listar meus pacientes
- `POST /api/patients` - Criar paciente
- `PUT /api/patients/:id` - Editar paciente
- `DELETE /api/patients/:id` - Deletar paciente

### Compartilhamento
- `POST /api/share/create` - Criar link com smart duplicate check (autenticado)
- `GET /api/share/patient/:patientId` - Listar links com status agregado (autenticado)
- `PATCH /api/share/:id/extend` - Renovar link por X dias (autenticado)
- `PATCH /api/share/:id/revoke` - Deletar link (autenticado)
- `GET /api/share/:token` - Acessar formulário via token (público)
- `POST /api/share/:token/submit` - Submeter resposta (público)

### Status de Links
Os links retornam metadados agregados:
- `status`: "PENDENTE" | "RESPONDIDO" | "EXPIRADO"
- `responseCount`: Quantidade de respostas
- `lastResponseAt`: Data da última resposta
- `daysRemaining`: Dias até expiração

### Respostas
- `GET /api/responses/form/:formId` - Respostas de um formulário
- `GET /api/responses/:id` - Uma resposta específica
- `DELETE /api/responses/:id` - Deletar resposta

## 📄 Licença

Este projeto é de uso privado para profissionais de saúde.
