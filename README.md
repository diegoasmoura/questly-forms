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
- **Construtor de Formulários:** Criação de escalas e anamneses personalizadas com SurveyJS v2.

## Regras de Negócio e Lógica do Sistema

### 1. Gestão de Agenda e Horários (Appointments)
- **Recorrência:** O sistema trabalha com horários fixos semanais (slots).
- **Data de Início:** Essencial para definir quando o ciclo de sessões começa.
- **Condicional de Validação:** A "Data de Início" é obrigatória **apenas** se houver horários na grade. Se a grade estiver vazia, o campo é opcional para permitir limpezas rápidas.
- **Limpeza Profunda (Deep Cleanup):** Ao clicar em "Limpar Agenda" e salvar, o sistema remove todos os horários fixos **e todo o histórico de presenças/faltas** daquele paciente (Rollback Total).

### 2. Sistema de Frequência e Status (Attendance)
O sistema utiliza uma tríade de estados para cada sessão:
- **Presença (P):** Marca a sessão como realizada (Verde).
- **Falta (F):** Marca a ausência do paciente (Vermelho).
- **Justificada (J):** Indica que a falta foi comunicada (Âmbar).

#### Lógica de Justificativa e Reagendamento (v3.3)
- **Vínculo Pai-Filho (Chaining):** Ao reagendar, o sistema cria um vínculo entre a data original (Pai) e a nova data (Filho).
- **Proteção de Registro:** Assim que um registro é marcado como **J**, os botões **P** e **F** desaparecem da tela para evitar alterações acidentais. Apenas o **J** permanece como porta de entrada para edição.
- **Rollback em Cadeia:** Graças à relação `parentId` com `onDelete: Cascade`, se você remover a justificativa original, todos os reagendamentos futuros que nasceram dela são excluídos automaticamente.
- **Portal de Informação:** Clicar em um registro **J** abre um resumo com o motivo e um **botão de atalho** para "pular" o calendário direto para a nova data reagendada.

### 3. Visualização e UX
- **Sessões Extras:** Reagendamentos que ocorrem fora do dia habitual do paciente ganham uma **borda pontilhada** no calendário para fácil identificação.
- **Feedback Moderno (Toasts):** Substituição de alertas invasivos por avisos flutuantes automáticos (Emerald-600) que não travam o fluxo de trabalho.
- **Aba Frequência:** Nova seção no prontuário com dashboard de estatísticas e timeline vertical detalhada contendo ícones, selos de reagendamento e notas clínicas.

### 4. Gestão de Fuso Horário (v3.4)
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
