# Documentação UX e Técnica: Menu do Perfil (Avatar Dropdown)

Este documento foi criado para referência futura dos agentes, garantindo a consistência na manutenção do menu do avatar (canto superior direito da Home).

## Regras de UX & Design System

1. **Gatilho (Trigger):** O menu é acionado clicando no botão do avatar no topo direito. Ele NUNCA deve abrir modais destrutivos ou de fluxo primário diretamente.
2. **Posicionamento:** Deve flutuar abaixo do avatar, posicionado à direita (`right-0`), com `z-index` altíssimo (ex: `z-50`).
3. **Estilo Moleskine/Notion (Design System):**
   - **Bordas:** Arredondadas (ex: `rounded-[20px]`).
   - **Sombras:** Suaves (`shadow-card`).
   - **Fundo:** `var(--surface)`.
   - **Tipografia:** O cabeçalho usa nome e e-mail simples. Não há fontes manuscritas pesadas no menu interno, priorizando a legibilidade rápida (`font-sans`).
   - **Divisores:** Linhas finas `var(--border)` para separar grupos lógicos de configuração.
4. **Grupos Lógicos Atuais:**
   - **Cabeçalho:** Identificação visual.
   - **Ações Pessoais:** Meu Perfil (abre o modal de edição de foto/nome).
   - **Gestão da Clínica:** Configurações (Gerais e Agenda).
   - **Conta:** Assinatura/Faturamento e Suporte.
   - **Saída:** Logout (com cor de destaque/vermelho discreto no hover).

## Estrutura Técnica

O componente `ProfileDropdown` (`frontend/src/components/ProfileDropdown.jsx`) recebe como props:
- `user`: Os dados do usuário logado (para exibir nome/email).
- `onClose`: Função para fechar o menu ao clicar fora ou executar uma ação.
- `onEditProfile`: Função que aciona a exibição do `AvatarPickerModal` na tela pai.
- `onLogout`: Função para deslogar do sistema.

## Atualizações
*Sempre que adicionar novas funcionalidades de configuração ao sistema (ex: Integração com Google Agenda), elas devem ser posicionadas dentro deste dropdown no grupo lógico adequado, evitando superlotar a barra lateral principal (Sidebar).*
