import Card from "@/components/ui/Card";

export const metadata = { title: "Acessibilidade" };

export default function AcessibilidadePage() {
  return (
    <>
      <h1>Acessibilidade</h1>
      <p className="subtitle">
        Requisitos mínimos das interfaces SEMEC.
      </p>

      <Card>
        <ul>
          <li>
            <strong>Foco visível:</strong>{" "}
            <code>focus-visible:ring-2 focus-visible:ring-pv-green-800</code>
          </li>
          <li>
            <strong>Labels:</strong> <code>aria-label</code> em botões de ícone,{" "}
            <code>aria-pressed</code> em toggles, <code>aria-expanded</code> em
            menus, <code>aria-disabled</code> em itens desabilitados
          </li>
          <li>
            <strong>Contraste:</strong> branco sobre <code>#223f99</code> e{" "}
            <code>pv-blue-900</code> (AA); selo amarelo usa{" "}
            <code>pv-blue-950</code> no texto
          </li>
          <li>
            <strong>Semântica:</strong> landmarks <code>nav</code>/
            <code>main</code>/<code>footer</code> corretos
          </li>
          <li>
            <strong>Reduced motion:</strong> animações decorativas respeitam a
            preferência do sistema
          </li>
        </ul>
      </Card>
    </>
  );
}