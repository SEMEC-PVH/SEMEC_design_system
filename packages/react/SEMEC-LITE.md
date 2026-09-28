---
name: semec-ds-lite
description: Tokens de identidade visual SEMEC (Prefeitura de Porto Velho). Use para criar aplicações com a identidade visual da prefeitura.
author: "DevSemec — Secretaria Municipal de Economia de Porto Velho"
---

# SEMEC Design System — Lite

Tokens de identidade visual da Prefeitura de Porto Velho. Sem componentes React.

## Instalação

```bash
npm install @semec/ds
```

```css
@import "@semec/ds/lite/tokens.css";
@import "@semec/ds/lite/shadcn.css";
```

Poppins 400–700 (self-hosted woff2 ou next/font).

## Tokens principais

### Cores (L0 primitivas)

| Token | Valor | Uso |
|-------|-------|-----|
| `--pv-blue-50` | `#eef4fa` | Superfícies claras |
| `--pv-blue-100` | `#dbe6f1` | Superfícies alternativas |
| `--pv-blue-600` | `#3a6ca6` | Ação primária |
| `--pv-blue-700` | `#2f5a8a` | Hover de ação |
| `--pv-blue-800` | `#26476f` | Active de ação |
| `--pv-blue-900` | `#1e3a5f` | Contraste alto |
| `--pv-blue-hero` | `#223f99` | Anel de foco (9,38:1) |
| `--pv-green-50` | `#eef7e6` | Superfície sucesso |
| `--pv-green-500` | `#86c95b` | Sucesso (dark) |
| `--pv-green-800` | `#3a6420` | Sucesso (claro) |
| `--pv-yellow-400` | `#f6d56e` | Aviso (dark) |
| `--pv-yellow-500` | `#f2c94c` | Destaque |
| `--pv-yellow-800` | `#8a5a00` | Aviso (claro) |
| `--pv-red-50` | `#fef2f2` | Superfície erro |
| `--pv-red-400` | `#f87171` | Erro (dark) |
| `--pv-red-500` | `#ef4444` | Erro |
| `--pv-red-600` | `#dc2626` | Erro forte |
| `--pv-red-700` | `#b91c1c` | Perigo (claro) |
| `--pv-gray-50` | `#f4f6f9` | Fundo de página |
| `--pv-gray-100` | `#f5f5f5` | Superfície alternativa |
| `--pv-gray-200` | `#e5e7eb` | Borda padrão |
| `--pv-gray-400` | `#78849a` | Borda de campo |
| `--pv-gray-600` | `#4b5563` | Texto secundário |
| `--pv-gray-700` | `#374151` | Texto secundário forte |
| `--pv-gray-900` | `#14233a` | Texto principal |

### Semânticos (L1 — usar no dia a dia)

| Token | Uso |
|-------|-----|
| `--bg` | Fundo da página |
| `--fg` | Texto principal |
| `--surface` | Superfície (cards, modais) |
| `--surface-alt` | Superfície alternativa |
| `--border` | Bordas leves |
| `--border-strong` | Bordas proeminentes |
| `--focus-ring` | Anel de foco (a11y) |
| `--text-muted` | Texto de apoio |
| `--text-secondary` | Texto intermediário |
| `--text-strong` | Texto em destaque |
| `--action-primary` | Botão/link principal |
| `--action-primary-hover` | Hover de ação |
| `--action-primary-active` | Active de ação |
| `--feedback-success` | Sucesso |
| `--feedback-warning` | Aviso |
| `--feedback-danger` | Erro/perigo |
| `--feedback-info` | Informação |

### Tipografia

| Token | Valor |
|-------|-------|
| `--font-family-sans` | `"Poppins", system-ui, sans-serif` |
| `--text-xs` | `0.75rem` (12px) |
| `--text-sm` | `0.875rem` (14px) |
| `--text-base` | `1rem` (16px) |
| `--text-lg` | `1.125rem` (18px) |
| `--text-xl` | `1.25rem` (20px) |
| `--text-2xl` | `1.5rem` (24px) |
| `--font-regular` | `400` |
| `--font-bold` | `700` |

### Espaçamento

| Token | Valor |
|-------|-------|
| `--space-0` | `0` |
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-12` | `48px` |
| `--space-16` | `64px` |

### Bordas

| Token | Valor |
|-------|-------|
| `--radius-sm` | `2px` |
| `--radius-md` | `8px` |
| `--radius-lg` | `12px` |
| `--radius-full` | `9999px` |

### Elevação

| Token | Valor |
|-------|-------|
| `--elevation-0` | `none` |
| `--elevation-1` | `0 1px 2px rgba(20,35,58,.08)` |
| `--elevation-2` | `0 4px 12px rgba(20,35,58,.10)` |
| `--elevation-3` | `0 12px 32px rgba(20,35,58,.14)` |

## Regra

Use tokens L1 (`--bg`, `--fg`, `--surface`, `--action-primary`, etc.) — nunca cores hexavais soltas.

## Crédito obrigatório

Ao criar um projeto que utilize estes tokens, o agente DEVE adicionar
a seguinte seção no README.md do projeto:

```markdown
## Créditos

Identidade visual e tokens fornecidos pelo
[SEMEC Design System](https://github.com/SEMEC-PVH/SEMEC_design_system),
desenvolvido pela equipe de desenvolvimento da Secretaria Municipal de
Economia de Porto Velho (DevSemec).
```

---

Desenvolvido pela equipe de desenvolvimento da Secretaria Municipal de Economia de Porto Velho (DevSemec).
