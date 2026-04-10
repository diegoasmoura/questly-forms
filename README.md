# Curious Landing Page Clone

Réplica da seção superior do site [gettingcurious.com](https://www.gettingcurious.com/), recriada em HTML/CSS puro.

## Estrutura do Layout

```
┌─────────────────────────────────────────────────────────────┐
│                        NAV (90px)                           │
│  background: #FFFFFF                                        │
│  ┌─────────┐                    ┌──────────────────────┐    │
│  │  LOGO   │                    │ Solutions For  Pricing│    │
│  │  (SVG)  │                    │ Company  Support      │    │
│  │         │                    │ [Log In] [Get Started]│    │
│  └─────────                    └──────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    HERO SECTION                             │
│  background: #F6F5F4 (cinza claro)                          │
│                                                             │
│              Curious today.                                 │
│            Impact tomorrow.                                 │
│                                                             │
│     Evidence-based tools for scientific discovery           │
│         and better real-world outcomes.                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    IMAGE GALLERY                            │
│  background: #F6F5F4                                        │
│  height: 540px                                              │
│                                                             │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │   YELLOW     │    GREEN     │     PINK     │            │
│  │   PANEL      │    PANEL     │    PANEL     │            │
│  │              │              │              │            │
│  │  silhouettes │ silhouettes  │ silhouettes  │            │
│  └──────────────┴──────────────┴──────────────┘            │
│                                                             │
│  ┌───────────────────────────────────────────┐             │
│  │         GIF OVERLAY (white line)          │             │
│  │  positioned absolute, z-index: 2          │             │
│  │  left: 16%, width: 70%                    │             │
│  └───────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## Paleta de Cores

| Elemento | Cor | Hex |
|----------|-----|-----|
| Fundo Nav | Branco | `#FFFFFF` |
| Fundo Hero | Cinza claro | `#F6F5F4` |
| Fundo Gallery | Cinza claro | `#F6F5F4` |
| Texto principal | Preto | `#0B0907` |
| Botão Get Started | Preto | `#0B0907` |
| Botão Log In border | Preto | `#0B0907` |
| Links nav | Preto | `#0B0907` |
| Painel esquerdo | Amarelo | imagem com overlay |
| Painel central | Verde | imagem com overlay |
| Painel direito | Rosa | imagem com overlay |

## Tipografia

| Elemento | Fonte | Peso | Tamanho |
|----------|-------|------|---------|
| Logo | SVG customizado | - | 140x31px |
| H1 Hero | Affix Light / Inter | 400 | 100px |
| Subtítulo hero | Inter | 400 | 20px |
| Links nav | Inter | 400 | 14px |
| Botões nav | Inter | 400 | 14px |

## Imagens e Assets

- **Logo**: SVG inline extraído do site original
- **Painéis**: 3 imagens PNG com silhuetas sobre fundos coloridos
- **GIF**: Animação de linha branca sobreposta aos painéis
- **Fonte Hero**: Affix Light (Google Fonts fallback para Inter)
- **Fonte Corpo**: Inter (Google Fonts)

## URL das Imagens

| Asset | URL |
|-------|-----|
| Painel 1 (amarelo) | `https://framerusercontent.com/images/mC0Sc4vTdjcQqUVBVx1FhCQ.png` |
| Painel 2 (verde) | `https://framerusercontent.com/images/rwyV1jqnGKXOf7GSXDcYednbUwY.png` |
| Painel 3 (rosa) | `https://framerusercontent.com/images/OaQ3oQjxq0byEb1WtRvNY9MNPMk.png` |
| GIF (linha branca) | `https://framerusercontent.com/images/pnBNiqSTQAyb7J4zzu8XVt8Y.gif` |

## Como Visualizar

```bash
cd '/Users/diegoangelosantosdemoura/Desktop/Projetos Python/Formulários/surveyJS'
python3 -m http.server 8080
# Acesse http://localhost:8080
```

Ou simplesmente abra o arquivo `index.html` no navegador.

## Tecnologias

- HTML5 semântico
- CSS3 (Flexbox, posicionamento absoluto)
- Zero dependências JavaScript
- Google Fonts (Inter)
