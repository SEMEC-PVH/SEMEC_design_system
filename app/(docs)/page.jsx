import Link from "next/link";
import Card from "@/components/ui/Card";

export const metadata = { title: "Visão geral" };

const secoes = [
  {
    href: "/fundamentos/tipografia",
    tag: "Fundamentos",
    title: "Tipografia",
    desc: "Famílias e escala renderizada dos títulos, corpo e microtexto.",
  },
  {
    href: "/fundamentos/cores",
    tag: "Fundamentos",
    title: "Cores",
    desc: "Paletas pv-blue, pv-green, pv-yellow, neutros e papéis semânticos.",
  },
  {
    href: "/fundamentos/layout",
    tag: "Fundamentos",
    title: "Layout",
    desc: "Container, grid de cards e regras de espaçamento.",
  },
  {
    href: "/fundamentos/raios-sombras",
    tag: "Fundamentos",
    title: "Raios, bordas e sombras",
    desc: "Escala de raios e família de sombras institucional.",
  },
  {
    href: "/componentes",
    tag: "Componentes",
    title: "Componentes",
    desc: "Header, Hero, Barra de controles, ServiceCard, Botões e Footer.",
  },
  {
    href: "/regras/animacoes",
    tag: "Regras",
    title: "Animações",
    desc: "Easing padrão, movimento e prefers-reduced-motion.",
  },
  {
    href: "/regras/acessibilidade",
    tag: "Regras",
    title: "Acessibilidade",
    desc: "Foco visível, contraste e semântica de landmarks.",
  },
  {
    href: "/regras/anti-padroes",
    tag: "Regras",
    title: "Anti-padrões",
    desc: "O que não fazer ao construir interfaces SEMEC.",
  },
];

export default function OverviewPage() {
  return (
    <>
      <h1>SEMEC design system</h1>
      <p className="subtitle">Guia visual de referência · extraído da página inicial</p>

      <Card>
        <h3>Como usar</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--pv-gray-500)" }}>
          O sistema de design define as bases das interfaces de usuário em todo
          o ecossistema de produtos e serviços da SEMEC. Ele reúne todas as
          experiências da SEMEC sob uma estrutura única e unificada.
        </p>
      </Card>

      <h2>Seções</h2>
      <div className="demo-cards">
        {secoes.map((s) => (
          <Link key={s.href} href={s.href} className="demo-card" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="tag">{s.tag}</div>
            <h5>{s.title}</h5>
            <p>{s.desc}</p>
            <div className="foot">
              <span className="go">Acessar</span>
              <span className="arrow">→</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}