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

## 🛠️ Tecnologias

- **Frontend:** React, Tailwind CSS, Lucide React, SurveyJS v2, Recharts, TanStack Table.
- **Backend:** Node.js, Express, Prisma ORM.
- **Banco de Dados:** PostgreSQL (Supabase/Docker).
- **Infraestrutura:** Docker & Docker Compose.

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
   - O Backend rodará em: `http://localhost:3000`

4. **Sincronização do Banco (se necessário):**
   ```bash
   cd backend
   npx prisma db push
   npx prisma generate
   ```

## 📄 Licença

Este projeto é de uso privado para profissionais de saúde.
