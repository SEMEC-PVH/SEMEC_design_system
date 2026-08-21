import Card from "@/components/ui/Card";
import Shape from "@/components/ui/Shape";

export const metadata = { title: "Raios, bordas e sombras" };

export default function RaiosSombrasPage() {
  return (
    <>
      <h1>Raios, bordas e sombras</h1>
      <p className="subtitle">
        Escala de raios e a família de sombras institucional.
      </p>

      <Card>
        <h3>Raios</h3>
        <div className="shape-grid">
          <Shape caption="rounded-sm · 0.25rem" style={{ borderRadius: "0.25rem" }} />
          <Shape caption="rounded-md · 0.375rem" style={{ borderRadius: "0.375rem" }} />
          <Shape caption="rounded-lg · 0.5rem" style={{ borderRadius: "0.5rem" }} />
          <Shape caption="rounded-xl · 0.75rem" style={{ borderRadius: "0.75rem" }} />
          <Shape caption="rounded-2xl · 1rem" style={{ borderRadius: "1rem" }} />
          <Shape caption="rounded-full" style={{ borderRadius: "9999px" }} />
        </div>
      </Card>

      <Card>
        <h3>Sombras</h3>
        <div className="shape-grid">
          <Shape
            caption="Card repouso"
            style={{ boxShadow: "0 1px 3px rgba(15,35,56,0.04)", border: "none" }}
          />
          <Shape
            caption="Card hover"
            style={{ boxShadow: "0 14px 34px -12px rgba(15,35,56,0.22)", border: "none" }}
          />
          <Shape
            caption="Elevado"
            style={{ boxShadow: "0 10px 30px -10px rgba(15,35,56,0.15)", border: "none" }}
          />
        </div>
        <p className="note">
          Regra: sombras usam sempre a família{" "}
          <code>rgba(15,35,56,…)</code> (azul institucional escuro), nunca preto
          puro.
        </p>
      </Card>
    </>
  );
}