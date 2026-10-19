/**
 * Preset JS da SEMEC (Tailwind v4 via `@config`; v3 sem suporte oficial).
 *
 * Mapeia os tokens de `tokens.css` para utilitários. O caminho CSS-first
 * (`@theme inline`, dentro do próprio `tokens.css`) é o recomendado — este
 * preset existe para projetos que preferem config JS.
 *
 * Os nomes de utilitário são os mesmos do caminho CSS-first:
 * `p-space-4`, `text-3xl` (32px), `text-display`, `font-regular`,
 * `text-text-muted`, `bg-surface-sunken` (AUD-27, AUD-28, AUD-30, AUD-53).
 *
 * Uso no `globals.css` do site novo:
 *   @import "tailwindcss";
 *   @import "@semec/ds/react/fonts.css";
 *   @import "@semec/ds/react/tokens.css";
 *   @source "../node_modules/@semec/ds/dist/react";
 *   @config "@semec/ds/react/pv-preset";
 */
import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      // INT-A-14: `muted`/`secondary` são só fundo (bg-muted, bg-secondary),
      // como no @theme; `text-muted`/`text-secondary` não são gerados.
      backgroundColor: {
        muted: "var(--surface-alt)",
        secondary: "var(--surface-alt)",
      },
      colors: {
        background: "var(--bg)",
        foreground: "var(--fg)",
        bg: "var(--bg)",
        fg: "var(--fg)",
        card: "var(--surface)",
        "card-foreground": "var(--fg)",
        popover: "var(--surface)",
        "popover-foreground": "var(--fg)",
        "secondary-foreground": "var(--fg)",
        accent: "var(--surface-alt)",
        "accent-foreground": "var(--fg)",
        sidebar: "var(--surface)",
        "sidebar-foreground": "var(--fg)",
        "sidebar-ring": "var(--focus-ring)",
        surface: "var(--surface)",
        "surface-alt": "var(--surface-alt)",
        "surface-sunken": "var(--surface-sunken)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        input: "var(--border-strong)",
        ring: {
          DEFAULT: "var(--focus-ring)",
          inverse: "var(--focus-ring-inverse)",
        },
        "muted-foreground": "var(--text-muted)",
        // AUD-30: cor de TEXTO. `text-muted`/`text-secondary` são fundo.
        "text-muted": "var(--text-muted)",
        "text-secondary": "var(--text-secondary)",
        "text-strong": "var(--text-strong)",
        "text-on-brand": "var(--text-on-brand)",
        "text-brand": "var(--text-brand)",
        primary: {
          DEFAULT: "var(--action-primary)",
          hover: "var(--action-primary-hover)",
          active: "var(--action-primary-active)",
          foreground: "var(--text-on-brand)",
        },
        destructive: {
          DEFAULT: "var(--feedback-danger)",
          foreground: "var(--text-on-brand)",
          surface: "var(--feedback-danger-surface)",
        },
        success: {
          DEFAULT: "var(--feedback-success)",
          surface: "var(--feedback-success-surface)",
          emphasis: {
            DEFAULT: "var(--feedback-success-emphasis)",
            foreground: "var(--text-on-success-emphasis)",
          },
        },
        warning: {
          DEFAULT: "var(--feedback-warning)",
          surface: "var(--feedback-warning-surface)",
        },
        info: {
          DEFAULT: "var(--feedback-info)",
          surface: "var(--feedback-info-surface)",
        },
        tint: "var(--tint)",
        "brand-hero": "var(--brand-hero)",
        // Sem cores de primitivo desde a 4.0 (AUD-55): não há `bg-pv-*`.
        // Use o semântico do papel; tabela em docs/migracao-4.0.md.
      },
      fontFamily: {
        sans: ["var(--font-family-sans)", "system-ui", "sans-serif"],
      },
      // AUD-28: tamanho + entrelinha por degrau (especificação-alvo).
      fontSize: {
        xs: ["var(--text-xs)", { lineHeight: "var(--leading-xs)" }],
        sm: ["var(--text-sm)", { lineHeight: "var(--leading-sm)" }],
        base: ["var(--text-base)", { lineHeight: "var(--leading-base)" }],
        lg: ["var(--text-lg)", { lineHeight: "var(--leading-lg)" }],
        xl: ["var(--text-xl)", { lineHeight: "var(--leading-xl)" }],
        "2xl": ["var(--text-2xl)", { lineHeight: "var(--leading-2xl)" }],
        "3xl": ["var(--text-3xl)", { lineHeight: "var(--leading-3xl)" }],
        display: ["var(--text-display)", { lineHeight: "var(--leading-display)" }],
      },
      lineHeight: {
        xs: "var(--leading-xs)",
        sm: "var(--leading-sm)",
        base: "var(--leading-base)",
        lg: "var(--leading-lg)",
        xl: "var(--leading-xl)",
        "2xl": "var(--leading-2xl)",
        "3xl": "var(--leading-3xl)",
        display: "var(--leading-display)",
      },
      // 400–700; não existem 800/900 no sistema.
      fontWeight: {
        regular: "var(--font-regular)",
        medium: "var(--font-medium)",
        semibold: "var(--font-semibold)",
        bold: "var(--font-bold)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        "elevation-1": "var(--elevation-1)",
        "elevation-2": "var(--elevation-2)",
        "elevation-3": "var(--elevation-3)",
      },
      // AUD-27 / CTR-C16: o dialeto do sistema é `p-space-N` (igual ao
      // caminho CSS-first). As chaves numéricas ficam por compatibilidade:
      // têm o mesmo valor do Tailwind (4px × N) nos degraus da escala.
      spacing: {
        "space-0": "var(--space-0)",
        "space-1": "var(--space-1)",
        "space-2": "var(--space-2)",
        "space-3": "var(--space-3)",
        "space-4": "var(--space-4)",
        "space-6": "var(--space-6)",
        "space-8": "var(--space-8)",
        "space-12": "var(--space-12)",
        "space-16": "var(--space-16)",
        0: "var(--space-0)",
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        6: "var(--space-6)",
        8: "var(--space-8)",
        12: "var(--space-12)",
        16: "var(--space-16)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)",
      },
      transitionTimingFunction: {
        standard: "var(--easing-standard)",
      },
      // Mesmos valores de --animate-* e @keyframes em tokens.css, com uma
      // diferença em enter/exit (RT1-R-01): na v3, -translate-x-1/2 vive em
      // `transform`, que o keyframe sobrescrevia, e o Dialog entrava fora do
      // centro. O keyframe devolve a translação do elemento pela propriedade
      // `translate` (var(--tw-translate-x/y)). Na v4, que já usa `translate`
      // com essas variáveis, o valor é o mesmo do elemento e nada muda. Os
      // modificadores @utility (fade/zoom/slide) continuam exigindo v4.
      animation: {
        in: "enter var(--tw-animation-duration, var(--tw-duration, 0.15s)) var(--tw-ease, ease) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none)",
        out: "exit var(--tw-animation-duration, var(--tw-duration, 0.15s)) var(--tw-ease, ease) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none)",
        "accordion-down": "accordion-down var(--tw-animation-duration, var(--tw-duration, 0.2s)) var(--tw-ease, ease-out) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none)",
        "accordion-up": "accordion-up var(--tw-animation-duration, var(--tw-duration, 0.2s)) var(--tw-ease, ease-out) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none)",
        "collapsible-down": "collapsible-down var(--tw-animation-duration, var(--tw-duration, 0.2s)) var(--tw-ease, ease-out) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none)",
        "collapsible-up": "collapsible-up var(--tw-animation-duration, var(--tw-duration, 0.2s)) var(--tw-ease, ease-out) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none)",
      },
      keyframes: {
        enter: {
          from: {
            opacity: "var(--tw-enter-opacity, 1)",
            translate: "var(--tw-translate-x, 0) var(--tw-translate-y, 0)",
            transform: "translate3d(var(--tw-enter-translate-x, 0), var(--tw-enter-translate-y, 0), 0) scale3d(var(--tw-enter-scale, 1), var(--tw-enter-scale, 1), var(--tw-enter-scale, 1)) rotate(var(--tw-enter-rotate, 0))",
          },
        },
        exit: {
          to: {
            opacity: "var(--tw-exit-opacity, 1)",
            translate: "var(--tw-translate-x, 0) var(--tw-translate-y, 0)",
            transform: "translate3d(var(--tw-exit-translate-x, 0), var(--tw-exit-translate-y, 0), 0) scale3d(var(--tw-exit-scale, 1), var(--tw-exit-scale, 1), var(--tw-exit-scale, 1)) rotate(var(--tw-exit-rotate, 0))",
          },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height, auto)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height, auto)" },
          to: { height: "0" },
        },
        "collapsible-down": {
          from: { height: "0" },
          to: { height: "var(--radix-collapsible-content-height, auto)" },
        },
        "collapsible-up": {
          from: { height: "var(--radix-collapsible-content-height, auto)" },
          to: { height: "0" },
        },
      },
    },
  },
} satisfies Config;
