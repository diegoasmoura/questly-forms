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
- **Cloudflare Tunnels & Edge Caching:** O ambiente de produção delega o proxy reverso e a camada de segurança para a rede global da Cloudflare, utilizando Nginx interno apenas como servidor web estático super otimizado para Gzip e cache.
- **Fontes Self-Hosted:** As fontes estão encapsuladas dentro da própria aplicação (em `.woff2`) cortando a latência natural de buscar de APIs do Google.
- **Atualizações Silenciosas (Flicker-Free):** O Dashboard utiliza fluxos de Background Refresh (ex: `loadData(true)`) para se atualizar ao interagir com modais sem "piscar" a tela.

## 📝 Atualizações Recentes (UI & UX)
Foi realizada uma ampla refatoração visual e funcional focada na padronização da experiência do usuário (UX), responsividade mobile e integridade clínica:
- **Padrão de Centralização Útil no Mobile (Perfect-Center Standard):** Todos os modais flutuantes agora se posicionam rigorosamente no centro geométrico da área útil da tela mobile (entre o topo do celular e o topo do menu inferior no footer), calibrados com padding inferior dinâmico (`pb-[calc(65px+env(safe-area-inset-bottom)+16px)]`).
- **Desfoque de Fundo Total no Footer:** Ajustado o `z-index` da navegação inferior móvel (`BottomNav` em `z-40`) e dos modais (`z-[100]`), garantindo que o efeito de desfoque (`backdrop-blur-[3px] bg-black/40`) cubra 100% da viewport, incluindo o menu inferior do celular.
- **Isolamento de Notas e Status de Atendimento:** Garantido isolamento estrito entre os textos de Presença, Falta e Justificativa. Agendamentos com falta justificada abrem diretamente no painel de justificativa com motivos e reagendamentos pré-carregados do banco.
- **Padronização de Cores de Status:** Cores de status unificadas na Agenda, Dashboard e Modais: **Falta** em Vermelho (`#EF4444`), **Presença** em Verde Sage (`#5CBF90`), **Justificado** em Roxo (`#7C5CFF`) e **Agendado** em Azul (`#2E7DFF`).
- **Rodapés e Rótulos Uniformes:** Botão secundário de modais padronizado como **"Fechar"** (`triggerClose`), e cabeçalhos de observações clínica com ícone `<Sparkles />` no tom da ação e badge de estado **"Preenchido"** dinâmico.
