# 1. Layout Base e Navegação

Este documento estabelece as regras e o funcionamento dos componentes estruturais fixos da aplicação: a `Sidebar` (Barra Lateral) e o `ProfileDropdown` (Menu do Usuário).

---

## 1. Sidebar (Barra Lateral Esquerda)

A `Sidebar` (`frontend/src/components/Sidebar.jsx`) é a âncora de navegação do usuário. Ela possui um estado colapsável (expandido/retraído) e suas regras visuais não devem ser alteradas sem revisão de UX.

### 1.1 Regras Visuais
- **Logo:** Usa a fonte `Caveat Brush` (classe `font-brand`), sempre alinhada e perfeitamente centrada quando a sidebar está recolhida. O fundo do logo é um gradiente quente botânico (`from-[#5CBF9D] to-[#3D786A]`).
- **Navegação (Links):**
  - Quando **Inativo:** `text-[var(--text-muted)] hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)]`.
  - Quando **Ativo:** Fundo verde claro `bg-[var(--sage-light)]` e ícone/texto em verde escuro `text-[var(--dark-green)]`.
- **Botão de Sair (Logout):** Fixado sempre na parte inferior da tela, distante das ações cotidianas. No *hover*, deve acender um vermelho de alerta leve (`hover:bg-red-50 hover:text-red-500`).

### 1.2 Zona Fixa de Ícones (`ICON_ZONE`)
Para evitar que os ícones "pulem" durante a animação de abertura e fechamento da sidebar, existe uma constante chamada `ICON_ZONE = "84px"`. Os ícones sempre ficam absolutamente centralizados dentro dessa zona, e apenas o texto adjacente surge por opacidade e translação.

---

## 2. Menu do Perfil (Avatar Dropdown)

Localizado no topo direito (`frontend/src/components/ProfileDropdown.jsx`).

### 2.1 Regras de UX
1. **Gatilho (Trigger):** O menu é acionado clicando no botão do avatar no topo direito. Ele **NUNCA** deve abrir modais destrutivos ou de fluxo primário diretamente.
2. **Posicionamento:** Deve flutuar abaixo do avatar, posicionado à direita (`right-0`), com `z-index` altíssimo (ex: `z-[50]`).
3. **Escalabilidade:** Sempre que for adicionar novas configurações ao sistema (ex: Integração com Google Agenda), posicione-as dentro deste dropdown em seu grupo lógico correspondente. **Mantenha a Sidebar limpa apenas para ações diárias.**

### 2.2 Agrupamentos Lógicos
O dropdown é estritamente dividido por linhas sutis (`border-b border-[var(--border)]`):

1. **Cabeçalho:** Identificação visual (Foto, Nome, E-mail). Não clicável.
2. **Ações Pessoais:** Meu Perfil (Abre o modal de edição de foto/nome usando "squircles").
3. **Gestão da Clínica:** Configurações da Clínica e Preferências de Agenda.
4. **Conta:** Assinatura/Faturamento e Central de Ajuda.
5. **Saída:** Logout (com texto/ícone em vermelho).

### 2.3 Estilo Notion/Moleskine
- **Bordas:** Arredondadas macias (`rounded-[20px]`).
- **Sombras:** Flutuantes (`shadow-card-hover`).
- **Tipografia Interna:** Fonte padrão sem serifa (`font-sans`), com `font-semibold` para as ações. Não usar fontes manuscritas pesadas no menu interno, priorizando a leitura técnica rápida.
