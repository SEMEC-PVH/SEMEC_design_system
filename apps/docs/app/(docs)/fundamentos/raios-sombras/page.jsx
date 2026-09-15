import Shape from "@/components/ui/Shape";

export const metadata = { title: "Raios, bordas e sombras" };

export default function RaiosSombrasPage() {
  return (
    <>
      <h1>Raios, bordas e sombras</h1>
      <p className="subtitle">
        Escala de raios e a família de sombras institucional.
      </p>

      <h3>Raios</h3>
      <div className="preview">
        <div className="shape-grid">
          <Shape caption="rounded-sm · 0.25rem" style={{ borderRadius: "0.25rem" }} />
          <Shape caption="rounded-md · 0.375rem" style={{ borderRadius: "0.375rem" }} />
          <Shape caption="rounded-lg · 0.5rem" style={{ borderRadius: "0.5rem" }} />
          <Shape caption="rounded-xl · 0.75rem" style={{ borderRadius: "0.75rem" }} />
          <Shape caption="rounded-2xl · 1rem" style={{ borderRadius: "1rem" }} />
          <Shape caption="rounded-full" style={{ borderRadius: "9999px" }} />
        </div>
      </div>

      <h3>Sombras</h3>
      <div className="preview">
        <div className="shape-grid">
          <Shape
            caption="Card repouso"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.12)", border: "none" }}
          />
          <Shape
            caption="Card hover"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.16)", border: "none" }}
          />
          <Shape
            caption="Elevado"
            style={{ boxShadow: "0 10px 30px -10px rgba(15,35,56,0.15)", border: "none" }}
          />
        </div>
      </div>
      <p className="note">
        Cards (ServiceCard) usam a família de sombra neutra da Uber{" "}
        <code>rgba(0,0,0,…)</code> (whisper-soft). Demais superfícies
        continuam na família <code>rgba(15,35,56,…)</code> (azul institucional
        escuro).
      </p>
    </>
  );
}