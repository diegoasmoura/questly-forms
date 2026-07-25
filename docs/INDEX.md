# 🧠 Central Técnica e Arquitetura (Questly Forms)

**Atenção IA:** Este é o **Hub Principal** do projeto. Sempre que iniciar uma tarefa complexa, consulte este arquivo para se localizar na arquitetura e saber qual documentação específica ler.

## 🧭 Mapa da Documentação (Módulos)

| Módulo / Tema | Arquivo de Consulta Obrigatória | O que você encontra lá |
|---|---|---|
| **Design System Base** | `docs/0_design_system.md` | Tipografia, raios de borda, sombras, botões, modais e componentes genéricos. |
| **Cores e Temas (Dark/Light)** | `docs/6_guia_de_cores_tema.md` | Tabela exata de variáveis CSS (`--surface`, `--bg`, `--border`, `--sage`), cores de status e regras de contraste. |
| **Layout & Navegação** | `docs/1_layout_e_navegacao.md` | Sidebar, Header, responsividade e estrutura do layout base. |
| **Dashboard e Home** | `docs/2_home_dashboard.md` | Gráficos, KPI Cards, métricas de entrada. |
| **CRM e Funil** | `docs/1_layout_e_navegacao.md` / `docs/3_pacientes.md` | (Herda regras do design system de listagens). Container Surface, Cards em Bg. |
| **Gestão de Pacientes** | `docs/3_pacientes.md` | Tabelas, modo lista vs grid, formulários de prontuário, componentes de avatar. |
| **Agenda e Calendário** | `docs/4_agenda.md` | Calendário, eventos, bloqueio de horários. |
| **Formulários Dinâmicos** | `docs/5_instrumentos_e_acervo.md` | Construtor de formulários (`CustomFormBuilder`), motor de respostas. |
| **Mobile & PWA** | `docs/7_pwa_e_mobile.md` | Regras de manifest, service workers, modal do iOS e regras de instalação (A2HS). |

---

## 🏗️ Padrões Arquiteturais e Regras de Negócio

1. **Stack Tecnológico:**
   - **Frontend:** React (Vite), Tailwind CSS (Vanilla Classes), `react-router-dom`, `lucide-react`.
   - **Gerenciamento de Estado/Cache:** Não utilizamos Redux. O PWA usa `workbox` / `vite-plugin-pwa` para cache de requisições GET (`/api/patients`).

2. **Regras de UI/UX Críticas:**
   - **Tipografia de Leitura:** Textos curtos, labels e formulários devem usar `font-sans` (**Nunito Sans**).
   - **Bordas (Dark Mode):** NUNCA utilize `/opacity` (ex: `border-[var(--border)]/50`) no Dark Mode. Use a variável CSS sólida.
   - **Modais (Z-Index):** Modais complexos devem ser instanciados com `createPortal(..., document.body)` para fugir do *Stacking Context* e garantir o blur sobre a aplicação inteira.

3. **Governança de Código:**
   - **Commits:** Siga rigorosamente o Conventional Commits (ex: `feat(pwa): add install prompt`, `style(crm): fix card contrast`).
   - Sempre chame `lib/api.js` para comunicação HTTP; nunca embuta `fetch` puro dentro dos componentes visuais.
