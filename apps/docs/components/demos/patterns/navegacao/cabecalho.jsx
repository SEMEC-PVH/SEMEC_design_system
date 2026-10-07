"use client";

import { Button, Header, HeaderBrand, HeaderNav, HeaderNavLink } from "semec-ds/react";

/**
 * Cabeçalho do portal: marca clicável, navegação primária com a página
 * atual marcada (`current` → aria-current) e ação contextual no fim da
 * ordem de foco. `flex-wrap` evita estouro em telas estreitas.
 */
export function CabecalhoDemo() {
  return (
    <div className="w-full text-left">
      <Header className="flex-wrap">
        <HeaderBrand orgName="SEMEC" serviceName="Portal de Serviços" href="#proto" />
        <div className="flex flex-wrap items-center gap-2">
          <HeaderNav>
            <HeaderNavLink href="#proto" current>
              Início
            </HeaderNavLink>
            <HeaderNavLink href="#proto">Serviços</HeaderNavLink>
            <HeaderNavLink href="#proto">Transparência</HeaderNavLink>
          </HeaderNav>
          <Button asChild size="sm">
            <a href="#proto">Fale conosco</a>
          </Button>
        </div>
      </Header>
      <p className="mt-3 px-1 text-xs text-muted-foreground">
        Landmark <code>&lt;header&gt;</code>, marca como link para o início, item atual com
        aria-current=&quot;page&quot; e ação principal acessível por Tab depois da navegação.
      </p>
    </div>
  );
}
