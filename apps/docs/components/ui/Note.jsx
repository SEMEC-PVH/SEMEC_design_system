/**
 * Callout de nota informativa — substitui a classe `.note` simples.
 *
 * Renderiza uma caixa com ícone Info, cantos simétricos, borda sutil e
 * fundo leve em tom azul institucional. Adequado para notas editoriais em
 * páginas de fundamentos, padrões e qualquer documentação.
 *
 * Props:
 * - children: ReactNode — conteúdo da nota (aceita JSX)
 * - className: string (opcional) — classes adicionais no wrapper
 */
import { Info } from "lucide-react";

export default function Note({ children, className = "" }) {
  return (
    <aside
      className={`note-callout${className ? ` ${className}` : ""}`}
      aria-label="Nota"
    >
      <Info className="note-callout__icon" aria-hidden="true" />
      <p className="note-callout__text">{children}</p>
    </aside>
  );
}
