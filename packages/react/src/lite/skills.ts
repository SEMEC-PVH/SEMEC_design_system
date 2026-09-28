/**
 * @semec/ds/lite/skills — Dados de identidade visual para agentes IA.
 *
 * Re-exporta apenas categorias e portal (sem componentes).
 * Artefatos estáticos (llms.txt, manifest.json, ds-semec-skill.md)
 * estão em dist/lite/ e acessíveis via subpath exports.
 */

export { dsCategories, dsPortal } from "../../manifest.js";

export const dsTokens = {
  colors: [
    "--pv-blue-900",
    "--pv-blue-hero",
    "--pv-green-600",
    "--pv-green-500",
    "--pv-yellow-*",
    "--pv-red-*",
    "--pv-gray-*",
  ],
  semantic: [
    "--bg",
    "--fg",
    "--surface",
    "--surface-alt",
    "--border",
    "--border-strong",
    "--focus-ring",
    "--text-muted",
    "--text-secondary",
    "--text-strong",
    "--action-primary",
    "--action-primary-hover",
    "--action-primary-active",
    "--feedback-success",
    "--feedback-warning",
    "--feedback-danger",
    "--feedback-info",
  ],
  typography: [
    "--font-family-sans",
    "--font-poppins",
    "--font-mono",
    "--text-xs",
    "--text-sm",
    "--text-base",
    "--text-lg",
    "--text-xl",
    "--text-2xl",
    "--font-regular",
    "--font-bold",
  ],
  spacing: [
    "--space-0",
    "--space-1",
    "--space-2",
    "--space-3",
    "--space-4",
    "--space-6",
    "--space-8",
    "--space-12",
    "--space-16",
  ],
  radii: ["--radius-sm", "--radius-md", "--radius-lg", "--radius-full"],
  elevation: ["--elevation-0", "--elevation-1", "--elevation-2", "--elevation-3"],
};
