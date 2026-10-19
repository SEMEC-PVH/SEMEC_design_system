import Shape from "@/components/ui/Shape";
import Note from "@/components/ui/Note";

export const metadata = { title: "Raios, bordas e sombras" };

export default function RaiosSombrasPage() {
  return (
    <>
      <h1>Raios, bordas e sombras</h1>
      <p className="subtitle">
        Escala de raios e a família de sombras institucional.
      </p>

      <h3>Raios</h3>
      <div className="preview preview--plain">
        <div className="shape-grid shape-grid--row">
          <Shape caption="rounded-sm · 2px" style={{ borderRadius: "2px" }} />
          <Shape caption="rounded-md · 8px" style={{ borderRadius: "8px" }} />
          <Shape caption="rounded-lg · 12px" style={{ borderRadius: "12px" }} />
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
      <Note>
        Cards (ServiceCard) usam a família de sombra neutra da Uber{" "}
        <code>rgba(0,0,0,…)</code> (whisper-soft). Demais superfícies
        continuam na família <code>rgba(15,35,56,…)</code> (azul institucional
        escuro).
      </Note>
    </>
  );
}