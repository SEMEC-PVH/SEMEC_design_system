/* eslint-disable jsx-a11y/anchor-is-valid -- preview estático, links são placeholders */
export default function DemoHeader() {
  return (
    <div className="demo-header">
      <div className="brand">
        <div className="logo"></div>
        <div className="divider"></div>
        <div className="name">
          SEMEC <span className="dig">DIGITAL</span>
        </div>
      </div>
      <nav>
        <a href="#">Prefeitura</a>
        <a href="#">Sobre a SEMEC</a>
        <a className="cta" href="#">
          Fale Conosco
        </a>
      </nav>
    </div>
  );
}