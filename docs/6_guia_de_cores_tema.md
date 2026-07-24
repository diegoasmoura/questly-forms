# 🎨 Guia Completo de Cores e Temas (Modo Claro vs Modo Escuro) — Questly Forms

Este documento estabelece o mapeamento oficial de cores, variáveis CSS e regras de contraste visual para os temas **Modo Claro (Light Mode)** e **Modo Escuro (Dark Mode)** no SaaS **Questly Forms**.

---

## 1. Filosofia de Cores da Marca

A identidade visual do Questly Forms une **tecnologia** e **acolhimento humanizado**. A paleta evita tons frios ou puramente corporativos, priorizando cores orgânicas, calmas e acolhedoras com alto nível de contraste e legibilidade (WCAG AA).

---

## 2. Cores Institucionais e Marca

| Nome | Hex | Variável CSS | Conceito / Significado |
|---|---|---|---|
| **Verde Menta (Primária)** | `#5CBF90` | `var(--sage)` | Saúde, crescimento, equilíbrio |
| **Verde Escuro** | `#3D786A` | `var(--dark-green)` | Estabilidade, confiança, profissionalismo |
| **Azul Tecnológico** | `#2E7DFF` | `var(--blue)` | Tecnologia, ação, foco |
| **Pêssego / Laranja** | `#F8A26B` | `var(--peach)` | Acolhimento, proximidade, calor humano |
| **Roxo Criativo** | `#7C5CFF` | `var(--purple)` | Inovação, bem-estar, instrumentos clínicos |
| **Vermelho Alerta** | `#EF4444` | `#EF4444` | Faltas, exclusões, alertas e cancelamentos |

---

## 3. Mapeamento de Superfície e Estrutura (Modo Claro vs Modo Escuro)

| Elemento / Camada | Variável CSS | Modo Claro (Light) | Modo Escuro (Dark) | Aplicação |
|---|---|---|---|---|
| **Fundo da Aplicação** | `--bg` | `#FAF8F4` (Creme orgânico da marca) | `#101722` (Navy Profundo) | Tela principal, `body` |
| **Superfície Principal** | `--surface` | `#FFFFFF` (Branco reluzente destacando os cards) | `#192231` (Card Navy) | Cards, Modais, Containers |
| **Superfície Alternativa** | `--surface-alt` | `#F5F2EA` (Creme Linho / Colunas) | `#202B3C` (Navy Alternativo) | Quadros internos, Colunas Kanban, Inputs |
| **Bordas e Divisores** | `--border` | `#CBD2D9` (Cinza/Areia nítido) | `#2B3650` (Navy Grafite) | Molduras, linhas de tabela |

---

## 4. Tipografia e Contraste de Texto

| Papel | Variável CSS | Modo Claro | Modo Escuro | Ratio WCAG AA |
|---|---|---|---|---|
| **Texto Primário** | `--text-primary` | `#1F2937` | `#F6F7FB` | ✅ 14:1 (Legibilidade máxima) |
| **Texto Secundário** | `--text-secondary` | `#495057` | `#C3C9D0` | ✅ 8:1 (Descrições e labels) |
| **Texto Muted / Auxiliar** | `--text-muted` | `#6B7280` | `#A8B2C1` | ✅ 4.7:1 (Placeholders, metadados) |

> ⚠️ **Regra de Ouro:** Nunca utilize `--text-muted` em tons inferiores a `#6B7280` no Modo Claro para garantir conformidade técnica WCAG AA.

---

## 5. Cores Semânticas por Status de Atendimento

Cada estado da Agenda/Consultas possui uma dupla de cores (Fundo / Texto) calibrada dinamicamente para cada tema:

### 🟢 Presente (Realizado)
- **Modo Claro:** Fundo `var(--status-presente-bg)` (`#E4F5EE`) \| Texto `var(--status-presente-text)` (`#3D786A`)
- **Modo Escuro:** Fundo `var(--status-presente-bg)` (`#1A3028`) \| Texto `var(--status-presente-text)` (`#5CBF90`)

### 🔴 Falta (Ausência)
- **Modo Claro:** Fundo `var(--status-falta-bg)` (`#FEE2E2`) \| Texto `var(--status-falta-text)` (`#EF4444`)
- **Modo Escuro:** Fundo `var(--status-falta-bg)` (`rgba(239, 68, 68, 0.15)`) \| Texto `var(--status-falta-text)` (`#EF4444`)

### 🟣 Justificada (Abonada / Reagendada)
- **Modo Claro:** Fundo `var(--status-justificada-bg)` (`#F0ECFF`) \| Texto `var(--status-justificada-text)` (`#5B21B6`)
- **Modo Escuro:** Fundo `var(--status-justificada-bg)` (`#1E1A30`) \| Texto `var(--status-justificada-text)` (`#A78BFA`)

### 🔵 Confirmado (Agendado)
- **Modo Claro:** Fundo `var(--status-confirmado-bg)` (`#E7F0FF`) \| Texto `var(--status-confirmado-text)` (`#1D4ED8`)
- **Modo Escuro:** Fundo `var(--status-confirmado-bg)` (`#152030`) \| Texto `var(--status-confirmado-text)` (`#60A5FA`)

---

## 6. Chips e Botões de Ação Interativos (Estados Inativos)

Nos modais de atendimento e seleções rápidas, as opções inativas utilizam transparência fosca para evitar agredir a visão:

| Status | Modo Claro (Fundo / Texto) | Modo Escuro (Fundo / Texto) |
|---|---|---|
| **Presença (Inativo)** | `#E4F5EE` / `#2D6A57` | `rgba(92, 191, 157, 0.15)` / `#6EE7B7` |
| **Falta (Inativo)** | `#FEE2E2` / `#B91C1C` | `rgba(239, 68, 68, 0.15)` / `#FCA5A5` |
| **Justificado (Inativo)**| `#F0ECFF` / `#7C5CFF` | `rgba(124, 92, 255, 0.15)` / `#C084FC` |

---

## 7. Notas Clínicas Destacadas (Warning Notes)

| Propriedade | Variável CSS | Modo Claro | Modo Escuro |
|---|---|---|---|
| **Fundo da Nota** | `--note-bg` | `#FFF6DE` (Amarelo quente) | `#2A2210` (Âmbar noturno) |
| **Texto da Nota** | `--note-text` | `#7A5F1E` (Castanho escuro) | `#E8D49C` (Dourado suave) |

---

## 8. Bordas de Ação Dinâmicas

- `--btn-action-primary-border`: `rgba(46, 125, 255, 0.35)` (Light) \| `rgba(46, 125, 255, 0.60)` (Dark)
- `--btn-action-neutral-border`: `#CBD5E1` (Light) \| `#3D4F6A` (Dark)
- `--btn-action-danger-border`: `rgba(239, 68, 68, 0.35)` (Light) \| `rgba(239, 68, 68, 0.55)` (Dark)
