# Inventário da Identidade Visual — SEMEC

> **Nota:** este documento é um levantamento do repositório `semec-digital` no estado de **20/08/2026**. É uma fotografia daquele momento e não acompanha a evolução do código do portal — números, arquivos e versões aqui registrados podem já não corresponder ao repositório atual.

Versão 1.0 — 20/08/2026
Fonte: repositório `semec-digital` (`D:\dev\semec-digital`), estado de 20/08/2026
Escopo: tudo que constitui identidade visual hoje — marca, cor, tipografia, espaço, forma, movimento, ícone e componente

> Este é o documento de **levantamento bruto**. Ele registra o que existe, não o que deveria existir. As decisões derivadas dele vivem nos documentos 01 (arquitetura), 02 (ADRs) e 05 (documentação do DS).

---

## 1. Marca

### 1.1 Assets disponíveis

Em `public/brand/`:

| Arquivo | Formato | Peso | Uso |
|---|---|---|---|
| `logo-semec.svg` | SVG | 12,5 KB | Marca principal da secretaria |
| `logo-semec-cropped.svg` | SVG | 12,5 KB | Variante recortada |
| `logo-semec-emblema.png` | PNG | 168 KB | Emblema isolado |
| `prefeitura_horizontal.png` | PNG | 241 KB | Marca da prefeitura, versão horizontal |
| `prefeitura_vertical_azul.png` | PNG | 42 KB | Marca da prefeitura, vertical, positiva |
| `prefeitura_vertical_branco.png` | PNG | 101 KB | Marca da prefeitura, vertical, negativa |
| `PortoVelhoPintura.svg` | SVG | 228 KB | Ilustração da cidade |
| `footer-banner.png` | PNG | 127 KB | Faixa do rodapé |
| `FooterpvhImg.png` | PNG | 23,7 KB | Elemento do rodapé |

### 1.2 Cores da marca

Extraídas de `logo-semec.svg`:

| Cor | Papel na logo |
|---|---|
| `#1f4493` | Azul da marca — cor dominante (35 ocorrências no arquivo) |
| `#fbdb04` | Amarelo da marca |
| `#6bbd55` | Verde da marca |

Extraídas de `PortoVelhoPintura.svg`:

| Cor | Ocorrências |
|---|---|
| `#5e92b8` | 130 |
| `#6d9cbd` | 67 |

### 1.3 Duplicação de assets

Os mesmos arquivos de marca existem em dois lugares:

- `public/brand/logo-semec.svg` e `src/servicos/imunidade-tributaria/assets/images/logo-semec.svg`
- `public/brand/PortoVelhoPintura.svg` e `src/servicos/imunidade-tributaria/assets/images/PortoVelhoPintura.svg`

Além disso, a marca da prefeitura foi reimplementada como componente React em **8 serviços diferentes** (`logo-prefeitura.tsx`), com **8 hashes distintos** — ou seja, oito versões divergentes. O mesmo vale para `ilustracao-cidade.tsx`, também em 8 cópias.

---

## 2. Cor

### 2.1 Paleta institucional declarada

Em `src/app/globals.css`, bloco `@theme inline`. É a única paleta formalizada do portal.

**Azul — primário institucional**

| Token | Hex |
|---|---|
| `pv-blue-950` | `#0f2238` |
| `pv-blue-900` | `#1e3a5f` |
| `pv-blue-800` | `#26476f` |
| `pv-blue-700` | `#2f5a8a` |
| `pv-blue-600` | `#3a6ca6` |
| `pv-blue-500` | `#5a84b5` |
| `pv-blue-400` | `#7a9dc4` |
| `pv-blue-300` | `#9bb5d3` |
| `pv-blue-200` | `#bbcee2` |
| `pv-blue-100` | `#dbe6f1` |
| `pv-blue-50` | `#eef4fa` |

Escala completa de 11 degraus. Os degraus 500–200 foram interpolados depois, com comentário explicando o motivo — sinal de que a escala foi construída sob demanda, não projetada.

**Verde — crescimento / ação**

| Token | Hex |
|---|---|
| `pv-green-700` | `#5a9636` |
| `pv-green-600` | `#70b643` |
| `pv-green-500` | `#86c95b` |
| `pv-green-50` | `#eef7e6` |

Escala incompleta: faltam 800, 400, 300, 200, 100.

**Amarelo — acento**

| Token | Hex |
|---|---|
| `pv-yellow-600` | `#d9ad2e` |
| `pv-yellow-500` | `#f2c94c` |
| `pv-yellow-400` | `#f6d56e` |

Escala incompleta: 3 degraus.

**Neutros institucionais**

| Token | Hex |
|---|---|
| `pv-gray-700` | `#374151` |
| `pv-gray-500` | `#6b7280` |
| `pv-gray-200` | `#e5e7eb` |
| `pv-gray-100` | `#f5f5f5` |

Os quatro valores são cinzas padrão do Tailwind, renomeados.

**Base do documento** (`:root`)

| Variável | Hex |
|---|---|
| `--background` | `#f4f6f9` |
| `--foreground` | `#14233a` |

### 2.2 Segunda paleta: tokens shadcn escopados

Em `src/servicos/calculadora-taxas/calculadora-taxas.css`, dentro de `.calc-root`. Sistema de cor independente, em HSL:

| Variável | Valor | Equivalente |
|---|---|---|
| `--primary` | `217 91% 45%` | ≈ `#0a5adb` |
| `--ring` | `217 91% 45%` | ≈ `#0a5adb` |
| `--destructive` | `0 84.2% 60.2%` | ≈ `#ef4444` |
| `--background` | `0 0% 100%` | `#ffffff` |
| `--foreground` | `20 14.3% 4.1%` | ≈ `#0c0a09` |
| `--border` / `--input` | `20 5.9% 90%` | ≈ `#e7e5e4` |
| `--radius` | `0.5rem` | — |

Mais nove gradientes nomeados (`--primary-gradient-start/end`, `--success-gradient-*`, `--pink-gradient-*`) e cinco cores de cartão de grupo em gradiente linear (`business`, `construction`, `health`, `environmental`, `events`).

O escopo em `.calc-root` foi deliberado e está documentado no próprio CSS. O efeito colateral é a existência de dois azuis primários na mesma aplicação.

### 2.3 Uso real

| Medida | Valor |
|---|---|
| Usos de classes `pv-*` | 762 |
| Usos de azuis genéricos do Tailwind (`blue-N00`) | 830 |
| Cores hexadecimais distintas escritas à mão | **176** |

### 2.4 Os quatro azuis em circulação

| Hex | Onde | Ocorrências | Caráter |
|---|---|---|---|
| `#1e3a5f` | `pv-blue-900`, token oficial | 210 em código | Azul naval dessaturado |
| `#223f99` | `TopBar` (fundo) e logotipo do `Header` | 14 em código | Azul royal vivo |
| `#1f4493` | `logo-semec.svg` | arquivo de marca | Azul royal vivo |
| `≈ #0a5adb` | `--primary` da Calculadora | escopado | Azul vivo saturado |

O ponto mais relevante do inventário: **o shell do portal já contradiz o próprio token**. A barra superior e o logotipo usam `#223f99` — praticamente o azul da logo — enquanto o sistema de tokens define `#1e3a5f`.

### 2.5 Cores institucionais escritas como hex

| Hex | Ocorrências | Token equivalente |
|---|---|---|
| `#1e3a5f` | 210 | `pv-blue-900` |
| `#70b643` | 68 | `pv-green-600` |
| `#26476f` | 29 | `pv-blue-800` |
| `#f2c94c` | 25 | `pv-yellow-500` |
| `#e5e7eb` | 20 | `pv-gray-200` |
| `#f5f5f5` | 19 | `pv-gray-100` |
| `#374151` | 16 | `pv-gray-700` |
| `#6b7280` | 15 | `pv-gray-500` |

Total: **402 ocorrências** de cores que já têm token. Aparecem em duas caixas (`#1e3a5f` e `#1E3A5F`), o que impede substituição por busca simples.

### 2.6 Cores fora de qualquer sistema

As mais frequentes, por origem provável:

*Escala Chakra/Tailwind antiga:* `#1a202c` (98), `#2d3748` (14), `#4a5568`, `#a0aec0`, `#718096`, `#e2e8f0`, `#f7fafc`
*Paleta Flat UI:* `#3498db` (18), `#2c3e50` (14), `#27ae60`, `#e67e22`, `#c0392b`, `#ecf0f1`, `#f39c12`
*Paleta Bootstrap Social / Dracula:* `#fd79a8` (20), `#d63031` (17), `#e17055`, `#0984e3`, `#00b894`, `#74b9ff`, `#fdcb6e`, `#ffeaa7`, `#00cec9`, `#e84393`, `#2d3436`, `#fab1a0`
*Verdes e turquesas soltos:* `#e6fffa` (20), `#f0fff4` (18), `#1a4731` (17), `#38a169`, `#48bb78`, `#4fd1c7`, `#38b2ac`, `#2d5016`, `#4caf50`, `#388e3c`
*Roxos:* `#9f7aea` (15), `#5a67d8`, `#667eea`, `#8b5cf6`, `#7c3aed`, `#6d28d9`, `#ddd6fe`, `#f3e8ff`
*Neutro atípico:* `#d6d6ce` (22), `#f5f5f3`, `#fdfdf9`, `#f9f9f7`

Nenhuma dessas cores tem papel declarado. São resíduo de código transportado de outras origens.

---

## 3. Tipografia

### 3.1 Famílias carregadas

| Família | Como é carregada | Pesos | Variável CSS |
|---|---|---|---|
| **Poppins** | `next/font/google` | 400, 500, 600, 700 | `--font-poppins` |
| **Archivo** | `next/font/google` | 500, 600, 700, 800 | `--font-archivo` |
| **Outfit** | `next/font/google` | padrão | `--font-outfit` |
| **Manrope** | `next/font/google` | padrão | `--font-manrope` |
| **Press Start 2P** | `@import` do Google Fonts em `globals.css` | única | `--font-press-start` |

Cinco famílias. Mapeamento em `@theme inline`:

```
--font-sans        → var(--font-poppins)
--font-display     → var(--font-poppins)
--font-heading     → var(--font-outfit)
--font-body        → var(--font-manrope)
--font-press-start → 'Press Start 2P', monospace
```

Poppins responde por texto e display. Outfit e Manrope servem exclusivamente à Calculadora de Taxas. Press Start 2P é decorativa (fonte pixelada de videogame). Archivo é carregada no layout mas não aparece mapeada no tema.

O `@import` de Press Start 2P na primeira linha do `globals.css` bloqueia a renderização — é a única fonte que não passa pelo otimizador do Next.

### 3.2 Escala de tamanho em uso

| Classe | Ocorrências |
|---|---|
| `text-sm` | 759 |
| `text-xs` | 311 |
| `text-lg` | 155 |
| `text-base` | 139 |
| `text-xl` | 137 |
| `text-2xl` | 108 |
| `text-3xl` | 84 |
| `text-4xl` | 33 |
| `text-5xl` | 8 |
| `text-6xl` | 7 |

Dez degraus. `text-sm` domina — o portal é predominantemente denso, não editorial. Há ainda tamanhos arbitrários pontuais (`text-[11px]`, `text-[10px]`, `text-[13px]`) nos chips e microtextos.

### 3.3 Pesos em uso

| Classe | Ocorrências |
|---|---|
| `font-bold` | 556 |
| `font-semibold` | 441 |
| `font-medium` | 206 |
| `font-black` | 97 |
| `font-normal` | 12 |
| `font-extrabold` | 7 |

Observação relevante: `font-bold` e `font-semibold` somam 997 usos contra 12 de `font-normal`. Praticamente todo texto do portal é destacado — o que anula o destaque. Além disso, `font-black` (900) e `font-extrabold` (800) são usados 104 vezes, mas Poppins só carrega até 700; esses pesos são sintetizados pelo navegador.

---

## 4. Espaçamento

Escala em uso (`p-`, `px-`, `py-`), por frequência:

| Degrau | Ocorrências | Equivalente |
|---|---|---|
| `4` | 401 | 1rem |
| `3` | 264 | 0,75rem |
| `6` | 260 | 1,5rem |
| `2` | 216 | 0,5rem |
| `8` | 136 | 2rem |
| `5` | 109 | 1,25rem |
| `1` | 52 | 0,25rem |
| `10` | 42 | 2,5rem |
| `2.5` | 41 | 0,625rem |
| `0.5` | 27 | 0,125rem |
| `12` | 24 | 3rem |
| `1.5` | 19 | 0,375rem |
| `16` | 18 | 4rem |

Gaps seguem o mesmo padrão: `gap-2` (196), `gap-3` (146), `gap-4` (140), `gap-6` (67).

Treze degraus em uso, incluindo meios-degraus. É a escala padrão do Tailwind usada sem restrição.

---

## 5. Forma (raio de borda)

| Classe | Ocorrências |
|---|---|
| `rounded-lg` | 303 |
| `rounded-full` | 175 |
| `rounded-xl` | 135 |
| `rounded-2xl` | 133 |
| `rounded-md` | 70 |
| `rounded-3xl` | 27 |
| `rounded-sm` | 5 |
| variações parciais (`rounded-t`, `rounded-r`, `rounded-tl`, `rounded-bl`) | 35 |

Oito valores distintos sem regra de aplicação. `globals.css` documenta explicitamente a decisão de **não** redeclarar `--radius-lg/md/sm`, para não quebrar os utilitários do Tailwind no restante do portal.

---

## 6. Elevação

| Classe | Ocorrências |
|---|---|
| `shadow-lg` | 113 |
| `shadow-sm` | 83 |
| `shadow-md` | 62 |
| `shadow-xl` | 57 |
| `shadow-2xl` | 37 |
| `shadow-inner` | 10 |
| `shadow-none` | 3 |

Mais sombras coloridas ad-hoc: `shadow-blue` (12), `shadow-emerald` (7), `shadow-orange` (3), `shadow-primary` (1), `shadow-pv` (1).

Cinco níveis de elevação em uso, sem hierarquia declarada.

---

## 7. Movimento

Animações definidas em `globals.css`:

| Nome | Duração | Curva | Uso |
|---|---|---|---|
| `pv-rise` | 0,6s | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrada de seções do herói |
| `chip-fade-in` | 0,4s | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrada de chips |
| `expand-smooth` | 0,5s | `cubic-bezier(0.16, 1, 0.3, 1)` | Expansão de containers |
| `slide-up` | 0,4s | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrada por baixo |

A curva `cubic-bezier(0.16, 1, 0.3, 1)` é consistente nas quatro — é, na prática, a curva de movimento da SEMEC, ainda que não declarada como token. Durações variam entre 0,4s e 0,6s.

Bibliotecas de animação instaladas: `gsap` + `@gsap/react`, `lottie-react`, `@dotlottie/react-player`, `tw-animate-css`.

Utilitários: `.scrollbar-hidden`, `.pv-rise`, `.chip-animate`, `.chips-container`, `.animation-slide-up`.

---

## 8. Iconografia

Biblioteca: **`lucide-react`** (v1.17), única em uso.

**80 ícones distintos** importados no portal. Os mais frequentes:

| Ícone | Usos | | Ícone | Usos |
|---|---|---|---|---|
| `X` | 14 | | `Home` | 5 |
| `Info` | 8 | | `ChevronRight` | 5 |
| `ChevronDown` | 8 | | `Calculator` | 5 |
| `Search` | 7 | | `ArrowRight` | 5 |
| `FileText` | 7 | | `User` | 4 |
| `Building2` | 7 | | `MessageCircle` | 4 |
| `MapPin` | 6 | | `HelpCircle` | 4 |
| `CheckCircle2` | 6 | | `Check`, `Bot`, `Activity` | 4 |

Ícones de domínio tributário já em uso: `Calculator`, `Ruler`, `HardHat`, `FileSignature`, `FilePenLine`, `ReceiptText`, `BadgePercent`, `Coins`, `KeyRound`, `ShieldCheck`, `Briefcase`.

Ícones proprietários: `InstagramIcon` e outros em `src/components/shell/icons.tsx`.

---

## 9. Componentes existentes

### 9.1 Shell (`src/components/shell/`)

| Componente | Função |
|---|---|
| `TopBar` | Barra superior institucional — fundo `#223f99`, links para Fala.BR, transparência e Instagram |
| `Header` | Cabeçalho — logo, divisor, nome do órgão, navegação, menu móvel |
| `Footer` | Rodapé |
| `CookieBanner` | Consentimento de cookies |
| `WhatsappButton` | Botão flutuante de contato |
| `VLibrasWidget` | Tradutor de Libras (acessibilidade) |
| `PageRating` | Avaliação da página pelo usuário |
| `icons.tsx` | Ícones proprietários |

### 9.2 Catálogo (`src/components/catalogo/`)

| Componente | Função |
|---|---|
| `ServiceCard` | Cartão de serviço, com modo `compact` |
| `CatalogoGrid` | Grade do catálogo |

### 9.3 UI genérica (`src/components/ui/`)

`Shuffle` (efeito tipográfico), `TermosDeUsoModal`.

### 9.4 UI duplicada nos serviços

Onze pastas `components/ui` espalhadas:

| Serviço | Arquivos |
|---|---|
| `calculadora-taxas` | 15 |
| `imunidade-tributaria` | 5 |
| `refis` | 5 |
| `declaracao-autonomo`, `eventos`, `formulario-padrao`, `iptu-impugnacao`, `itbi-imunidade`, `restituicao`, `simples-nacional` | 2 cada |

Componentes distintos identificados: `accordion`, `alert`, `badge`, `brasao-porto-velho`, `button`/`Button`, `card`, `checkbox`/`Checkbox`, `dialog`, `input`/`Input`, `label`, `radio-group`, `scroll-area`, `select`/`Select`, `sheet`, `textarea`/`Textarea`, `tooltip`, `activity-dropdown`, `FloatingDTEL`, `ScrollReveal`, `Shuffle`.

Duas convenções de nome convivem (`button.tsx` shadcn e `Button.tsx` artesanal) com APIs incompatíveis.

### 9.5 Padrões de qualidade já presentes

Extraídos do `ServiceCard` e do `Header`:

- Foco visível padronizado: `focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pv-green-500`
- Alvo de toque mínimo: `min-h-11` (44px)
- Estado desabilitado com `aria-disabled="true"`
- `lang="pt-BR"` no documento
- Widget de Libras e banner de cookies no shell

O portal já pratica acessibilidade — falta formalizar como regra.

---

## 10. Catálogo e taxonomia

`src/data/servicos.ts` — **48 serviços** catalogados, validados por Zod em tempo de build.

`src/data/categorias.ts` — 11 categorias, cada uma com ícone e "chip" de cor:

| Categoria | Ícone | Chip |
|---|---|---|
| Mais Acessados | `Star` | âmbar |
| IPTU | `Home` | `pv-blue` |
| ITBI | `KeyRound` | `pv-green` |
| ISS / Autônomo | `Briefcase` | âmbar |
| Taxas (TFFR/TRSD) | `ReceiptText` | `pv-blue` |
| Simples Nacional | `Building2` | `pv-green` |
| NFS-e / Reforma | `FileText` | âmbar |
| REFIS | `BadgePercent` | `pv-green` |
| CNAE / Risco | `ShieldCheck` | `pv-blue` |
| Retenção | `Coins` | âmbar |
| Outros | `LayoutGrid` | slate |

É o artefato mais bem estruturado do portal: tipado, com fallback e usando a paleta institucional. Serve de modelo para o resto.

---

## 11. Stack

| Camada | Versão |
|---|---|
| Next.js | 16.2.7 |
| React | 19.2.4 |
| Tailwind CSS | 4.x |
| TypeScript | 5.x |
| Radix UI | accordion, checkbox, dialog, label, radio-group, scroll-area, select, slot, tooltip |
| CVA + clsx + tailwind-merge | 0.7 / 2.1 / 3.6 |
| lucide-react | 1.17 |
| react-hook-form + zod | 7.78 / 4.4 |
| Vitest + Testing Library | 4.1 / 16.3 |
| PDF | pdfmake, @react-pdf/renderer, jspdf, react-pdf, html2pdf |
| Animação | gsap, lottie-react, tw-animate-css |
| Qualidade | ESLint 9, Prettier 3.9, Husky, commitlint, lint-staged |

---

## 12. Resumo quantitativo

| Dimensão | Estado |
|---|---|
| Cores hex distintas | 176 |
| Cores com token equivalente escritas como hex | 402 ocorrências |
| Azuis institucionais concorrentes | 4 |
| Famílias tipográficas | 5 |
| Degraus de tamanho de texto | 10 |
| Pesos de fonte | 6 (2 sintetizados) |
| Degraus de espaçamento | 13 |
| Raios de borda | 8 |
| Níveis de elevação | 5 + 5 coloridos |
| Curvas de animação | 1 (consistente) |
| Ícones distintos | 80 |
| Pastas `components/ui` | 11 |
| Cópias divergentes da logo da prefeitura | 8 |
| Serviços no catálogo | 48 |

---

*Levantamento automatizado sobre o estado do repositório em 20/08/2026. Os números mudam a cada commit; o padrão que revelam, não.*
