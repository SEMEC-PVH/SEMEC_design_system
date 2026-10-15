/**
 * Preset Tailwind CSS v4 da SEMEC (caminho JS via `@config`).
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
      colors: {
        background: "var(--bg)",
        foreground: "var(--fg)",
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
        muted: "var(--surface-alt)",
        "muted-foreground": "var(--text-muted)",
        // AUD-30: cor de TEXTO. `text-muted`/`text-secondary` são fundo.
        "text-muted": "var(--text-muted)",
        "text-secondary": "var(--text-secondary)",
        "text-strong": "var(--text-strong)",
        "text-on-brand": "var(--text-on-brand)",
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
        // @deprecated desde a 3.1.0, sai na 4.0 (AUD-55): cores de primitivo
        // (`bg-pv-*`, `text-pv-*`). Use o semântico do papel (`bg-primary`,
        // `bg-brand-hero`, `text-foreground`…). Primitivo novo não entra aqui.
        "pv-blue": {
          50: "var(--pv-blue-50)",
          600: "var(--pv-blue-600)",
          700: "var(--pv-blue-700)",
          800: "var(--pv-blue-800)",
          900: "var(--pv-blue-900)",
          hero: "var(--pv-blue-hero)",
        },
        "pv-green": {
          50: "var(--pv-green-50)",
          500: "var(--pv-green-500)",
          800: "var(--pv-green-800)",
        },
        "pv-yellow": {
          800: "var(--pv-yellow-800)",
        },
        "pv-red": {
          50: "var(--pv-red-50)",
          700: "var(--pv-red-700)",
        },
        "pv-gray": {
          50: "var(--pv-gray-50)",
          100: "var(--pv-gray-100)",
          200: "var(--pv-gray-200)",
          300: "var(--pv-gray-300)",
          400: "var(--pv-gray-400)",
          600: "var(--pv-gray-600)",
          700: "var(--pv-gray-700)",
          900: "var(--pv-gray-900)",
        },
        "pv-white": "var(--pv-white)",
        "pv-black": "var(--pv-black)",
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
    },
  },
} satisfies Config;
