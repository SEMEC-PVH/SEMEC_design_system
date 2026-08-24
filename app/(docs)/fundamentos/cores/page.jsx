import Card from "@/components/ui/Card";
import Swatch from "@/components/ui/Swatch";

export const metadata = { title: "Cores" };

const blue = [
  ["pv-blue-50", "#eef4fa"],
  ["pv-blue-100", "#dbe6f1"],
  ["pv-blue-200", "#bbcee2"],
  ["pv-blue-300", "#9bb5d3"],
  ["pv-blue-400", "#7a9dc4"],
  ["pv-blue-500", "#5a84b5"],
  ["pv-blue-600", "#3a6ca6"],
  ["pv-blue-700", "#2f5a8a"],
  ["pv-blue-800", "#26476f"],
  ["pv-blue-900", "#1e3a5f"],
  ["pv-blue-950", "#0f2238"],
];

const green = [
  ["pv-green-50", "#eef7e6"],
  ["pv-green-500", "#86c95b"],
  ["pv-green-600", "#70b643"],
  ["pv-green-700", "#5a9636"],
  ["pv-green-800", "#3a6420"],
];

const yellow = [
  ["pv-yellow-400", "#f6d56e"],
  ["pv-yellow-500", "#f2c94c"],
  ["pv-yellow-600", "#d9ad2e"],
];

const gray = [
  ["pv-gray-100", "#f5f5f5"],
  ["pv-gray-200", "#e5e7eb"],
  ["pv-gray-400", "#78849a"],
  ["pv-gray-500", "#6b7280"],
  ["pv-gray-600", "#4b5563"],
  ["pv-gray-700", "#374151"],
];

const sistema = [
  ["Herói / Footer", "#223f99"],
  ["Fundo página", "#f4f6f9"],
  ["Texto principal", "#14233a"],
  ["Superfície", "#ffffff"],
  ["--focus-ring", "#223f99"],
];

const Swatches = ({ tokens }) => (
  <div className="swatches">
    {tokens.map(([token, hex]) => (
      <Swatch key={token} token={token} hex={hex} />
    ))}
  </div>
);

export default function CoresPage() {
  return (
    <>
      <h1>Cores</h1>
      <p className="subtitle">
        Paletas institucionais e papéis semânticos. Clique em um swatch para
        copiar o hex.
      </p>

      <Card>
        <h3 id="cor-blue">pv-blue — Azul institucional (primário)</h3>
        <Swatches tokens={blue} />
      </Card>

      <Card>
        <h3 id="cor-green">pv-green — Verde ação (secundário)</h3>
        <Swatches tokens={green} />
      </Card>

      <Card>
        <h3 id="cor-yellow">pv-yellow — Amarelo destaque (acento)</h3>
        <Swatches tokens={yellow} />
      </Card>

      <Card>
        <h3 id="cor-gray">pv-gray — Cinza neutro</h3>
        <Swatches tokens={gray} />
      </Card>

      <Card>
        <h3 id="cor-sistema">Cores de sistema</h3>
        <Swatches tokens={sistema} />
      </Card>

      <Card>
        <h3 id="cor-semantica">Papéis semânticos</h3>
        <table>
          <tbody>
            <tr>
              <th>Papel</th>
              <th>Token / Cor</th>
            </tr>
            <tr>
              <td>Fundo de página</td>
              <td>
                <code>--background</code>{" "}
                <span style={{ color: "var(--pv-gray-500)" }}>(#f4f6f9)</span>
              </td>
            </tr>
            <tr>
              <td>Superfície (card)</td>
              <td>
                <code>bg-white</code>
              </td>
            </tr>
            <tr>
              <td>Texto primário</td>
              <td>
                <code>--foreground</code> / <code>text-pv-blue-900</code>
              </td>
            </tr>
            <tr>
              <td>Texto secundário</td>
              <td>
                <code>text-pv-gray-500</code> / <code>text-slate-600</code>
              </td>
            </tr>
            <tr>
              <td>Ação principal</td>
              <td>
                <code>bg-pv-blue-900</code> (hover <code>bg-pv-blue-800</code>)
              </td>
            </tr>
            <tr>
              <td>Ação de destaque</td>
              <td>
                <code>bg-pv-green-600</code> / <code>text-pv-green-700</code>
              </td>
            </tr>
            <tr>
              <td>Destaque/novidade</td>
              <td>
                <code>bg-pv-yellow-500</code> + <code>text-pv-blue-950</code>
              </td>
            </tr>
            <tr>
              <td>Erro/destrutivo</td>
              <td>
                não definido na home — usar <code>red-*</code> com moderação
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </>
  );
}