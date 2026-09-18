/**
 * Preset Tailwind CSS v4 da SEMEC (caminho JS via `@config`).
 *
 * Mapeia os tokens de `tokens.css` para utilitários. O caminho CSS-first
 * (`@theme inline`, dentro do próprio `tokens.css`) é o recomendado — este
 * preset existe para projetos que preferem config JS.
 *
 * Uso no `globals.css` do site novo:
 *   @import "tailwindcss";
 *   @config "../pv-preset.ts";
 *   @import "./tokens.css";
 *   @import "./shadcn.css";
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
        border: "var(--border)",
        input: "var(--border-strong)",
        ring: "var(--focus-ring)",
        muted: "var(--surface-alt)",
        "muted-foreground": "var(--text-muted)",
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
        "pv-blue": {
          50: "var(--pv-blue-50)",
          100: "var(--pv-blue-100)",
          600: "var(--pv-blue-600)",
          700: "var(--pv-blue-700)",
          800: "var(--pv-blue-800)",
          900: "var(--pv-blue-900)",
          950: "var(--pv-blue-950)",
          hero: "var(--pv-blue-hero)",
        },
        "pv-green": {
          50: "var(--pv-green-50)",
          500: "var(--pv-green-500)",
          800: "var(--pv-green-800)",
        },
        "pv-yellow": {
          400: "var(--pv-yellow-400)",
          500: "var(--pv-yellow-500)",
          800: "var(--pv-yellow-800)",
        },
        "pv-red": {
          50: "var(--pv-red-50)",
          400: "var(--pv-red-400)",
          500: "var(--pv-red-500)",
          600: "var(--pv-red-600)",
          700: "var(--pv-red-700)",
          800: "var(--pv-red-800)",
        },
        "pv-gray": {
          50: "var(--pv-gray-50)",
          100: "var(--pv-gray-100)",
          200: "var(--pv-gray-200)",
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
      spacing: {
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