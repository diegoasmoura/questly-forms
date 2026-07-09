# 3. Pacientes

A tela de Pacientes (`frontend/src/pages/Patients.jsx`) gerencia a lista e o prontuário dos pacientes. Esta tela deve ser extremamente leve e focar na rápida recuperação de informações.

---

## 3.1 Lista e Tabela de Pacientes
- **Busca Global:** A busca deve filtrar nomes e telefones com `debounce` (atraso intencional) para evitar chamadas de API desnecessárias.
- **Avatares dos Pacientes:** Assim como no restante do sistema, a exibição da foto do paciente segue a regra dos "Squircles" (retângulos com cantos arredondados) com iniciais.
  - O utilitário universal `getAvatarProps(patientName)` em `Shared.jsx` é responsável por definir a cor (Sage, Azul, Pêssego ou Roxo) e o contraste baseando-se num hash estritamente derivado do nome do paciente. 
  - Dessa forma, o paciente "Diego Moura" terá a **mesma exata cor** e iniciais no Avatar independentemente da tela em que ele apareça (Lista de Pacientes, Agendamento ou Prontuário).

## 3.2 Ações da Tabela
- Os botões de ação ("Ver Prontuário", "Editar", "Excluir") devem seguir a regra dos *Squircles*, utilizando `rounded-[10px]` para ícones quadrados.
- O Hover dessas ações sempre deve destacar visualmente o botão, sem que ele ganhe sombra extrema para não poluir visualmente a tabela.

## 3.3 Modal de Edição/Criação
- Sempre envelopar modais complexos dentro de `createPortal(..., document.body)` para garantir que o `backdrop-blur-[3px]` cubra a sidebar da aplicação.
- A padronização dos botões (Salvar verde, Cancelar contornado) segue o estipulado em `0_design_system.md`.

## 3.4 Prontuário Responsivo (Mobile)
A tela de Prontuário do Paciente (`frontend/src/pages/PatientRecord.jsx`) possui adaptações de UX específicas para dispositivos móveis:
- **Cabeçalho Compacto:** No mobile, a sidebar lateral do perfil do paciente fica oculta e é substituída por um card compacto sanfonável (accordion) no topo da página. O botão "Ver Dados Completos" abre o modal de edição.
- **Navegação (Abas) com Ícones:** 
  - No celular, os botões das abas mostram **apenas os ícones** (tamanho `16px`) sem texto, com o atributo `title` para acessibilidade.
  - Os botões são distribuídos de ponta a ponta uniformemente (`flex-1`) ocupando 100% da largura da barra para facilitar o toque.
- **Filtro de Período Simplificado:**
  - O filtro exibe apenas "Este Mês" e "Personalizado" no celular, ocultando as opções secundárias.
  - Os botões ocupam a largura total de forma simétrica (`flex-1`). Caso a opção "Personalizado" seja selecionada, o seletor de mês/ano é empilhado em uma linha separada logo abaixo (`flex-col`).
- **Margem de Segurança do BottomNav:** A página do prontuário rola como um todo (`h-auto` no mobile) e possui um padding inferior (`pb-20`) para garantir que o final de qualquer aba apareça totalmente livre e acima da barra inferior de navegação (`BottomNav`).
- **Exibição em Cards:** Em telas pequenas, as tabelas de Financeiro e Instrumentos são automaticamente convertidas para listas de cards para uma visualização mobile nativa.
