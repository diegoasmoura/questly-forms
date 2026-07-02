# QF Design System
### Questly Forms — Human Crafted Digital

> Referência viva do sistema de design implementado no produto.  
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

### 2.5 Tons pastel (backgrounds de ícones e badges)

| Cor base | Tom pastel Light | Tom pastel Dark |
|---|---|---|
| Sage `#5CBF9D` | `#E4F5EE` | `#1A3028` |
| Azul `#2E7DFF` | `#E7F0FF` | `#152030` |
| Pêssego `#F8A26B` | `#FEEEE1` | `#2E2018` |
| Roxo `#7C5CFF` | `#F0ECFF` | `#1E1A30` |

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

## 4. Espaçamento e Dimensões

```
Grid base:          8px
Padding interno:    p-4 (16px) cards menores / p-5 (20px) cards maiores
Gap entre cards:    gap-3 (12px) KPIs / gap-4 (16px) cards maiores
Gap entre seções:   gap-5 (20px)
Border radius:
  - Cards:          rounded-[20px]  (20px)
  - Botões pill:    rounded-[999px]
  - Ícones:         rounded-[10px] a rounded-[12px]
  - Badges:         rounded-[999px]
  - Inputs:         rounded-[999px]
```

---

## 5. Sombras

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

---

## 7. Componentes Principais

### 7.1 KPI Card

```
Estrutura:  ícone (34×34px, rounded-[10px]) + label + valor (22px extrabold) + sub-texto
Border:     border-[var(--border)]
Hover:      hover:shadow-card-hover + hover:-translate-y-[1px]
```

**Distribuição de cores dos ícones (sem repetição adjacente):**

| Card | Cor do ícone | Hex |
|---|---|---|
| Sessões hoje | Azul | `#2E7DFF` |
| Presença no mês | Sage | `#5CBF9D` |
| Recebido no mês | Pêssego | `#F8A26B` |
| Sessões a cobrar | Roxo | `#7C5CFF` |
| Instrumentos | Verde escuro | `#3D786A` |

### 7.2 Timeline do dia

```
Estrutura:  hora (44px fixo) + dot colorido + linha vertical + avatar + nome + badge status
Status:
  presente    → dot #5CBF90,  bg sage-light,   text #3D786A
  falta       → dot #F8A268,  bg peach-light,  text #C97840
  justificada → dot #7C5CFF,  bg purple-light, text #7C5CFF
  confirmado  → dot #2E7DFF,  bg blue-light,   text #2E7DFF
```

### 7.3 Comparativo do Mês

```
Layout:   label (esquerda) | atual verde + "vs" + anterior pêssego + seta (direita)
Atual:    sempre #3D9E76 (verde)
Anterior: sempre var(--peach) = #F8A26B
Seta ↑:   #3D9E76 quando subiu (bom)
Seta ↓:   #D97706 quando caiu (ruim)
Seta —:   var(--text-muted) quando igual
```

> **Lógica de "ruim":** para Faltas, `isUp` é ruim (invertColor). Para demais métricas, `isDown` is ruim.

### 7.4 Toggle de Tema

```
Tamanho:   56×30px  pill
Dia:       track sage-light + bolinha sage #5CBF9D + ícone Sun
Noite:     track #1a2540 + bolinha #2B3D6B + ícone Moon
Hover:     border-[var(--sage)]
```

### 7.5 Botões de header (Sino + Avatar)

```
Tamanho:       38×38px
Border-radius: rounded-[10px]  (quadrado arredondado, não círculo)
Hover:         bg-surface-alt + border-sage + scale-[1.04]
Avatar:        gradiente linear sage→peach quando sem foto
Badge sino:    -top-[3px] -right-[3px], 7px, bg peach, border bg
```

### 7.6 Sidebar

```
Logo:       "QF" em Caveat Brush, gradiente sage→dark-green
Nav items:  ícone + label, hover bg-surface-alt
"Sair":     ancorado ao fundo (grid rows), vermelho no hover
```

---

## 8. Elementos Decorativos

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

## 9. Acessibilidade

| Regra | Valor |
|---|---|
| Contraste mínimo texto normal | 4.5:1 (WCAG AA) |
| `--text-muted` mínimo (light) | `#6B7280` → 4.7:1 |
| Área clicável mínima | 38×38px |
| Tooltips em botões de ação | obrigatório (`title=""`) |
| Alt text em imagens | obrigatório |
| Focus visible | `focus:ring-2 focus:ring-[#5CBF9D]` |

---

## 10. Tokens CSS (referência rápida)

```css
/* Superfícies */
var(--bg)           /* fundo da página */
var(--surface)      /* cards e painéis */
var(--surface-alt)  /* inputs, badges, alternativo */
var(--border)       /* bordas e divisores */

/* Texto */
var(--text-primary)    /* títulos, valores principais */
var(--text-secondary)  /* labels, conteúdo */
var(--text-muted)      /* sub-textos, placeholders */

/* Cores principais */
var(--sage)         /* #5CBF9D — ação primária */
var(--sage-light)   /* fundo pastel sage */
var(--dark-green)   /* #3D786A — verde profundo */
var(--blue)         /* #2E7DFF */
var(--blue-light)   /* fundo pastel azul */
var(--peach)        /* #F8A26B */
var(--peach-light)  /* fundo pastel pêssego */
var(--purple)       /* #7C5CFF */
var(--purple-light) /* fundo pastel roxo */
```

---

## 11. O que Nunca Fazer

| ❌ Errado | ✅ Correto |
|---|---|
| Usar `font-heading` (Playfair) em botões | `font-sans` em botões |
| Usar `font-handwritten` (Caveat) em títulos de card | `font-heading` em títulos |
| Dois cards adjacentes com a mesma cor de ícone | Distribuir as 5 cores da paleta |
| `--text-muted` abaixo de `#6B7280` no light | Mínimo `#6B7280` |
| Elementos decorativos sobre áreas funcionais | Decorativos em camada `z-0` fixa |
| Mostrar `-100%` quando não há histórico | Ocultar trend badge sem dados suficientes |
| Círculos (`rounded-full`) nos botões de ação do header | `rounded-[10px]` (quadrado arredondado) |
| Gradiente roxo→azul no avatar (frio) | Gradiente sage→pêssego (quente, botânico) |
