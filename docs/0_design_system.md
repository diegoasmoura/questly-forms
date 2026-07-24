# 0. Global & Design System
### Questly Forms — Human Crafted Digital

> Referência viva do sistema de design global implementado no produto.  
> Última atualização: Julho 2026.

---

## 1. Filosofia

O QF deve transmitir **acolhimento, calma, clareza e tecnologia premium**.  
A interface deve parecer cuidadosamente desenhada por pessoas — não gerada automaticamente.

**Nunca deve parecer:** ERP hospitalar, sistema governamental, dashboard genérico.  
**Deve parecer:** caderno Moleskine + produto como Notion ou Linear.

> **Regra de ouro:** O usuário deve sentir que entrou em um ambiente acolhedor e bonito, nunca em um sistema administrativo.

---

## 2. Paleta de Cores

### 2.1 Cores Principais

| Nome | Hex | Variável CSS | Uso |
|---|---|---|---|
| Sage | `#5CBF9D` | `var(--sage)` | Ação primária, presença, saúde |
| Verde escuro | `#3D786A` | `var(--dark-green)` | Textos em destaque, headings verdes |
| Azul | `#2E7DFF` | `var(--blue)` | Agenda, tempo, informação |
| Pêssego | `#F8A26B` | `var(--peach)` | Financeiro, alertas suaves, calor |
| Roxo | `#7C5CFF` | `var(--purple)` | Instrumentos clínicos, destaque secundário |

### 2.2 Cores de Superfície — Modo Claro

| Variável | Hex | Uso |
|---|---|---|
| `--bg` | `#FAF8F4` | Fundo principal (quente, orgânico) |
| `--surface` | `#FFFFFF` | Cards, modais, painéis |
| `--surface-alt` | `#F5F4EF` | Fundo alternativo, inputs, badges |
| `--border` | `#E8ECEF` | Bordas, divisores |

### 2.3 Cores de Superfície — Modo Escuro

| Variável | Hex | Uso |
|---|---|---|
| `--bg` | `#101722` | Fundo principal (navy profundo) |
| `--surface` | `#192231` | Cards, modais |
| `--surface-alt` | `#202B3C` | Fundo alternativo |
| `--border` | `#2B3650` | Bordas |

### 2.4 Cores de Texto

| Variável | Light | Dark | Contraste AA |
|---|---|---|---|
| `--text-primary` | `#1F2937` | `#F6F7FB` | ✅ 14:1 |
| `--text-secondary` | `#495057` | `#C3C9D0` | ✅ 8:1 |
| `--text-muted` | `#6B7280` | `#A8B2C1` | ✅ 4.7:1 |

> ⚠️ **Acessibilidade:** Nunca usar `--text-muted` abaixo de `#6B7280` no modo claro. O valor mínimo WCAG AA é 4.5:1.

---

## 3. Tipografia

### 3.1 Famílias de fonte

| Família | Fonte | Uso | Classe Tailwind |
|---|---|---|---|
| **Heading** | Playfair Display | Títulos de cards, saudações, h1–h4 | `font-heading` |
| **Interface** | Nunito Sans | Todo texto de interface, botões, labels | `font-sans` (padrão) |
| **Destaque** | Caveat | Apenas palavras únicas de destaque (ex: nome do usuário) | `font-handwritten` |
| **Marca** | Caveat Brush | Exclusivo para o monograma/logo QF | `font-brand` |

### 3.2 Escala tipográfica

```
Saudação principal:  30–32px  font-heading  font-normal
Títulos de card:     18–20px  font-heading  font-bold
Destaque manuscrito: 34–36px  font-handwritten  (apenas em palavras isoladas)
Corpo / labels:      13–14px  font-sans
Sublabels / muted:   11–12px  font-sans
Micro labels:        9–10px   font-sans  uppercase  tracking-wider
```

### 3.3 Regras de uso
- ✅ `font-heading` — títulos de seção, saudação
- ✅ `font-handwritten` — nome do usuário na saudação, palavra única de acolhimento
- ✅ `font-brand` — logo "QF" na sidebar, identidade de marca
- ❌ Nunca usar `font-handwritten` em headings de card
- ❌ Nunca usar `font-brand` fora do logo

---

## 4. A Regra dos "Quadradinhos" (Squircles) e Botões

A identidade visual do projeto **aboliu** os botões em formato de "pílula" (pill-shaped, `rounded-full` ou `rounded-[999px]`) para ações dentro de painéis e modais. 
O padrão adotado é o uso de **retângulos com cantos arredondados**, conhecidos como *quadradinhos* ou *squircles*.

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

5. **Botões de Múltipla Escolha (Status / Justificativas):**
   - A identidade dita um comportamento **Tonal/Outline** adaptativo para opções expansíveis e estados de atendimento.
   - **Estado Desmarcado (Inativo):** Fundo suave. O ícone fica flutuando num círculo com fundo pastel, puxando a variável de background correspondente (ex: `var(--status-falta-bg)` ou sua versão `rgba(239, 68, 68, 0.15)` correspondente ao HEX bruto). A borda do botão é `2px solid transparent`.
   - **Estado Selecionado (Ativo):** O botão recebe destaque (Outline) e ganha uma borda `2px solid` na **cor forte original** (ex: `#5CBF9D`, `#EF4444`, `#7C5CFF`).
   - **Padronização Global de Rodapé de Modais:** A ação secundária do rodapé em modais interativos é rigorosamente intitulada **"Cancelar"** (em vez de "Fechar" ou "Voltar"), utilizando as dimensões e classe padronizadas `px-4 py-2.5 bg-[var(--surface-alt)] text-[var(--text-secondary)] hover:bg-[var(--border)] hover:text-[var(--text-primary)] rounded-[12px] text-xs font-bold`. A ação primária de confirmação utiliza `px-5 py-2.5 bg-[var(--sage)] hover:bg-[var(--dark-green)] text-white rounded-[12px] text-xs font-bold shadow-sm flex items-center justify-center gap-2` (*"Cadastrar"*, *"Salvar Justificativa"*, *"Salvar Falta & Observação"*, *"Salvar Evolução & Status"*).

### 4.6 Componentes de Edição de Texto (`RichTextEditor`)
Os campos de escrita de notas clínicas, ausências e justificativas seguem o padrão padronizado do componente `RichTextEditor`:
- **Estética & Moldura:** Cantos arredondados `rounded-[16px]` com fundo de superfície `bg-[var(--surface-alt)]` e foco em Verde Menta (`focus-within:ring-2 focus-within:ring-[var(--sage)]`).
- **Barra de Ferramentas Minimalista:** Apenas botões de formatação direta (*Negrito*, *Itálico*, *Título H2*, *Lista de Tópicos* e *Citação*). É terminantemente proibida a inclusão de ícones genéricos de atualização ou reset (como `RotateCcw`) na barra de ferramentas.
- **Rolagem Interna Automática (`minHeight` / `maxHeight`):** O editor deve conter propriedade de altura dinâmica com `overflow-y-auto` interno, gerando barra de rolagem quando o texto atinge o limite máximo estipulado (ex: `maxHeight="220px"`), impedindo a expansão desalinhada de modais ou containers pais.

---

## 5. Espaçamento, Dimensões e Sombras

```
Grid base:          8px
Padding interno:    p-4 (16px) cards menores / p-5 (20px) cards maiores
Gap entre cards:    gap-3 (12px) KPIs / gap-4 (16px) cards maiores
Gap entre seções:   gap-5 (20px)
```

```css
card:       0 8px 24px rgba(30,31,34,0.06)
card-hover: 0 8px 30px rgba(30,31,34,0.10)
```
Aplicar sombra apenas em cards elevados, nunca em elements inline.

---

## 6. Animações e Transições

```
Duração padrão:     150–200ms
Duração modais:     300ms
Easing:             ease-out
Hover translate:    hover:-translate-y-[1px]
Fade-in (páginas):  0.3s ease-out (opacity 0→1, translateY 10px→0)
Slide-in (sidebar): 0.3s ease-out (opacity 0→1, translateX -10px→0)
```

### 6.1 Regras para Modais no Mobile (Padrão de Centralização Útil)

Para obter harmonia visual perfeita em dispositivos móveis, a posição de todos os modais/cards deve ser **rigorosamente centralizada no espaço útil** (o intervalo vertical compreendido entre o topo da tela e a linha superior da Bottom Navigation Bar):

- **Fórmula de Centralização em Flexbox & Z-Index:**
  No container backdrop fixo (`fixed inset-0 z-[100]`), utiliza-se alinhamento centralizado com padding inferior dinâmico reservado para a BottomNav (que opera em `z-40`), garantindo que o backdrop desfocado cubra integralmente a navegação inferior:
  `className="fixed inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center p-4 pb-[calc(65px+env(safe-area-inset-bottom,0px)+16px)] sm:pb-4 z-[100]"`
- **Vantagem Geométrica:**
  Dessa forma, a distância entre o topo do celular e o card fica **exatamente igual** à distância entre a base do card e o topo da barra de navegação móvel.
- **Limite de Altura Interna (`max-h`):**
  Para evitar extrapolar a janela útil, limita-se a altura máxima a:
  `max-h-[calc(100vh-65px-env(safe-area-inset-bottom,0px)-48px)] sm:max-h-[85vh]`

```jsx
// Template Padronizado para Novos Modais (Copy & Paste):
import { createPortal } from "react-dom";

return createPortal(
  <div
    className={`fixed inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center p-4 pb-[calc(65px+env(safe-area-inset-bottom,0px)+16px)] sm:pb-4 z-[100] transition-opacity duration-300 ${
      isClosing ? 'opacity-0' : 'opacity-100'
    }`}
    onClick={triggerClose}
  >
    <div
      className={`relative bg-[var(--surface)] w-full max-w-lg rounded-[24px] shadow-2xl flex flex-col border border-[var(--border)] overflow-hidden transition-all duration-300 ease-out max-h-[calc(100vh-65px-env(safe-area-inset-bottom,0px)-48px)] sm:max-h-[85vh] ${
        isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
      onClick={e => e.stopPropagation()}
    >
      {/* Cabeçalho, Conteúdo e Rodapé */}
    </div>
  </div>,
  document.body
);
```

- **Scroll Mask (Efeito Fade-out)**: Em vez de exibir barras de rolagem nativas dentro de modais, o design prevê um **esmaecimento na base** do modal (`bg-gradient-to-t from-[var(--surface)] to-transparent pointer-events-none`).
- **Transição de Saída (Exit Animations)**: Modais **nunca devem fechar abruptamente**. Ações de fechamento disparam um estado `isClosing` (função `triggerClose`), aplicando transição de opacidade e escala por 200ms antes do desmonte.

---

## 7. Elementos Decorativos

Renderizados em uma camada `z-0` fixa, **atrás de todo o conteúdo funcional**.  
Nunca devem competir com texto ou elementos interativos.

**Tipos disponíveis em `DecorativeElements.jsx`:**
- `LeafDetailed` — folha botânica com nervuras
- `BotanicalSprig` — galho com 3 folhinhas
- `WatercolorBlob` — mancha aquarelada com blur
- `OrganicCircle` — círculo traçado à mão
- `InkDots` — pontos irregulares de tinta
- `HandBrushStroke` — pincelada multicamada

**Regra:** elementos decorativos nunca dentro de cards funcionais, formulários ou áreas clicáveis.

---

## 8. Acessibilidade

| Regra | Valor |
|---|---|
| Contraste mínimo texto normal | 4.5:1 (WCAG AA) |
| `--text-muted` mínimo (light) | `#6B7280` → 4.7:1 |
| Área clicável mínima | 38×38px |
| Tooltips em botões de ação | obrigatório (`title=""`) |
| Alt text em imagens | obrigatório |
| Focus visible | `focus:ring-2 focus:ring-[#5CBF9D]` |
| Gráficos Recharts | Remover tap-highlight e outline nos wrappers e no `activeDot` |

---

## 9. O que Nunca Fazer

| ❌ Errado | ✅ Correto |
|---|---|
| Usar `font-heading` (Playfair) em botões | `font-sans` em botões |
| Usar `font-handwritten` (Caveat) em títulos de card | `font-heading` em títulos |
| Dois cards adjacentes com a mesma cor de ícone | Distribuir as 5 cores da paleta |
| `--text-muted` abaixo de `#6B7280` no light | Mínimo `#6B7280` |
| Elementos decorativos sobre áreas funcionais | Decorativos em camada `z-0` fixa |
| Círculos (`rounded-full`) nos avatares e botões | `rounded-[12px]` ou `rounded-[18px]` (squircles) |
| Gradiente roxo→azul no avatar (frio) | Gradiente sage→pêssego (quente, botânico) |
