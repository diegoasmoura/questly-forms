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

### Cores de Heatmap e Gráficos

| Intensidade | Cor Emerald |
|-------------|-------------|
| 0 | `#e5e7eb` (slate-200) |
| 1 | `#a7f3d0` (emerald-200) |
| 2 | `#6ee7b7` (emerald-300) |
| 3 | `#34d399` (emerald-400) |
| 4+ | `#10b981` (emerald-500) |

## Componentes UI

### Botões

| Tipo | Classe | Descrição |
|------|--------|-----------|
| **Primário** | `.btn-primary` | Ações principais, fundo emerald-600 |
| **Secundário** | `.btn-secondary` | Ações secundárias, fundo slate-100 |
| **Ghost** | `.btn-ghost` | Ações mínimas, hover com slate-200 |
| **Perigo** | `.btn-danger` | Ações destrutivas, fundo red-600 |

### Cards

- **Classe:** `.card`
- **Fundo:** branco com transparência
- **Borda:** `1px solid slate-200`
- **Sombra:** `shadow-sm`
- **Radius:** `rounded-xl`
- **Hover:** `shadow-md` com borda slate-300

### Inputs

- **Classe:** `.input`
- **Fundo:** branco
- **Borda:** `slate-200`
- **Focus:** ring `emerald-500`
- **Placeholder:** `slate-400`

## Funcionalidades Principais

- **Home (Visão Geral):** Resumo dinâmico de atividades, estatísticas de pacientes e gráficos de tendências clínicas (PHQ-9, GAD-7).
- **Gestão de Pacientes:** Cadastro completo com prontuário digital, histórico de respostas e análise de evolução detalhada.
- **Biblioteca Clínica:** Modelos validados prontos para uso (Anamneses, Escalas de Depressão, Ansiedade, etc.).
- **Construtor de Formulários (SurveyJS v2):** Construtor visual avançado com abas de Lógica, Temas, Tradução e Editor JSON.
- **Compartilhamento Seguro:** Gere links únicos para pacientes com vinculação automática ou respostas anônimas.
- **Análise Clínica Avançada:** Visualização item-a-item, scores automáticos, alertas de risco (ex: ideação suicida) e comparação temporal (deltas).
- **Relatórios PDF:** Exporte resumos clínicos e prontuários profissionais em PDF com um clique.

## Novidades Recentes

### Agenda Profissional (v3.0)
- **Multivisão Avançada:** Alternância rápida entre visões Semanal, Mensal e em Lista.
- **Múltiplos Agendamentos:** Suporte para pacientes com sessões recorrentes (2x ou mais por semana) com gerenciamento de slots individuais.
- **Visão Semanal Compacta:** Grade otimizada de 07:00 às 21:00 com alto contraste e design denso para evitar rolagem.
- **Visão Mensal Estruturada:** Calendário clássico com indicadores de sessão e destaque para o dia atual.
- **Detecção de Conflitos:** Verificação em tempo real de sobreposição de horários no cadastro do paciente com alerta visual (vermelho) e indicação de choque.
- **Integração com Prontuário:** Acesso direto aos dados do paciente e histórico clínico a partir de qualquer visão da agenda.
- **Modelo Prisma Evoluído:** Implementação da tabela `Appointment` para gestão robusta de sessões recorrentes.

### Tab Renomeada (v2.16)
- **Config. → Agenda:** Aba de configurações renomeada para "Agenda"
- **Ícone:** Settings (engrenagem) mantido

### Status de Pacientes e Contadores (v2.15)
- **Campos isActive/inactivatedAt:** Pacientes podem ser ativados ou inativados
- **Badge de status:** ATIVO (verde) ou INATIVO (cinza) nos cards
- **Datas de cadastro:** Exibidas no modal de edição
- **Data de inativação:** Registrada automaticamente ao desativar
- **Contadores plurais:** 0/1 Enviado, 2+ Enviados (singular/plural correto)
- **Visual diferenciado:** Pacientes inativos com opacidade reduzida (70%)
- **Ícone cinza:** Sigla do paciente fica cinza quando inativo

### Sistema de Upload de Anexos (v2.14)
- **Secure Upload:** Upload de arquivos seguros para pacientes (PDF, JPG, PNG, DOC)
- **Validação:** Tipos de arquivo permitidos e limite de 10MB
- **Segurança:** UUIDs para nomes de arquivos, verificação de propriedade
- **Backend:** Rotas dedicadas em `backend/src/routes/attachments.js`
- **Modelo Prisma:** Tabela Attachment vinculada ao Patient
- **Proteção:** Middleware de autenticação com suporte a query token
- **Upload direto:** Download via fetch + blob (sem abrir nova aba)

### Cadastro/Edicação de Pacientes Padronizados (v2.14)
- **Design unificado:** Modal de cadastro e edição com visual idêntico
- **5 abas:** Identificação, Contato, Endereço, Notas, Configurações
- **Ícones Lucide:** UserCheck, Contact, MapPin, FileText, Settings
- **Máscaras:** CPF, Telefone, CEP formatados automaticamente
- **Toggle Status:** Ativo/Inativo no cadastro e edição
- **Configurações:** Periodicidade, valor por sessão, tipo de encerramento

### UX - Agrupamento de Pacientes (v2.13)
- **Problema:** Pacientes com múltiplas respostas apareciam repetidos na lista
- **Solução:** Cards agrupados por paciente com badge mostrando quantidade de respostas
- **Exemplo:** "5 respostas · PHQ-9: Questionário..."
- **Arquivo:** `frontend/src/pages/Home.jsx`

### UI - Branding Losango (v2.13)
- **Logo:** Quadrado rotacionado 45° (losango) com Q centralizado
- **Aplicado em:** Landing, Login, Register, ShareLink, PatientForm, Sidebar
- **Animação:** Spring rotation ao expandir/colapsar sidebar
- **Sidebar:** Losango centralizado quando colapsado

### UX - Notas Clínicas Destacadas (v2.13)
- **Notas preenchidas:** Fundo amber para destaque visual
- **Notas vazias:** Texto cinza itálico
- **Consistência:** Página segue padrão de background (sem fundo verde)

### Correções de Fuso Horário (v2.12)
- **Problema:** O mapa de calor não coloria os dias corretos mesmo com respostas existentes
- **Causa:** Backend retornava datas em UTC (ISOString) mas frontend usava timezone local
- **Solução:** Usar `toLocaleDateString('en-CA')` no backend para gerar YYYY-MM-DD no fuso local
- **Arquivo:** `backend/src/routes/responses.js` - função de agregação de diários

⚠️ **Importante:** Ao trabalhar com datas, SEMPRE use timezone local:
```javascript
// ❌ Errado - UTC
const day = new Date(r.createdAt).toISOString().split('T')[0];

// ✅ Correto - Timezone local
const day = date.toLocaleDateString('en-CA'); // YYYY-MM-DD local
```

### Design - Cores Diferenciadas (v2.11)
- **Forms:** Background Bone (#F9F6F0) com linhas horizontais de caderno
- **Patients:** Background Warm Cream (#F0EBE3) com acentos em âmbar
- **Botões:** Tooltips adicionados em todas as telas de lista
- **Sem Atividade:** Fundo azul claro (blue-50) com texto slate

### Correção do FormBuilder (v2.12)
- **Problema:** Ao editar formulário, dados não carregavam corretamente
- **Solução:** Adicionado delay de 100ms + loading state antes de definir JSON no Creator
- **Melhoria:** Estado de loading visual com indicador animado

### Segurança (v2.10)
- **CORS Restrito:** Apenas origens permitidas configuradas
- **Rate Limiting:** 5 tentativas de login por 15 minutos por IP
- **Security Headers:** X-Frame-Options, X-XSS-Protection, HSTS
- **JWT:** Expiração reduzida para 24h
- **Mensagens de Erro:** Genéricas em produção (não expõe stack traces)
- **Validação:** Email com regex, senha mínima 6 caracteres
- **Backend:** .gitignore e .env.example criados

### Correções de Bugs e Refatoração (v2.8)
- **App.jsx:** Bug crítico corrigido - LoadingScreen movido para antes dos componentes de rota
- **AuthContext.jsx:** JSON.parse envolvido em try-catch para evitar crash com dados corrompidos
- **ShareLinkCard.jsx:** Bug corrigido na função de renovação customizada (passagem de parâmetros)
- **api.js:** Timeout de 15s em todas requisições + classe ApiError personalizada
- **utils.js:** Funções utilitárias criadas (formatCPF, formatPhone, formatCEP, formatDate, debounce)
- **Home.jsx:** N+1 queries otimizadas com Promise.all para todas requisições paralelas
- **Acessibilidade:** ARIA labels adicionados em botões da sidebar e modais
- **Console logs:** Removidos logs de debug do código em produção

### Aprimoramentos de UX (v2.7)
- **Sidebar Inteligente:** "My Forms" permanece selecionado ao criar/editar formulários
- **Scrollbar Estilizado:** Cor slate para combinar com o tema
- **Transições de Página:** Login/Register deslizam suavemente da direita com fade
- **Loading Overlay:** Tela de carregamento animada ao submeter formulários (framer-motion)
- **Botão Cadastrar:** Animação de escala no hover/tap
- **Links de Navegação:** "Voltar ao início" nas páginas de Login/Register

### Transições Suaves de Página (v2.3)
- **Animações Fade + Slide:** Navegação suave entre todas as páginas principais
- **Framer Motion:** Transições elegantes com `AnimatePresence`
- **Direção do Fluxo:** Pages deslizam da direita para esquerda ao navegar

### Sidebar com Animação de Colapso (v2.2)
- **Sidebar Retraível:** Largura de 256px expandida para 72px retraída
- **Ícones Centralizados:** Todos os ícones centralizados quando retraído
- **Avatar do Usuário:** Siglas (DM) aparecem apenas quando sidebar retraído
- **Paleta Azul Profissional:** Avatar com gradientes em tons de azul que combinam com o tema escuro
- **Typewriter Animation:** Nome "Questly Forms" aparece letra por letra ao expandir

### Grid Pattern em Todas as Telas (v2.5)
- **Background Grid Verde:** Padrão sutil de linhas emerald (#10b981) com 20% de opacidade
- **Presente em:** Landing Page, Login, Register e todas as telas autenticadas
- **Layout Component:** Grid adicionado ao `Layout.jsx` para consistência
- **Efeito:** Adiciona profundidade visual sem competir com o conteúdo

### Mapa de Calor Aprimorado (v2.6)
- **Seleção de dia:** Clique em qualquer dia para ver os detalhes
- **Tooltip informativo:** Mostra data completa + quantidade de respostas formatada em português
- **Dias da semana:** Todos os 7 dias exibidos (Dom, Seg, Ter, Qua, Qui, Sex, Sáb)
- **Visual:** Anel azul indica dia selecionado, X para fechar
- **Intensidade simplificada:** Apenas 2 cores (slate-200 para vazio, emerald-500 para com resposta)
- **Dias futuros:** Exibidos em slate-200 com opacidade reduzida

### Rebranding Visual (v2.0)
- **Novo Nome:** Curious → Questly Forms
- **Nova Identidade Visual:** Design profissional com cores slate e verde brand
- **Sidebar Escura:** slate-900 para navegação clara e moderna
- **Background Suave:** slate-100 (#f1f5f9) em vez de branco puro
- **Cards Consolidados:** Fundo branco com bordas slate-200
- **UX Research:** Cores baseadas em benchmarks de dashboards clínicos

### Landing Page com Animações (v2.4)

A página inicial é uma landing page minimalista com animações 3D que demonstram visualmente o conceito de formulários clínicos.

#### Estrutura da Página

```
┌─────────────────────────────────────────┐
│  [Logo Q] Questly Forms   [Entrar] [Começar]│
├─────────────────────────────────────────┤
│                                         │
│        Avalie.                          │
│        Acompanhe.                       │
│        Evolua.                          │
│                                         │
│  Formulários clínicos que entendem      │
│  seus pacientes. Escalas validadas,     │
│  scoring automático e gráficos...        │
│                                         │
│  [Começar agora]  [Já tenho conta]     │
│                                         │
├─────────────────────────────────────────┤
│     ╔═══════════════════════════╗       │
│     ║  ○ Não, de forma alguma  ║       │  ← Skew Scroll
│     ║  ○ Sim, alguns dias      ║       │    Animation
│     ║  ○ Sim, mais da metade   ║       │
│     ╚═══════════════════════════╝       │
├─────────────────────────────────────────┤
│      Questly Forms 2025. Todos os       │
│           direitos reservados.           │
└─────────────────────────────────────────┘
```

#### Background Pattern
- **Grid de pontos:** Padrão sutil de pontos emerald (#10b981) com 15% de opacidade
- **Tamanho:** 28px de espaçamento entre pontos

#### Animação Skew Scroll
- **Efeito 3D:** Rotação inclinada (20° no eixo X, 15° no eixo Z)
- **Velocidade:** 20 segundos por ciclo
- **Loop:** Infinitas com 120 itens duplicados (24 respostas × 5)
- **Máscara:** Gradiente de fade nas bordas para suavizar entrada/saída
- **Direção:** Scroll diagonal de cima para baixo

#### Cartões de Respostas
- **Estilo:** Radio button não marcado com borda cinza fina
- **Layout:** Grid responsivo (1 coluna mobile → 3 colunas desktop)
- **Respostas incluídas:** Respostas típicas de escalas clínicas (PHQ-9, GAD-7, etc.)
  - Frequência: "Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"
  - Intensidade: "Pouco ou nada", "Um pouco", "Bastante", "Extremamente"
  - Dias: "1 a 2 dias", "3 a 4 dias", "5 a 7 dias", "Quase todos os dias", "Todo dia"
  - Problema: "Não me incomoda", "É um pouco problemático", "É bastante problemático", "É extremamente problemático"

#### Implementação Técnica

**CSS (src/index.css):**
```css
@keyframes skew-scroll {
  0% {
    transform: rotatex(20deg) rotatez(-15deg) skewx(15deg) translatez(0) translatey(0);
  }
  100% {
    transform: rotatex(20deg) rotatez(-15deg) skewx(15deg) translatez(0) translatey(-50%);
  }
}

.animate-skew-scroll {
  animation: skew-scroll 20s linear infinite;
  will-change: transform;
}
```

**Tailwind Config (tailwind.config.js):**
```js
keyframes: {
  "skew-scroll": {
    "0%": { transform: "rotatex(20deg) rotatez(-15deg) skewx(15deg) translatez(0) translatey(0)" },
    "100%": { transform: "rotatex(20deg) rotatez(-15deg) skewx(15deg) translatez(0) translatey(-50%)" },
  },
},
animation: {
  "skew-scroll": "skew-scroll 20s linear infinite",
},
```

#### Personalização

| Parâmetro | Valor Padrão | Descrição |
|-----------|--------------|-----------|
| Velocidade | 20s | Tempo para completar um ciclo |
| Itens duplicados | 5x | Quantidade de repetições para loop longo |
| Colunas desktop | 3 | Grid columns em telas grandes |
| Colunas mobile | 1 | Grid columns em telas pequenas |
| Tamanho do grid | 300px altura | Altura visível do container |


### Toggle Grid/List
- Visualização em cards ou lista nas páginas Meus Formulários, Pacientes e Biblioteca
- Preferência salva em localStorage

### Mapa de Calor (Activity Heatmap)
- Visualização estilo GitHub da atividade clínica no Home
- Ano completo com células dinâmicas que se adaptam ao espaço disponível

### Pacientes Atendidos Recentemente
- Seção no Home mostrando pacientes ordenados pelo último atendimento
- Ranking e detalhes do formulário respondido

### Layout Consistente
- Todas as páginas principais (Home, Biblioteca, Pacientes, Meus Formulários, Respostas, Prontuário) usam o mesmo padrão de layout ocupando 100% da altura da tela

### Visualização de Formulários
- FormPreview agora abre direto no modo de teste para permitir preenchimento e validação do formulário antes de enviar aos pacientes

### Navegação Inteligente
- Botão voltar contextualizado nas telas de análise, retorna para o contexto de origem (Prontuário ou Lista de Respostas)

### Visualização de Templates
- Botão "Visualizar" na Biblioteca importa o template temporariamente e abre no modo de teste para validação antes de adicionar oficialmente

### Sistema de Compartilhamento Avançado
- **Prevenção de Duplicatas:** Links duplicados são reutilizados automaticamente com confirmação
- **Status Visual:** Badges coloridos (Pendente, Respondido, Expirado) com bolinhas indicativas
- **Renovação Flexível:** Dropdown com opções de 7, 15, 30, 60, 90 dias ou personalizado
- **Badge de Versão:** Indicação de quantas vezes o paciente respondeu (v2, v3...)
- **Comparação de Scores:** Delta de pontos entre respostas (↑7 pts, ↓3 pts)

## Fluxo de Trabalho Padrão

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

## Tecnologias

- **Frontend:** React, Tailwind CSS, Lucide React, Motion, SurveyJS v2, Recharts
- **Backend:** Node.js, Express, Prisma ORM
- **Banco de Dados:** PostgreSQL (Docker)
- **Infraestrutura:** Docker & Docker Compose
- **Autenticação:** JWT (JSON Web Tokens)

## Como Iniciar

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
   - O banco de dados PostgreSQL iniciará automaticamente.

3. **Inicie o Ambiente de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   - O Frontend rodará em: `http://localhost:3002`
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

## Estrutura do Banco de Dados

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

## API Endpoints

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
- `POST /api/share/create` - Criar link com smart duplicate check
- `GET /api/share/patient/:patientId` - Listar links do paciente
- `PATCH /api/share/:id/extend` - Renovar link por X dias
- `PATCH /api/share/:id/revoke` - Revogar link
- `GET /api/share/:token` - Acessar formulário via token (público)
- `POST /api/share/:token/submit` - Submeter resposta (público)

### Respostas
- `GET /api/responses/form/:formId` - Respostas de um formulário
- `GET /api/responses/:id` - Uma resposta específica
- `DELETE /api/responses/:id` - Deletar resposta

## Licença

Este projeto é de uso privado para profissionais de saúde.
