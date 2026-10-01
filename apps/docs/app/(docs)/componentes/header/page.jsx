import BasePreview from "@/components/demos/base-previews";
import CodeBlock from "@/components/docs/CodeBlock";
import { ProtoStyle } from "@/components/docs/ComponentDoc";

export const metadata = { title: "Componente Header" };

const CODE = `import { Header, HeaderBrand, HeaderNav, HeaderNavLink, Button } from "@semec/ds/react";

<Header>
  <HeaderBrand orgName="SEMEC" serviceName="Nome do serviço" />
  <div className="flex items-center gap-2">
    <HeaderNav>
      <HeaderNavLink href="/prefeitura" current>Prefeitura</HeaderNavLink>
      <HeaderNavLink href="/servicos">Serviços</HeaderNavLink>
    </HeaderNav>
    <Button asChild size="sm">
      <a href="/contato">Fale Conosco</a>
    </Button>
  </div>
</Header>`;

export default function HeaderPage() {
  return (
    <>
      <ProtoStyle />
      <h1>Header</h1>
      <p className="subtitle">
        Topo do portal com marca, navegação e CTA. Componente do kit{" "}
        <code>@semec/ds</code>.
      </p>

      <h3>Preview</h3>
      <BasePreview slug="header" />
      <p className="text-xs text-muted-foreground mt-3">
        Composição <code>Header</code> + <code>HeaderBrand</code> +{" "}
        <code>HeaderNav</code>/<code>HeaderNavLink</code> +{" "}
        <code>Button</code>. Marca em <code>text-brand-hero</code>, superfície{" "}
        <code>bg-surface</code>, CTA com tokens de ação, foco{" "}
        <code>ring-ring</code>, alvos ≥ 44px. Preview isolado em iframe (sem o
        reset do site docs).
      </p>

      <h3>Código</h3>
      <CodeBlock code={CODE} filename="DemoHeader.jsx" />
    </>
  );
}
