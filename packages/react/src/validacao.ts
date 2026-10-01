/**
 * Entry de validação — única porta de entrada que depende de `zod`.
 *
 * ```ts
 * import { cpfSchema, validateCPF } from "@semec/ds/react/validacao";
 * ```
 *
 * O entry principal (`@semec/ds/react`) **não** importa zod.
 */
export * from "./lib/validators";
export * from "./lib/schemas";
