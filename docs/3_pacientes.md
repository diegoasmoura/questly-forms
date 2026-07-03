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
