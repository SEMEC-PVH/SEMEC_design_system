/**
 * Registro dos exemplos visuais dos padrões de UI/UX (`/padroes/...`).
 *
 * Cada entrada: label (título do h2), desc (uma linha sobre o que a demo
 * mostra), filename (arquivo sugerido no snippet), prompt (prompt do botão
 * "Copiar prompt") e usage (código copiável).
 *
 * ATENÇÃO: este módulo e os quatro por categoria são dados puros — nada de
 * `"use client"` aqui. Um módulo marcado como client exporta referências de
 * cliente para o servidor, e o `CodeBlock` receberia um objeto no lugar da
 * string do snippet. As demos em si (componentes React com estado) ficam em
 * `patterns/<categoria>/<slug>.jsx`, marcadas com `"use client"`.
 */

import { navegacaoPatterns } from "./navegacao";
import { formulariosPatterns } from "./formularios";
import { feedbackPatterns } from "./feedback";
import { dadosPatterns } from "./dados";

export const patterns = {
  ...navegacaoPatterns,
  ...formulariosPatterns,
  ...feedbackPatterns,
  ...dadosPatterns,
};
