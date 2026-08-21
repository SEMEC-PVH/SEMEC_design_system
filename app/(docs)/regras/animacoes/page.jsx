import Card from "@/components/ui/Card";

export const metadata = { title: "Animações" };

export default function AnimacoesPage() {
  return (
    <>
      <h1>Animações</h1>
      <p className="subtitle">
        Easing padrão e regras de movimento.
      </p>

      <Card>
        <p style={{ fontSize: "0.85rem", color: "var(--pv-gray-500)", marginBottom: "0.75rem" }}>
          Easing padrão <code>cubic-bezier(0.16, 1, 0.3, 1)</code> (expo-out).
          Passe o mouse nos cards abaixo.
        </p>
        <div className="anim-demo">
          <div className="tile">Hover de card</div>
          <div className="tile">Chip fade</div>
          <div className="tile">Rise (herói)</div>
          <div className="tile">Slide up</div>
        </div>
        <p className="note">
          Respeite <code>prefers-reduced-motion</code>. Não crie animações novas
          sem usar o mesmo easing.
        </p>
      </Card>
    </>
  );
}