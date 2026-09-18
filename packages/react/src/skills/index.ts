/**
 * Skills entry point — re-exporta o manifesto e helpers para agentes IA.
 *
 * Artefatos estáticos (llms.txt, manifest.json, components/*.md, SKILL.md)
 * são copiados para dist/skills/ pelo build-skills.mjs e acessíveis via
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
