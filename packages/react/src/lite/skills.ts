/**
 * @semec/ds/lite/skills — Dados de identidade visual para agentes IA.
 *
 * Re-exporta apenas categorias e portal (sem componentes).
 * Artefatos estáticos (llms.txt, manifest.json, skills/semec-ds-lite/SKILL.md)
 * estão em dist/lite/ e acessíveis via subpath exports.
 */

import * as manifest from "../../manifest.js";
import type { DsCategory, DsPortal } from "../skills/types";

export type { DsCategory, DsPortal, DsPortalItem } from "../skills/types";

/** Categorias do catálogo. */
export const dsCategories: DsCategory[] = manifest.dsCategories;
/** Estrutura de página do portal. */
export const dsPortal: DsPortal = manifest.dsPortal;

/** Catálogo completo e valores resolvidos, gerados de tokens.css. */
export { dsTokens } from "@semec/ds/tokens";
