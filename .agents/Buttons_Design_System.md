# Documentação UX e Técnica: Formato de Botões (Quadradinhos)

Este documento define o padrão visual para botões interativos e modais dentro do projeto Questly Forms, com base nas escolhas de UX consolidadas.

## A Regra dos "Quadradinhos" (Squircles)

A identidade visual do projeto **aboliu** os botões em formato de "pílula" (pill-shaped, `rounded-full` ou `rounded-[999px]`) para ações dentro de painéis e modais. 
O padrão adotado é o uso de **retângulos com cantos arredondados**, conhecidos como *quadradinhos* ou *squircles*.

Isso aproxima o design do estilo "Moleskine / Notion", mantendo uma linguagem mais editorial, limpa e moderna.

## Aplicações Técnicas

Sempre que for refatorar ou criar um novo botão ou card, utilize as seguintes proporções de border-radius do Tailwind:

1. **Botões de Ação (Salvar, Cancelar, Enviar):**
   - Utilizar `rounded-[12px]` ou `rounded-[14px]`.
   - Exemplo: `className="px-4 py-2.5 rounded-[12px] bg-[var(--sage)] text-white font-bold..."`

2. **Botões de Ícone Menores (Ex: Lixeira, Fechar, Editar):**
   - Utilizar proporção quadrada real (mesmo `width` e `height`) e cantos `rounded-[10px]` ou `rounded-[12px]`.
   - Exemplo: `className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center..."`

3. **Avatares (Fotos de Perfil):**
   - Avatares na interface (como no Timeline ou Dropdown) e pré-visualizações de imagens devem seguir a mesma lógica. Não são mais circulares (`rounded-full`).
   - Pequenos (Timeline): `w-[30px] h-[30px] rounded-[8px]`
   - Médios (Menu): `w-[40px] h-[40px] rounded-[10px]`
   - Grandes (Picker): `w-[84px] h-[84px] rounded-[18px]`

4. **Botões Globais (.btn)**
   - O uso de classes legadas como `.btn` (que forçam `rounded-[999px]`) deve ser evitado ou sobreposto manualmente com um novo `rounded-[Xpx]` quando utilizado dentro do contexto do Dashboard.

*Lembre-se: Mantenha sempre a consistência com a paleta suave e com a tipografia oficial (Nunito Sans para textos da UI).*
