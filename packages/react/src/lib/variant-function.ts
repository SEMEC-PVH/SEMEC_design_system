import type { cva } from "class-variance-authority";

/**
 * Assinatura pública das receitas CVA. Usa somente o entry público do CVA:
 * inferir a função diretamente vaza `class-variance-authority/types`, que
 * não resolve com TypeScript `moduleResolution: "node"` (INT-B1-09).
 * Preserva `null`, classes compostas e a exclusão entre `class`/`className`.
 */
export type VariantFunction<Variants = Record<never, never>> = (
  props?: { [Key in keyof Variants]?: Variants[Key] | null | undefined }
    & NonNullable<Parameters<ReturnType<typeof cva>>[0]>
) => string;
