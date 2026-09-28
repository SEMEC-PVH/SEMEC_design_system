import TypeRow from "@/components/ui/TypeRow";
import Swatch from "@/components/ui/Swatch";
import Shape from "@/components/ui/Shape";
import DemoCard from "@/components/demos/DemoCard";
import Card from "@/components/ui/Card";

export const metadata = { title: "Fundamentos" };

const nucleo = [
  ["Azul institucional", "#223f99"],
  ["Verde limão", "#6CBE54"],
  ["Amarelo", "#fedc0b"],
];

export default function FundamentosPage() {
  return (
    <>
      <h1>Fundamentos</h1>
      <p className="subtitle">
        Bases visuais que sustentam todas as interfaces — tipografia, cores,
        layout e acabamentos.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* Tipografia                                                         */}
      {/* ------------------------------------------------------------------ */}
      <h2 id="tipografia">Tipografia</h2>
      <p className="subtitle">
        Famílias, pesos e a escala renderizada do design system.
      </p>

      <h3>Famílias</h3>
      <table>
        <tbody>
          <tr>
            <th>Família</th>
            <th>Token</th>
            <th>Uso</th>
          </tr>
          <tr>
            <td>
              <strong>Poppins</strong>
            </td>
            <td>
              <code>--font-poppins</code>
            </td>
            <td>Corpo, títulos, labels, links, botões.</td>
          </tr>
        </tbody>
      </table>

      <h3>Escala renderizada</h3>
      <div className="preview preview--plain">
        <TypeRow label="Título herói">
          <span style={{ fontSize: "2.25rem", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            A Secretaria está mais perto
          </span>
        </TypeRow>
        <TypeRow label="Título seção">
          <span style={{ fontSize: "1.125rem", fontWeight: 700 }}>IPTU</span>
        </TypeRow>
        <TypeRow label="Título card">
          <span style={{ fontSize: "1.125rem", fontWeight: 700, lineHeight: 1.3 }}>
            Restituição de IPTU
          </span>
        </TypeRow>
        <TypeRow label="Subtítulo">
          <span style={{ fontSize: "1.125rem" }}>
            Formulários, informações e guias da SEMEC.
          </span>
        </TypeRow>
        <TypeRow label="Corpo">
          <span className="demo-hint">
            Solicite a restituição de valores pagos a maior.
          </span>
        </TypeRow>
        <TypeRow label="Navegação">
          <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
            Sobre a SEMEC
          </span>
        </TypeRow>
        <TypeRow label="Eyebrow">
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "var(--pv-yellow-600)",
            }}
          >
            Portal de Serviços
          </span>
        </TypeRow>
        <TypeRow label="Etiqueta">
          <span
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              background: "var(--pv-blue-50)",
              color: "var(--pv-blue-700)",
              padding: "0.15rem 0.5rem",
              borderRadius: "0.3rem",
            }}
          >
            Requerimento
          </span>
        </TypeRow>
        <TypeRow label="Selo">
          <span
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              textTransform: "uppercase",
              background: "var(--pv-yellow-500)",
              color: "var(--pv-blue-950)",
              padding: "0.15rem 0.6rem",
              borderRadius: "9999px",
            }}
          >
            Novo
          </span>
        </TypeRow>
        <TypeRow label="Microtexto">
          <span style={{ fontSize: "0.75rem", color: "var(--pv-gray-500)" }}>
            © 2026 SEMEC
          </span>
        </TypeRow>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Cores                                                              */}
      {/* ------------------------------------------------------------------ */}
      <h2 id="cores">Cores</h2>
      <p className="subtitle">
        Cores institucionais da Prefeitura. Clique em um swatch para copiar o
        hex.
      </p>

      <h3>Paleta principal</h3>
      <div className="preview preview--plain">
        <div className="swatches swatches--row">
          {nucleo.map(([token, hex]) => (
            <Swatch key={token} token={token} hex={hex} />
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Layout                                                             */}
      {/* ------------------------------------------------------------------ */}
      <h2 id="layout">Layout</h2>
      <p className="subtitle">
        Container, grid e regras de espaçamento da página.
      </p>

      <Card>
        <h3>Container &amp; Grid</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--pv-gray-500)", marginBottom: "0.75rem" }}>
          Container de produto <code>var(--container-max)</code> (1200px) ·
          coluna do guia <code>var(--container-docs)</code> (48rem) · medida
          de leitura <code>var(--measure)</code> (72ch) para texto corrido ·
          padding lateral <code>24px</code> (16px em telas &lt;640px) ·
          centralizado <code>mx-auto</code>. Grid de cards:{" "}
          <code>grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3</code>.
        </p>
        <p className="note">
          O limite de <code>1200px</code> vale para as páginas de serviço. O
          guia de documentação usa a coluna mais estreita de{" "}
          <code>48rem</code> — leitura confortável de manuais não pede o mesmo
          teto de um portal — e limita o texto corrido a <code>72ch</code>.
        </p>
        <div className="demo-cards">
          <DemoCard
            tag="IPTU"
            title="Card exemplo"
            description="1 coluna no mobile, 2 em sm, 3 em lg."
          />
          <DemoCard
            tag="ITBI"
            green
            title="Card exemplo"
            description="Gap uniforme de 1.25rem (gap-5)."
          />
          <DemoCard
            tag="Taxas"
            title="Card exemplo"
            description="Espaço interno de card: p-6."
          />
        </div>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Raios, bordas e sombras                                             */}
      {/* ------------------------------------------------------------------ */}
      <h2 id="raios-bordas-sombras">Raios, bordas e sombras</h2>
      <p className="subtitle">
        Escala de raios e a família de sombras institucional.
      </p>

      <h3>Raios</h3>
      <div className="preview preview--plain">
        <div className="shape-grid shape-grid--row">
          <Shape caption="rounded-sm · 0.25rem" style={{ borderRadius: "0.25rem" }} />
          <Shape caption="rounded-md · 0.375rem" style={{ borderRadius: "0.375rem" }} />
          <Shape caption="rounded-lg · 0.5rem" style={{ borderRadius: "0.5rem" }} />
          <Shape caption="rounded-xl · 0.75rem" style={{ borderRadius: "0.75rem" }} />
          <Shape caption="rounded-2xl · 1rem" style={{ borderRadius: "1rem" }} />
          <Shape caption="rounded-full" style={{ borderRadius: "9999px" }} />
        </div>
      </div>

      <h3>Sombras</h3>
      <div className="preview preview--plain">
        <div className="shape-grid shape-grid--row">
          <Shape
            caption="Card repouso"
            className="shadow-card-rest"
          />
          <Shape
            caption="Card hover"
            className="shadow-card-hover"
          />
          <Shape
            caption="Elevado"
            className="shadow-elevated"
          />
        </div>
      </div>
      <p className="note">
        Cards (ServiceCard) usam a família de sombra neutra da Uber{" "}
        <code>rgba(0,0,0,…)</code> (whisper-soft). Demais superfícies
        continuam na família <code>rgba(15,35,56,…)</code> (azul institucional
        escuro).
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* Animações                                                           */}
      {/* ------------------------------------------------------------------ */}
      <h2 id="animacoes">Animações</h2>
      <p className="subtitle">
        Easing padrão e regras de movimento.
      </p>

      <p style={{ fontSize: "0.85rem", color: "var(--pv-gray-500)", marginBottom: "0.75rem" }}>
        Easing padrão <code>cubic-bezier(0.16, 1, 0.3, 1)</code> (expo-out), no
        token <code>--easing-standard</code>; durações em{" "}
        <code>--duration-fast/base/slow</code>. Passe o mouse nos cards abaixo.
      </p>
      <div className="preview">
        <div className="anim-demo">
          <div className="tile">Hover de card</div>
          <div className="tile">Chip fade</div>
          <div className="tile">Rise (herói)</div>
          <div className="tile">Slide up</div>
        </div>
      </div>
      <p className="note">
        Respeite <code>prefers-reduced-motion</code>. Não crie animações novas
        sem usar o mesmo easing.
      </p>
    </>
  );
}
