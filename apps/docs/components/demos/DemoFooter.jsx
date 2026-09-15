/* eslint-disable jsx-a11y/anchor-is-valid -- preview estático, links são placeholders */
const social = [
  { glyph: "f", label: "SEMEC Digital no Facebook" },
  { glyph: "◎", label: "SEMEC Digital no Instagram" },
  { glyph: "▶", label: "SEMEC Digital no YouTube" },
];

export default function DemoFooter() {
  return (
    <div className="demo-footer">
      <div className="title">SEMEC DIGITAL</div>
      <p>
        Serviços e informações da Secretaria Municipal de Economia em uma
        experiência digital mais clara, direta e acessível.
      </p>
      <div className="social">
        {social.map((s) => (
          <a key={s.glyph} href="#" aria-label={s.label}>
            <span aria-hidden="true">{s.glyph}</span>
          </a>
        ))}
      </div>
      <p style={{ marginTop: "0.75rem" }}>
        <a href="#">Política de Privacidade</a> ·{" "}
        <a href="#">Termos de Uso</a> · <a href="#">Transparência</a>
      </p>
    </div>
  );
}
