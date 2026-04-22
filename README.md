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
- **Data de Início por Slot (v4.0):** Cada slot tem sua própria data de início ("Início"), permitindo configurar dias diferentes para cada horário semanal. Ex: Segunda às 10:00 (início 20/04) e Quarta às 14:00 (início 22/04).
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
- **Exclusão em Cascata (v4.2):** Ao deletar um registro pai (justificativa), todos os filhos (reagendamentos) são automaticamente deletados via `ON DELETE CASCADE` no banco de dados. O inverso não acontece: ao deletar um filho, apenas aquele registro é removido e o pai permanece com a observação original (mas sem a menção ao reagendamento).
- **Integridade de Notas:** Ao cancelar um reagendamento (filho), o sistema limpa automaticamente a menção ao reagendamento nas notas da sessão pai, mantendo o histórico de observações coerente.
- **Confirmação Contextual:** O sistema calcula e informa ao profissional quantos registros futuros serão excluídos antes de confirmar uma remoção em cascata.

### 3. Visualização e UX
- **Registros Clínicos (Prontuário):** Unificação de notas, laudos e anexos sob a aba "Registros Clínicos", proporcionando um ambiente organizado para a documentação do paciente.
- **Timeline de Frequência:** Exibição visual do encadeamento na aba de frequência, com linhas conectoras e badges de status da cadeia (Início, Meio, Fim).
- **Feedback Moderno (Toasts):** Substituição de alertas invasivos por avisos flutuantes automáticos (Emerald-600).

### 4. Gestão Financeira (v3.7+)
- **Conciliação Financeiro-Clínica:** O sistema permite vincular um pagamento a múltiplas sessões realizadas. Isso garante que o profissional saiba exatamente quais datas foram quitadas e quais estão pendentes.
- **Lançamento em Blocos:** Ideal para pacotes mensais ou quinzenais. O profissional seleciona as sessões, define o valor total e o método de pagamento (Pix, Dinheiro, etc).
- **Máscara de Valor BR:** Campo de entrada formatado em tempo real (ex: "1200" → "12,00") conforme o profissional digita.
- **Anexo de Recibo:** Possibilidade de anexar arquivos PDF/imagens do recibo ao lançamento.
- **Status do Recibo:** Controle visual com três estados:
  - **RECIBO EMITIDO** (verde): Recibo oficialmente emitido.
  - **COM ANEXO** (âmbar): Existe um arquivo anexado.
  - **PENDENTE** (cinza): Sem registro de emissão ou anexo.
- **Edição com Sessões Vinculadas:** Ao editar um pagamento, as sessões já vinculadas aparecem primeiro na lista para facilitar a manutenção.
- **Prestação de Contas:** Geração de documento detalhado contendo o período das sessões, valores e observações para envio ao paciente.

### 5. Gestão de Fuso Horário (v3.4)
- **Armazenamento UTC:** Todas as datas são armazenadas no banco em formato UTC para consistência.
- **Extração de Datas:** O frontend usa funções separadas para extrair datas UTC do banco (`extractUTCDate`) e datas locais do calendário (`formatDateKey`).
- **Comparação Correta:** As comparações entre agendamentos fixos e registros de presença usam extração UTC para evitar deslocamentos de um dia.

### 6. Agenda (v4.3)
- **Modo Mês:** Visualização em formato de calendário mensal com navegação entre meses.
- **Modo Lista:** Visualização por dia navegável, filtrando por dia específico.
- **Navegação Simples:** Setas para navegar (±1 dia em Lista, ±1 mês em Mês), botão "Hoje" para retornar ao dia atual.
- **Status Visual:** Badges P (presente), F (falta), J (justificada) em linha com cada sessão.
- **Modal de Justificativa (v4.3):** Fluxo simplificado que abre o formulário de justificativa diretamente. O modal contém campos para Motivo, Data e Horário de reagendamento.
- **UX de Portals (v4.3):** Modais e confirmações agora utilizam **React Portals**, garantindo que o desfoque de fundo (backdrop-blur) e o conteúdo cubram 100% da tela, eliminando conflitos de layout com a barra lateral ou navegação.

### 7. Gestão Financeira - PDF (v4.3)
- **Relatórios Avançados:** Geração de PDFs profissionais utilizando `jspdf-autotable` para organização superior dos dados clínicos e financeiros.
- **Layout Consolidado:** O relatório completo agrupa sessões vinculadas a cada pagamento em uma única tabela estruturada com `rowSpan`, oferecendo uma visão clara do fluxo de caixa por bloco de sessões.
- **Resumo Executivo:** Seção inicial com total acumulado de pagamentos e volume total de sessões realizadas no período.
- **Identidade Visual:** Design alinhado ao padrão clínico, com cabeçalhos estruturados, linhas divisórias e rodapés automáticos com data e hora da geração do documento.
- **Download Direto:** O arquivo é gerado e baixado localmente de forma instantânea.

## Tecnologias

- **Frontend:** React, Tailwind CSS, Lucide React, date-fns, jsPDF, jsPDF-AutoTable.
- **Backend:** Node.js, Express, Prisma ORM.
- **Banco de Dados:** PostgreSQL (Relacionamento recursivo em `Attendance`).

## Como Iniciar

1. **Instale as dependências:** `npm install`
2. **Sincronize o Banco:** `npx prisma db push` (Pasta backend)
3. **Inicie o Sistema:** `npm run dev`

---
*Este projeto segue rigorosos padrões de integridade de dados clínicos e UX voltada para produtividade.*
