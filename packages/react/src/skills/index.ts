/**
 * Skills entry point — re-exporta o manifesto e helpers para agentes IA.
 *
 * Artefatos estáticos (llms.txt, manifest.json, components/*.md, skills/semec-ds/)
 * são gerados para dist/skills/ pelo build-artifacts.mjs e acessíveis via
 * subpath exports do package.json.
 */

export {
  dsCategories,
  dsComponents,
  dsBySlug,
  dsByCategory,
  dsPrompt,
  dsPortal,
} from "../../manifest.js";
