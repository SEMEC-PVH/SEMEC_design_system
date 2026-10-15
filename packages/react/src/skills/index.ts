/**
 * Skills entry point — re-exporta o manifesto e helpers para agentes IA.
 *
 * Artefatos estáticos (llms.txt, manifest.json, components/*.md, skills/semec-ds/)
 * são gerados para dist/skills/ pelo build-artifacts.mjs e acessíveis via
 * subpath exports do package.json.
 *
 * Os valores vêm do `manifest.js` (JavaScript puro); a anotação de tipo de cada
 * export é o que vai para o `.d.ts` publicado (`dist/skills/index.d.ts`).
 */

import * as manifest from "../../manifest.js";
import type { DsCategory, DsComponent, DsPortal } from "./types";

export type { DsCategory, DsComponent, DsComponentVariant, DsPortal, DsPortalItem } from "./types";

/** Categorias do catálogo. */
export const dsCategories: DsCategory[] = manifest.dsCategories;
/** Todos os componentes do kit, na ordem do catálogo. */
export const dsComponents: DsComponent[] = manifest.dsComponents;
/** Componentes indexados pelo `slug` da página. */
export const dsBySlug: Record<string, DsComponent> = manifest.dsBySlug;
/** Componentes de uma categoria (`DsCategory["key"]`). */
export const dsByCategory: (key: string) => DsComponent[] = manifest.dsByCategory;
/** Prompt curto para um agente usar o componente publicado. */
export const dsPrompt: (component: DsComponent) => string = manifest.dsPrompt;
/** Estrutura de página do portal. */
export const dsPortal: DsPortal = manifest.dsPortal;
