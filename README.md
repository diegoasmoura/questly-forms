# Curious - Gestão Clínica para Psicólogos

Uma plataforma moderna e intuitiva para psicólogos gerenciarem pacientes, criarem formulários clínicos baseados em evidências e acompanharem a evolução terapêutica através de dados.

## 🚀 Funcionalidades Principais

- **📊 Home (Visão Geral):** Resumo dinâmico de atividades, estatísticas de pacientes e gráficos de tendências clínicas (PHQ-9, GAD-7).
- **👥 Gestão de Pacientes:** Cadastro completo com CPF, RG, endereço e contatos de emergência. Prontuário digital com histórico de respostas e análise de evolução.
- **📚 Biblioteca Clínica:** Modelos validados prontos para uso (Anamneses, Escalas de Depressão, Ansiedade, etc.).
- **📝 Meus Formulários:** Construtor visual (Arraste-e-Solte) para criar escalas personalizadas.
- **🔗 Compartilhamento Seguro:** Gere links únicos para seus pacientes preencherem de forma remota.
- **📄 Relatórios PDF:** Exporte resumos clínicos e prontuários em PDF com um clique.

## 🛠️ Tecnologias

- **Frontend:** React, Tailwind CSS, Lucide React, SurveyJS, Recharts.
- **Backend:** Node.js, Express, Prisma ORM.
- **Banco de Dados:** PostgreSQL.
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
