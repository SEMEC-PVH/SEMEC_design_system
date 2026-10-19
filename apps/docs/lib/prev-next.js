/**
 * Sequências de leitura para o par "anterior / próximo" no fim das páginas.
 *
 * Fonte de ordem e rótulos: `lib/navigation.js` (a mesma da sidebar) para o
 * Guia e para os Padrões, e o manifesto do kit para os Componentes. A seção
 * de Componentes é montada daqui — e não a partir dos itens da sidebar —
 * porque aqueles têm um primeiro item duplicado (`/componentes/header`
 * aparece como título "Estrutura de página" e como página), o que faria o
 * índice da sequência cair na ocorrência errada.
 *
 * Dados puros: sem "use client" — um módulo client exporta referências de
 * cliente para o servidor e quebraria quem lê os rótulos daqui.
 */

import { navigation } from "./navigation";
import { dsCategories, dsComponents, dsPortal } from "semec-ds/skills";

const itemsOf = (key) => {
  const section = navigation.find((i) => i.key === key);
  return section.items.map(({ href, label }) => ({ href, label }));
};

// O Guia já começa em /introducao (é o href da seção e o primeiro item).
const guia = itemsOf("guia");

const componentes = [
  { href: "/componentes", label: "Componentes" },
  ...dsPortal.items.map((p) => ({ href: p.href, label: p.label })),
  ...dsCategories.flatMap((cat) => [
    { href: `/componentes/${cat.slug}`, label: cat.label },
    ...dsComponents
      .filter((c) => c.category === cat.key)
      .map((c) => ({ href: `/componentes/${c.slug}`, label: c.label })),
  ]),
];

const padroes = [
  { href: "/padroes", label: "Padrões" },
  ...itemsOf("padroes"),
];

export const docSequences = { guia, componentes, padroes };

const stripTrailingSlash = (p) => (p.length > 1 ? p.replace(/\/+$/, "") : p);

/**
 * Localiza a rota dentro das sequências.
 * @returns {{ seq: Array<{href: string, label: string}>, index: number } | null}
 *          null quando a página não participa (home, institucionais).
 */
export function findSequence(pathname) {
  const current = stripTrailingSlash(pathname || "/");
  for (const seq of Object.values(docSequences)) {
    const index = seq.findIndex((item) => item.href === current);
    if (index !== -1) return { seq, index };
  }
  return null;
}
