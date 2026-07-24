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

### Físicas do Modal (Mobile vs Web)
- **Top Alignment**: O modal deve estar ancorado ao topo (`items-start pt-[8vh]`) em vez de centralizado (`items-center`), garantindo que não pule ou mude o topo de lugar ao expandir formulários filhos (Progressive Disclosure).
- **Fixed Height**: Utilizar altura fixa (ex: `h-[70vh] md:h-[580px]`) em conjunto com rolagem interna oculta (`hide-scrollbar`) provida de uma **máscara de esmaecimento (fade-out bottom)** para indicar que há rolagem. Nunca sobrepor a navegação mobile (bottom nav).

### Fontes (Tipografia do Modal)
Os Títulos (como o nome do Paciente no Modal) usam a mesma tipografia global da interface: `Nunito Sans` (classe `font-sans`).
A espessura de destaque costuma ser `font-bold` (peso 700). Evita-se carregar outras fontes (`Playfair`, `Caveat`) dentro desses modais puramente funcionais, exceto por razões extremas.

---

## 4.2 Status do Atendimento (Lógica de Cores)

Os status (chips/badges/cards) têm cores engessadas na paleta da identidade:

- **Confirmado (Agendado):** Azul (`#2E7DFF`, `var(--status-confirmado-bg)` e `var(--status-confirmado-text)`). Representa o estado basal do tempo.
- **Realizado (Presença):** Verde Sage (`#5CBF90`, `var(--status-presente-bg)` e `var(--status-presente-text)`). Representa algo concluído com sucesso e "saudável".
- **Falta:** Vermelho (`#EF4444`, `var(--status-falta-bg)` e `var(--status-falta-text)`). Alerta e registro de ausência.
- **Justificada:** Roxo (`#7C5CFF`, `var(--status-justificada-bg)` e `var(--status-justificada-text)`). Uma ação neutra, mas resolvida clinicamente.

### Botões de Ação Rápida (Status)
A escolha do status dentro do `AppointmentDetailModal` utiliza uma grade de botões com estilo "tranquilo" (sem sombras neon ou cores que agridem o usuário no Dark Mode).
No estado ativo, os botões ganham um preenchimento fosco (matte) correspondente à cor da ação e o texto fica em contraste. Evitar `box-shadow` na mesma cor do botão para não gerar efeitos "fluorescentes".

## 4.3 Regra de Negócio: Faltas e Justificativas (Histórico vs Disponibilidade)

Na gestão clínica, a integridade do histórico é vital:
- **Cancelar (Abonar):** Paciente avisou com antecedência. A sessão original vira "Justificada" (histórico mantido) e libera o slot no calendário para eventuais encaixes avulsos, mas o registro de cancelamento não deve ser deletado. A interface usa vermelho para o alerta de cancelamento, mas o status no sistema indica que não haverá cobrança de falta indevida.
- **Remarcar Sessão (Reagendar):** O mesmo que o anterior, porém o sistema cria uma nova Sessão Avulsa para a data escolhida. O botão no sub-modal segue a hierarquia visual do botão primário de "Justificado".

### Reabertura e Carregamento de Atendimentos Persistidos
Ao reabrir um agendamento que já possui registro de atendimento gravado no banco de dados:
1. **Status Justificado:** O modal deve ser inicializado com o painel de justificativa aberto (`justModal.open = true`), pré-carregando o motivo da ausência (`notes`), o tipo de ação (`reagendar` ou `cancelar`) e as datas/horários reagendados (`rescheduledDate`, `rescheduledTime`).
2. **Status Falta / Presença:** O status botão e badge do cabeçalho refletem a cor exata do atendimento salvo (Vermelho para Falta, Verde Sage para Presença). As observações escritas são carregadas diretamente no editor de texto correspondente (`faltaNotes` ou `presenceNotes`).
3. **Rodapé Unificado:** O botão de ação secundária no rodapé do modal é padronizado como **"Fechar"** (que dispara a animação de saída `triggerClose`). O botão primário altera seu texto dinamicamente segundo a ação (*"Salvar Justificativa"*, *"Salvar Falta & Observação"* ou *"Salvar Evolução & Status"*).

**Edição de Justificativas e Garbage Collection (Upsert):**
Sempre que uma justificativa pré-existente for *editada* (ex: alterar a data do reagendamento ou mudar de "Remarcar" para "Cancelar"), o sistema deve obrigatoriamente realizar as seguintes ações para evitar poluição do banco (registros órfãos e duplicados):
1. **Limpeza de Filhos:** Identificar a justificativa original (`existingAtt.id`), buscar seus descendentes (a sessão avulsa criada no futuro) e **deletá-los** antes de salvar as novas alterações.
2. **Upsert da Mãe:** O ID original da justificativa deve ser passado na requisição (`id: existingAtt.id`) para que o backend realize um *Update* (Upsert) da justificativa raiz, em vez de criar uma nova marcação de falta para o mesmo dia.
3. **Criação do Novo Filho:** Só após os passos acima, a nova sessão reagendada deve ser criada e vinculada (usando `parentId`).

> Nunca ofereça opções na interface que permitam a deleção total de uma falta justificada sob o pretexto de "liberar a agenda". Slots justificados já são considerados implicitamente livres para encaixes. Deletar a justificativa apagaria o histórico clínico e reativaria a regra de recorrência do paciente.

## 4.4 Fechamento em Cascata
Sempre que uma ação é tomada no modal da agenda (ex: Justificar falta que abre um sub-modal), ao clicar em "Salvar", **toda a pilha de modais deve ser fechada simultaneamente**.
O usuário nunca deve ter que fechar manualmente os modais anteriores depois de concluir o fluxo de sucesso. O código deve executar o `onClose` na cadeia.

