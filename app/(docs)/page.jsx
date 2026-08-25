import Card from "@/components/ui/Card";
import SectionCard from "@/components/ui/SectionCard";
import {
  ArtTipografia,
  ArtCores,
  ArtLayout,
  ArtRaios,
  ArtComponentes,
  ArtAnimacoes,
  ArtAcessibilidade,
  ArtAntiPadroes,
} from "@/components/ui/sectionArt";

export const metadata = { title: "Introdução" };

const secoes = [
  {
    href: "/fundamentos/tipografia",
    art: <ArtTipografia />,
    title: "Tipografia",
    desc: "Famílias e escala renderizada dos títulos, corpo e microtexto.",
  },
  {
    href: "/fundamentos/cores",
    art: <ArtCores />,
    title: "Cores",
    desc: "Paletas pv-blue, pv-green, pv-yellow, neutros e papéis semânticos.",
  },
  {
    href: "/fundamentos/layout",
    art: <ArtLayout />,
    title: "Layout",
    desc: "Container, grid de cards e regras de espaçamento.",
  },
  {
    href: "/fundamentos/raios-sombras",
    art: <ArtRaios />,
    title: "Raios, bordas e sombras",
    desc: "Escala de raios e família de sombras institucional.",
  },
  {
    href: "/componentes",
    art: <ArtComponentes />,
    title: "Componentes",
    desc: "Header, Hero, Barra de controles, ServiceCard, Botões e Footer.",
  },
  {
    href: "/regras/animacoes",
    art: <ArtAnimacoes />,
    title: "Animações",
    desc: "Easing padrão, movimento e prefers-reduced-motion.",
  },
  {
    href: "/regras/acessibilidade",
    art: <ArtAcessibilidade />,
    title: "Acessibilidade",
    desc: "Foco visível, contraste e semântica de landmarks.",
  },
  {
    href: "/regras/anti-padroes",
    art: <ArtAntiPadroes />,
    title: "Anti-padrões",
    desc: "O que não fazer ao construir interfaces SEMEC.",
  },
];

export default function OverviewPage() {
  return (
    <>
      <h1>SEMEC design system</h1>
      <p className="subtitle">Guia de referência visual SEMEC</p>


        <h3>O que é um Design System</h3>
        <p style={{ fontSize: "0.95rem", color: "var(--pv-gray-600)" }}>
          Um Design System é um conjunto de diretrizes, componentes
          reutilizáveis, padrões e outros recursos que ajudam designers e
          desenvolvedores a criar experiências digitais e aplicativos
          consistentes. O SEMEC Design System (SDS) oferece uma arquitetura nova
          e rica, componentes reutilizáveis e padrões web modernos que auxiliam
          no design e na construção de aplicativos alinhados à experiência institucional da PMPV.
        </p>
        <p style={{ fontSize: "0.95rem", color: "var(--pv-gray-600)", marginTop: "0.75rem" }}>
          O SDS inclui recursos para criar interfaces de usuário consistentes
          com os princípios de design, a linguagem visual e as melhores práticas
          do Salesforce. Em vez de perder tempo ajustando pixels, os
          desenvolvedores podem concentrar-se na lógica da aplicação, enquanto
          os designers focam na experiência do usuário, nas interações e nos
          fluxos. Esse sistema garante que a criação em todas as aplicações web
          da PMPV seja consistente, acessível e eficiente.
        </p>


      <h2>Seções</h2>
      <div className="section-cards">
        {secoes.map((s) => (
          <SectionCard
            key={s.href}
            href={s.href}
            art={s.art}
            title={s.title}
            desc={s.desc}
          />
        ))}
      </div>
    </>
  );
}
