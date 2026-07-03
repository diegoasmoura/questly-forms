# 4. Agenda

A seção de Agenda (`frontend/src/pages/Agenda.jsx` e `AppointmentDetailModal.jsx`) lida com todo o agendamento, controle de presença e gestão de horários.

---

## 4.1 Modais de Detalhe de Agendamento (`AppointmentDetailModal`)

O coração interativo da Agenda ocorre ao clicar em um evento no Calendário ou na Timeline da Home.

### Stacking Context e Backdrops (Fundo desfocado)
Para evitar que o fundo do modal "vaze" ou que sofra concorrência com o scroll/layout das páginas, o `AppointmentDetailModal` deve obrigatoriamente ser renderizado via `createPortal`:
```jsx
import { createPortal } from "react-dom";

return createPortal(
  <div className="fixed inset-0 bg-black/40 backdrop-blur-[3px] z-[60]">
    {/* Componente do Modal */}
  </div>,
  document.body
);
```
O *backdrop* deve sempre utilizar a sobreposição de `bg-black/40` somada ao desfoque estrito `backdrop-blur-[3px]`. Não alterar essa espessura para manter consistência visual com os demais modais flutuantes.

### Fontes (Tipografia do Modal)
Os Títulos (como o nome do Paciente no Modal) usam a mesma tipografia global da interface: `Nunito Sans` (classe `font-sans`).
A espessura de destaque costuma ser `font-bold` (peso 700). Evita-se carregar outras fontes (`Playfair`, `Caveat`) dentro desses modais puramente funcionais, exceto por razões extremas.

---

## 4.2 Status do Atendimento (Lógica de Cores)

Os status (chips/badges) têm cores engessadas na paleta da identidade:

- **Confirmado (Agendado):** Azul (`--blue` e `--blue-light`). Representa o estado basal do tempo.
- **Realizado (Presença):** Verde Sage (`--sage` e `--sage-light`). Representa algo concluído com sucesso e "saudável".
- **Falta:** Vermelho/Pêssego (`#EF4444` no botão interativo, `--peach` para chips nativos da marca). Alerta.
- **Justificada:** Roxo (`--purple` e `--purple-light`). Uma ação neutra, mas resolvida clinicamente.

### Botões de Ação Rápida (Status)
A escolha do status dentro do `AppointmentDetailModal` utiliza uma grade de botões com estilo "tranquilo" (sem sombras neon ou cores que agridem o usuário no Dark Mode).
No estado ativo, os botões ganham um preenchimento fosco (matte) correspondente à cor da ação e o texto fica em contraste. Evitar `box-shadow` na mesma cor do botão para não gerar efeitos "fluorescentes".

## 4.3 Regra de Negócio: Faltas e Justificativas (Histórico vs Disponibilidade)

Na gestão clínica, a integridade do histórico é vital:
- **Cancelar (Abonar):** Paciente avisou com antecedência. A sessão original vira "Justificada" (histórico mantido) e libera o slot no calendário para eventuais encaixes avulsos, mas o registro de cancelamento não deve ser deletado. A interface usa vermelho para o alerta de cancelamento, mas o status no sistema indica que não haverá cobrança de falta indevida.
- **Remarcar Sessão (Reagendar):** O mesmo que o anterior, porém o sistema cria uma nova Sessão Avulsa para a data escolhida. O botão no sub-modal segue a cor Âmbar para acompanhar a hierarquia visual do botão primário de "Justificado".

> Nunca ofereça opções na interface que permitam a deleção total de uma falta justificada sob o pretexto de "liberar a agenda". Slots justificados já são considerados implicitamente livres para encaixes. Deletar a justificativa apagaria o histórico clínico e reativaria a regra de recorrência do paciente.

## 4.3 Fechamento em Cascata
Sempre que uma ação é tomada no modal da agenda (ex: Justificar falta que abre um sub-modal), ao clicar em "Salvar", **toda a pilha de modais deve ser fechada simultaneamente**.
O usuário nunca deve ter que fechar manualmente os modais anteriores depois de concluir o fluxo de sucesso. O código deve executar o `onClose` na cadeia.
