import Swatch from "@/components/ui/Swatch";

export const metadata = { title: "Cores" };

const cores = [
  ["Azul institucional", "#223f99"],
  ["Verde limão", "#6CBE54"],
  ["Amarelo", "#fedc0b"],
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
        Cores institucionais da Prefeitura. Clique em um swatch para copiar o
        hex.
      </p>

      <h3>Paleta principal</h3>
      <div className="preview preview--plain">
        <div className="swatches swatches--row">
          {cores.map(([token, hex]) => (
            <Swatch key={token} token={token} hex={hex} />
          ))}
        </div>
      </div>
    </>
  );
}
