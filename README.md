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
- **Gestão de Pacientes:** Cadastro completo com prontuário digital, histórico de respostas e análise de evolução.
- **Agenda Profissional:** Gestão de horários recorrentes com visão semanal, mensal e detecção de conflitos.
- **Histórico de Frequência:** Registro detalhado de presenças, faltas e reagendamentos inteligentes.
- **Gestão Financeira:** Controle de pagamentos por blocos de sessões, conciliação clínica e geração de prestações de contas.
- **Agenda Profissional:** Gestão integrada de horários recorrentes diretamente no prontuário do paciente.
- **Construtor de Formulários:** Criação de escalas e anamneses personalizadas com SurveyJS v2.

## Regras de Negócio e Lógica do Sistema

### 1. Gestão de Agenda e Horários (Appointments)
- **Configuração no Prontuário:** A configuração de horários recorrentes (slots) foi movida para o prontuário de cada paciente, facilitando o onboarding e a visualização centralizada.
- **Recorrência:** O sistema trabalha com horários fixos semanais (slots).
- **Inativação Inteligente (v3.6):** Ao alterar o status de um paciente para "Inativo", o sistema sugere automaticamente o encerramento da agenda recorrente para liberar o horário no calendário, preservando integralmente o histórico de atendimentos passados.
- **Limpeza de Agenda:** Disponibiliza duas modalidades de remoção:
  - **Limpar Futuro (Encerrar Ciclo):** Remove horários fixos e registros de presença futuros, mantendo o histórico clínico intocado.
  - **Limpeza Total (Reset):** Remove todos os registros (fixos e históricos), utilizado apenas para correção de erros de lançamento.

### 2. Sistema de Frequência e Status (Attendance)
O sistema utiliza uma tríade de estados para cada sessão:
- **Presença (P):** Marca a sessão como realizada (Verde).
- **Falta (F):** Marca a ausência do paciente (Vermelho).
- **Justificada (J):** Indica que a falta foi comunicada (Âmbar).

#### Lógica de Justificativa e Reagendamento em Cadeia (v3.5)
- **Lista Encadeada (Linked List):** Cada reagendamento é vinculado a uma sessão anterior via `parentId`, criando uma linhagem clara de eventos clínicos.
- **Remoção em Cascata Unidirecional:** Ao remover uma justificativa no meio ou início de uma cadeia, o sistema deleta recursivamente todos os descendentes (reagendamentos futuros) e reseta o registro atual para o estado "sem marcação".
- **Integridade de Notas:** Ao cancelar um reagendamento (filho), o sistema limpa automaticamente a menção ao reagendamento nas notas da sessão pai, mantendo o histórico de observações coerente.
- **Confirmação Contextual:** O sistema calcula e informa ao profissional quantos registros futuros serão excluídos antes de confirmar uma remoção em cascata.

### 3. Visualização e UX
- **Hierarquia Visual na Agenda:** 
  - **Sessão Original:** Ícone sólido de alerta.
  - **Reagendamento Intermediário:** Borda pontilhada + ícone de cadeia 🔗.
  - **Reagendamento Final:** Borda pontilhada + ícone de relógio ⏰.
- **Navegação Contextual:** Modais de detalhes permitem "pular" entre sessões da mesma cadeia (ir para origem ou ir para reagendamento) com um clique.
- **Registros Clínicos (Prontuário):** Unificação de notas, laudos e anexos sob a aba "Registros Clínicos", proporcionando um ambiente organizado para a documentação do paciente.
- **Timeline de Frequência:** Exibição visual do encadeamento na aba de frequência, com linhas conectoras e badges de status da cadeia (Início, Meio, Fim).
- **Feedback Moderno (Toasts):** Substituição de alertas invasivos por avisos flutuantes automáticos (Emerald-600).

### 4. Gestão Financeira (v3.7+)
- **Conciliação Financeiro-Clínica:** O sistema permite vincular um pagamento a múltiplas sessões realizadas. Isso garante que o profissional saiba exatamente quais datas foram quitadas e quais estão pendentes.
- **Lançamento em Blocos:** Ideal para pacotes mensais ou quinzenais. O profissional seleciona as sessões, define o valor total e o método de pagamento (Pix, Dinheiro, etc).
- **Máscara de Valor BR:** Campo de entrada formatado em tempo real (ex: "1200" → "12,00") conforme o profissional digita.
- **Anexo de Recibo:** Possibilidade de anexar arquivos PDF/imagens do recibo ao lançamento.
- **Status do Recibo:** Controle visual com três estados:
  - **RECIBO EMITIDO** (verde): Recibo正式的已emitido。
  - **COM ANEXO** (âmbar): 有arquivo anexado。
  - **PENDENTE** (cinza): Sem nothing registrado。
- **Edição com Sesvinculadas:** Ao editar um pagamento, as sessões já vinculadas aparecem primeiro na lista para facilitar a manutenção。
- **Prestação de Contas:** Geração de documento detalhado contendo o período das sessões, valores e observações para envio ao paciente。

### 5. Gestão de Fuso Horário (v3.4)
- **Armazenamento UTC:** Todas as datas são armazenadas no banco em formato UTC para consistência.
- **Extração de Datas:** O frontend usa funções separadas para extrair datas UTC do banco (`extractUTCDate`) e datas locais do calendário (`formatDateKey`).
- **Comparação Correta:** As comparações entre agendamentos fixos e registros de presença usam extração UTC para evitar deslocamentos de um dia.

## Tecnologias

- **Frontend:** React, Tailwind CSS, Lucide React, date-fns.
- **Backend:** Node.js, Express, Prisma ORM.
- **Banco de Dados:** PostgreSQL (Relacionamento recursivo em `Attendance`).

## Como Iniciar

1. **Instale as dependências:** `npm install`
2. **Sincronize o Banco:** `npx prisma db push` (Pasta backend)
3. **Inicie o Sistema:** `npm run dev`

---
*Este projeto segue rigorosos padrões de integridade de dados clínicos e UX voltada para produtividade.*
