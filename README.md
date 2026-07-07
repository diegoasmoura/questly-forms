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

## ⚡ Arquitetura e Performance (PWA)
Este projeto está otimizado para o Padrão Ouro de Performance Web:
- **Code-Splitting Dinâmico:** Todas as rotas usam `React.lazy()` para não enviar um pacote (bundle) monolítico gigante ao usuário.
- **PWA (Progressive Web App):** Utiliza `vite-plugin-pwa` e **Workbox** para gerar Service Workers, fazer cache de todos os arquivos estáticos na máquina do usuário e permitir a leitura offline dos dados.
- **Background Sync:** Interações feitas sem internet (como marcar presença na agenda) são retidas pelo navegador e sincronizadas automaticamente em até 24 horas.
- **Servidor Nginx HTTP/2:** O ambiente de produção (Dockerfile) compila o sistema e o serve através do Nginx com Gzip e cache máximo, extinguindo gargalos de conexão.
- **Fontes Self-Hosted:** As fontes estão encapsuladas dentro da própria aplicação (em `.woff2`) cortando a latência natural de buscar de APIs do Google.
- **Atualizações Silenciosas (Flicker-Free):** O Dashboard utiliza fluxos de Background Refresh (ex: `loadData(true)`) para se atualizar ao interagir com modais sem "piscar" a tela.

## 📝 Atualizações Recentes (UI & UX)
Foi realizada uma ampla refatoração visual focada em padronizar a aplicação para suportar nativamente **Modo Claro** e **Modo Escuro**:
- **Design System Aplicado:** Componentes legados que utilizavam cores estáticas do Tailwind (ex: `slate-50`, `brand-600`) foram atualizados para utilizar as variáveis semânticas do projeto (`--surface`, `--surface-alt`, `--bg`, `--text-primary`, `--sage`).
- **Modais Padronizados:** Telas como *Importar Dados*, *Novo Paciente* e *Detalhes do Agendamento* receberam uniformidade total (fundos sólidos com base na variável Surface, bordas sutis e z-index padronizado `z-[100]` com `backdrop-blur`).
- **Agenda Otimizada:** Componentização dos itens da agenda como cartões interativos distintos com feedbacks visuais claros e neutros ao passar o mouse, abolindo os antigos sublinhados que mesclavam com a interface.
- **Remoção de Gradientes/Opacidades Problemáticas:** Ajuste do card de aniversariantes no modo lista para respeitar o fundo transparente nativo com badges sólidas (sem misturar transparências opacas no modo escuro).
