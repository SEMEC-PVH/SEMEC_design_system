import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
    <Link href="/quem-somos" className="site-footer-brand">
      {"DEVSEMEC".split("").map((letter, i) => (
        <span key={i} className="site-footer-letter">{letter}</span>
      ))}
    </Link>
      <div className="site-footer-left">
        <span className="site-footer-copy">
          © 2026. Prefeitura de Porto Velho.
        </span>
        <nav className="site-footer-links" aria-label="Links do rodapé">
          <a href="mailto:contato@semec.gov.br">Contato</a>
          <a
            href="https://www.portovelho.ro.gov.br/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Prefeitura de Porto Velho
          </a>
          <Link href="/cookies">Preferências de cookies</Link>
          <Link href="/termos-de-uso">Termos de uso do site</Link>
        </nav>
      </div>

    </footer>
  );
}
