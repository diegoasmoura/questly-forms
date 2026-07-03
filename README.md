# Questly Forms 

Uma plataforma moderna e intuitiva para psicólogos gerenciarem pacientes, criarem formulários clínicos baseados em evidências e acompanharem a evolução terapêutica através de dados.

## 📚 Documentação (Comece por aqui!)
Para garantir a consistência e a alta qualidade visual do projeto, toda a documentação técnica, regras de negócio e de Design System foram modularizadas.

Seja você um novo desenvolvedor na equipe ou uma Inteligência Artificial, **leia obrigatoriamente** os guias na pasta `docs/` antes de alterar qualquer código:

- 🎨 **[0_design_system.md](docs/0_design_system.md):** Cores, Fontes e Regras dos Botões (Squircles).
- 🗺️ **[1_layout_e_navegacao.md](docs/1_layout_e_navegacao.md):** Sidebar e Menu de Perfil.
- 🏠 **[2_home_dashboard.md](docs/2_home_dashboard.md):** Tela inicial, Widgets e KPIs.
- 👥 **[3_pacientes.md](docs/3_pacientes.md):** Demografia e geração de Avatares.
- 🗓️ **[4_agenda.md](docs/4_agenda.md):** Calendário, Modais de Agendamento e Cores de Status.
- 📝 **[5_instrumentos_e_acervo.md](docs/5_instrumentos_e_acervo.md):** Construtor de Formulários.

## 🚀 Como Executar

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend (Supabase)
O projeto utiliza Supabase para autenticação e banco de dados. Certifique-se de configurar o arquivo `.env` no frontend com as chaves corretas providenciadas pela equipe.
