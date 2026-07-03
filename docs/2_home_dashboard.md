# 2. Home (Dashboard)

A `Home` (`frontend/src/pages/Home.jsx`) é o painel de entrada e boas-vindas do Questly Forms. Seu objetivo é ser esteticamente imponente, caloroso e oferecer um resumo semântico e rápido do dia do profissional.

---

## 2.1 O Cabeçalho (Greeting & Header)
O cabeçalho foi projetado para parecer uma capa de caderno (Moleskine).

- **Data de Hoje:** Fonte técnica e rígida (`font-extrabold uppercase tracking-[0.18em]`) em verde médio (`var(--sage)`).
- **Saudação ("Bom dia,"):** Usa a fonte cursiva fina `Caveat` (`font-handwritten`). Foi abolido o uso de `Playfair` ou `Nunito Sans` para o texto principal da saudação.
- **Nome do Usuário:** Segue na fonte cursiva `Caveat` (`font-handwritten`). Sob o nome, um vetor ondulado (`svg`) pintado de `var(--sage)` confere o aspecto humano/artesanal (desenhado à mão).
- **Resumo Diário (Descontinuado):** Houve a tentativa de colocar resumos textuais como bilhetes (post-its), mas foi descartada por UX. O cabeçalho deve focar estritamente na identidade visual, na saudação, e nos atalhos laterais (Tema, Notificação e Avatar).

---

## 2.2 KPI Cards (Indicadores Topo)
Os quadros numéricos ao topo da Dashboard (`KpiCard` dentro de `Shared.jsx`) têm uma regra estrita de UX.

### Estática vs Interação (Affordance)
- **NÃO possuem Hover:** Como esses cards não são clicáveis (eles apenas mostram dados como "Sessões hoje" ou "Presença no mês"), **foi removido qualquer efeito de flutuação** (`hover:-translate-y` ou `hover:shadow-card-hover`). 
- **Razão (UX):** Se um elemento reage ao mouse, o usuário espera que ele execute uma ação ao clique. Criar falsas expectativas de interatividade gera micro-frustrações.
- **Transição:** Eles usam apenas `transition-colors duration-300` para transitar suavemente entre o Dark/Light mode sem piscar o fundo.

---

## 2.3 Widgets

O restante do Dashboard é comporto por `Widgets`, dispostos em Grid flexível (`flex-col lg:flex-row`).

1. **AgendaWidget:**
   - Usa o componente `TimelineRow`.
   - Exibe os eventos cronologicamente. Ao clicar em um, chama a prop `onEventClick` que abre o `AppointmentDetailModal`.
2. **RevenueWidget:** 
   - Gráfico ou sumário financeiro mensal (cor Pêssego).
3. **InstrumentsWidget:** 
   - Exibe funil/taxa de resposta de formulários (cor Verde/Roxo). 
   - Os botões de ação interna (ex: "Ver todos") usam a regra dos *Squircles* (`rounded-[10px]`).
4. **PatientProfileWidget:**
   - Demografia dos pacientes ativos.
5. **BirthdaysWidget & QuickNotesWidget:**
   - Cartões de utilidade diária para o profissional.

---

## 2.4 Gestão de Estado e Atualizações Silenciosas (Flicker-Free)

O carregamento inicial da Dashboard bloqueia a renderização com uma tela de `LoadingScreen` (Carregando painel...).
No entanto, **é estritamente proibido** engatilhar essa tela de loading para ações secundárias ou mutações (ex: mudar o status de "Pendente" para "Presente" na agenda). 

### Regra Anti-Flicker (Anti-Piscada)
Sempre que um modal (ex: `AppointmentDetailModal`) precisar recarregar os dados da Dashboard após salvar algo no banco, ele deve invocar a prop `onUpdate` utilizando a flag de background:
`onUpdate={() => dashboardData.loadData(true)}`

O hook `useDashboardData(isBackground = false)` garantirá que a flag `loading` não seja acionada (`setLoading(true)`), permitindo que os dados sejam buscados silenciosamente via API e a interface atualize de forma instantânea e fluida, sem desmontar o fundo da tela.
