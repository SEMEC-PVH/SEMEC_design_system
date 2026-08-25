import TypeRow from "@/components/ui/TypeRow";

export const metadata = { title: "Tipografia" };

export default function TipografiaPage() {
  return (
    <>
      <h1>Tipografia</h1>
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
      <div className="preview">
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
          <span style={{ fontSize: "0.875rem", color: "#475569" }}>
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
    </>
  );
}