"use client";

import {
  Breadcrumb,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "semec-ds/react";
import { CreditCard, FileCheck, FileText } from "lucide-react";

const ITENS = [
  { id: "iptu", label: "IPTU", Icon: CreditCard },
  { id: "licencas", label: "Licenças", Icon: FileText },
  { id: "certidoes", label: "Certidões", Icon: FileCheck },
];

/**
 * As duas formas de dizer &quot;você está aqui&quot; lado a lado: a trilha de
 * navegação (último nível com aria-current) e o item ativo do menu lateral
 * (isActive + aria-current), sempre com pista além da cor.
 */
export function LocalizacaoDemo() {
  return (
    <div className="w-full max-w-3xl text-left">
      <div className="grid gap-4 md:grid-cols-2">
        <section aria-labelledby="loc-trilha" className="rounded-lg border border-border bg-surface p-4">
          <h2 id="loc-trilha" className="text-sm font-semibold text-foreground">
            1. Trilha de navegação
          </h2>
          <div className="mt-3">
            <Breadcrumb
              items={[
                { label: "Início", href: "#proto" },
                { label: "Serviços", href: "#proto" },
                { label: "Tributos", href: "#proto" },
                { label: "IPTU 2026" },
              ]}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            O nível atual deixa de ser link e recebe aria-current=&quot;page&quot; — o leitor de
            tela anuncia a posição sem depender do destaque visual.
          </p>
        </section>

        <section aria-labelledby="loc-menu" className="rounded-lg border border-border bg-surface p-4">
          <h2 id="loc-menu" className="text-sm font-semibold text-foreground">
            2. Item ativo do menu
          </h2>
          <div className="mt-3 flex gap-3">
            <Sidebar collapsible="none" className="h-auto w-44 shrink-0 rounded-md border border-border">
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>Tributos</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {ITENS.map(({ id, label, Icon }) => (
                        <SidebarMenuItem key={id}>
                          <SidebarMenuButton asChild isActive={id === "iptu"}>
                            <a href="#proto" aria-current={id === "iptu" ? "page" : undefined}>
                              <Icon aria-hidden="true" />
                              <span>{label}</span>
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">IPTU 2026</p>
              <p className="mt-1 text-xs text-muted-foreground">
                O título da página confirma o contexto mostrado pelo menu e pela trilha.
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            O item ativo combina fundo, peso de fonte e aria-current=&quot;page&quot;: nunca só
            cor.
          </p>
        </section>
      </div>
    </div>
  );
}
