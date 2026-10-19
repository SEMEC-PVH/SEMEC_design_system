/**
 * Tipos dos dados de `manifest.js` expostos por `@semec/ds/skills` e
 * `@semec/ds/lite/skills`. O `manifest.js` é JavaScript puro; estes tipos
 * descrevem a forma que os artefatos e os helpers já usam, e o `tsc` confere
 * os dados contra eles (`tsconfig.skills.json`, com `allowJs`).
 */

/** Categoria do catálogo (Ações e links, Formulários, …). */
export interface DsCategory {
  key: string;
  slug: string;
  label: string;
  desc: string;
}

/** Variante/prop documentada de um componente. */
export interface DsComponentVariant {
  prop: string;
  values: string;
}

/** Entrada de componente do manifesto. */
export interface DsComponent {
  /** Nome no código (`input-otp`): subpath `@semec/ds/react/<code>`. */
  code: string;
  /** Slug da página em PT-BR (`/componentes/<slug>`). */
  slug: string;
  label: string;
  /** Caminho do fonte, relativo a `packages/react/`. */
  file: string;
  /** `key` de uma `DsCategory`. */
  category: string;
  desc: string;
  variants: DsComponentVariant[];
  /** Exemplo de uso (TSX). */
  usage: string;
  /** Export principal, quando não sai do `usage`. */
  exportName?: string;
}

/** Item da estrutura de página do portal. */
export interface DsPortalItem {
  slug: string;
  label: string;
  href: string;
  desc: string;
}

/** Estrutura de página do portal (casca: header, hero, footer, …). */
export interface DsPortal extends DsCategory {
  items: DsPortalItem[];
}
