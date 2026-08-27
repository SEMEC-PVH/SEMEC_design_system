import Link from "next/link";
import SectionCard from "@/components/ui/SectionCard";
import {
  ArtTipografia,
  ArtCores,
  ArtLayout,
  ArtRaios,
  ArtHeader,
  ArtHero,
  ArtControles,
  ArtServiceCard,
  ArtBotoes,
  ArtErrorSummary,
  ArtFooter,
  ArtNavegacao,
  ArtFormularios,
  ArtDados,
  ArtFeedback,
  ArtAcessibilidadePadroes,
  ArtAnimacoes,
  ArtAcessibilidade,
  ArtAntiPadroes,
  ArtPendencias,
} from "@/components/ui/sectionArt";

export const metadata = { title: "Introdução" };

const categorias = [
  {
    href: "/fundamentos",
    label: "Fundamentos",
    desc: "As bases visuais que sustentam toda interface — tipografia, cores, layout e acabamentos.",
    items: [
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
    ],
  },
  {
    href: "/componentes",
    label: "Componentes",
    desc: "Cada componente tem uma página própria com preview e regras de uso.",
    items: [
      {
        href: "/componentes/header",
        art: <ArtHeader />,
        title: "Header",
        desc: "Topo com marca, navegação e CTA.",
      },
      {
        href: "/componentes/hero",
        art: <ArtHero />,
        title: "Hero",
        desc: "Bloco de abertura com eyebrow, título e métricas.",
      },
      {
        href: "/componentes/controles",
        art: <ArtControles />,
        title: "Barra de controles",
        desc: "Tabs, busca e chips de filtro do catálogo.",
      },
      {
        href: "/componentes/service-card",
        art: <ArtServiceCard />,
        title: "ServiceCard",
        desc: "Card de serviço com tag, selo e hover.",
      },
      {
        href: "/componentes/botoes",
        art: <ArtBotoes />,
        title: "Botões",
        desc: "Primário, CTA de destaque e link.",
      },
      {
        href: "/componentes/error-summary",
        art: <ArtErrorSummary />,
        title: "ErrorSummary",
        desc: "Resumo dos erros de um formulário, no topo, com link para cada campo.",
      },
      {
        href: "/componentes/footer",
        art: <ArtFooter />,
        title: "Footer",
        desc: "Rodapé institucional com links e redes.",
      },
    ],
  },
  {
    href: "/padroes",
    label: "Padrões",
    desc: "Padrões de interface para navegação, formulários, dados, feedback e acessibilidade.",
    items: [
      {
        href: "/padroes/navegacao",
        art: <ArtNavegacao />,
        title: "Navegação",
        desc: "Como o usuário se move e se orienta dentro da interface.",
      },
      {
        href: "/padroes/formularios",
        art: <ArtFormularios />,
        title: "Formulários",
        desc: "Coleta de dados de forma clara, segura e sem fricção.",
      },
      {
        href: "/padroes/dados-relatorios",
        art: <ArtDados />,
        title: "Dados e relatórios",
        desc: "Apresentação, exploração e ação sobre conjuntos de dados.",
      },
      {
        href: "/padroes/feedback",
        art: <ArtFeedback />,
        title: "Feedback ao usuário",
        desc: "Como comunicar o estado do sistema em cada momento.",
      },
      {
        href: "/padroes/acessibilidade",
        art: <ArtAcessibilidadePadroes />,
        title: "Acessibilidade",
        desc: "Padrões para interfaces acessíveis e inclusivas.",
      },
    ],
  },
  {
    href: "/regras",
    label: "Regras",
    desc: "Regras de uso que garantem consistência, acessibilidade e boas práticas.",
    items: [
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
      {
        href: "/regras/pendencias",
        art: <ArtPendencias />,
        title: "Pendências",
        desc: "Dívidas conhecidas e próximos passos do design system.",
      },
    ],
  },
];

export default function OverviewPage() {
  return (
    <>
      <h1>SEMEC design system</h1>
      <p className="subtitle">Guia de referência visual SEMEC</p>

      <h2>O que é um Design System</h2>
      <p>
        Um Design System é um conjunto de diretrizes, componentes reutilizáveis,
        padrões e recursos que ajudam designers e desenvolvedores a criar
        experiências digitais consistentes. O SEMEC Design System (SDS) reúne a
        linguagem visual e os padrões web da Prefeitura de Porto Velho em um só
        lugar.
      </p>
      <p>
        Com o SDS, quem constrói interfaces institucionais parte de decisões já
        tomadas — tipografia, cor, espaçamento, componentes e padrões — e
        concentra o esforço no que é específico de cada aplicação. O resultado é
        uma experiência coerente, acessível e eficiente em todos os serviços.
      </p>

      {categorias.map((categoria) => (
        <section key={categoria.href} className="intro-category">
          <div className="category-head">
            <h3>
              <Link href={categoria.href}>{categoria.label}</Link>
            </h3>
            <p>{categoria.desc}</p>
          </div>
          <div className="section-cards">
            {categoria.items.map((s) => (
              <SectionCard
                key={s.href}
                href={s.href}
                art={s.art}
                title={s.title}
                desc={s.desc}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}