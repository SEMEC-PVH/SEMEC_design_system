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
