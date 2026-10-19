import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** Degraus da escala de espaçamento por token (`p-space-N`, `gap-space-N`...). */
const SPACE_STEPS = [0, 1, 2, 3, 4, 6, 8, 12, 16] as const;

/**
 * tailwind-merge 3 configurado com os nomes do `@theme` de `tokens.css` que
 * fogem do padrão do Tailwind (AUD-44). Sem isso, `text-display` seria lido
 * como cor (e apagaria `text-primary`), e `p-space-2` não deduplicaria com
 * `p-4`. Cores por token (`text-text-muted`, `bg-surface-sunken`,
 * `ring-ring-inverse`...) já caem no grupo de cor sem configuração.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display"],
      spacing: SPACE_STEPS.map((n) => `space-${n}`),
      shadow: ["elevation-1", "elevation-2", "elevation-3"],
      ease: ["standard"],
      animate: ["in", "out", "accordion-down", "accordion-up", "collapsible-down", "collapsible-up"],
    },
    classGroups: {
      duration: [{ duration: ["fast", "base", "slow"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
