"use client";

/* eslint-disable jsx-a11y/anchor-is-valid -- preview estático, links são placeholders */
import {
  Header,
  HeaderBrand,
  HeaderNav,
  HeaderNavLink,
  Button,
} from "semec-ds/react";

export default function DemoHeader() {
  return (
    <Header>
      <HeaderBrand orgName="SEMEC" serviceName="Nome do serviço" />
      <div className="flex items-center gap-2">
        <HeaderNav>
          <HeaderNavLink href="#" current>
            Prefeitura
          </HeaderNavLink>
          <HeaderNavLink href="#">Serviços</HeaderNavLink>
        </HeaderNav>
        <Button asChild size="sm">
          <a href="#">Fale Conosco</a>
        </Button>
      </div>
    </Header>
  );
}
