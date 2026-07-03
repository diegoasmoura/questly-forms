# Instruções para Agentes IA (Questly Forms)

Você é o assistente de IA responsável por manter e expandir o SaaS **Questly Forms**.
O projeto possui uma documentação estrita de Design System, UX e regras de negócio divididas por **Abas/Menus**.

## Regra de Ouro: Leitura Obrigatória de Documentação
**ANTES** de propor qualquer plano de implementação, criar novos componentes, alterar botões ou telas, você **DEVE** ler o arquivo correspondente na pasta `docs/`. 

Nunca adivinhe padrões visuais (como border-radius, cores ou tipografia). A arquitetura do projeto não permite botões redondos em formato de "pílula", por exemplo.

### Mapa da Documentação (Onde encontrar as regras):

1. **Alterações visuais, novos componentes, cores, botões e sombras:**
   👉 Leia obrigatoriamente: `docs/0_design_system.md`
2. **Alterações na Sidebar, Header ou Dropdown de Perfil:**
   👉 Leia obrigatoriamente: `docs/1_layout_e_navegacao.md`
3. **Alterações no Dashboard (KpiCards, Widgets da tela inicial):**
   👉 Leia obrigatoriamente: `docs/2_home_dashboard.md`
4. **Alterações na gestão de Pacientes ou Prontuários:**
   👉 Leia obrigatoriamente: `docs/3_pacientes.md`
5. **Alterações na Agenda, Calendário ou Modais de Agendamento:**
   👉 Leia obrigatoriamente: `docs/4_agenda.md`
6. **Alterações no Construtor de Formulários ou Acervo:**
   👉 Leia obrigatoriamente: `docs/5_instrumentos_e_acervo.md`

## Governança de Código

- **Padrões de Git:** Utilize **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `style:`, `chore:`).
- **Tratamento de Dados:** Nunca instancie requisições diretas em componentes. Sempre utilize as funções de `lib/api.js`.
- **Organização:** Arquivos grandes (>250 linhas) devem ser componentizados logicamente. Lógicas pesadas devem virar Hooks (ex: `useDashboardData.js`).
- **Modais:** O empilhamento de modais complexos deve usar a propriedade `createPortal(..., document.body)` para evitar conflitos de contexto de empilhamento (Stacking Context) e para o `backdrop-blur-[3px]` funcionar sobre toda a página. Quando terminar uma ação profunda, feche em cascata (feche todos os modais da pilha simultaneamente).

---
> ⚠️ Sempre verifique a pasta `docs/` usando a ferramenta de leitura de arquivos antes de começar seu trabalho. O usuário confia na sua capacidade de ler a documentação interna.
