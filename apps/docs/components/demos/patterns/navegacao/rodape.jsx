"use client";

import { Badge, Link, Separator } from "semec-ds/react";
import { Camera, Mail, MapPin, MessageCircle, Phone, Tv } from "lucide-react";

const GRUPOS = [
  {
    titulo: "Institucional",
    ariaLabel: "Links institucionais",
    links: ["Secretarias", "Transparência", "Licitações", "Carreiras"],
  },
  {
    titulo: "Serviços",
    ariaLabel: "Links de serviços",
    links: ["IPTU", "Alvarás", "Certidões", "Atendimento"],
  },
];

const REDES = [
  { nome: "Instagram", Icon: Camera },
  { nome: "Facebook", Icon: MessageCircle },
  { nome: "YouTube", Icon: Tv },
];

/**
 * Rodapé institucional montado com HTML semântico (o kit não tem Footer):
 * landmark footer, um nav com aria-label por grupo de links, Separator
 * entre as partes e links das redes com Badge + ícone + texto visível.
 */
export function RodapeDemo() {
  return (
    <div className="w-full text-left">
      <footer className="rounded-lg border border-border bg-surface px-6 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <p className="text-base font-bold text-brand-hero">
              SEMEC{" "}
              <span aria-hidden="true" className="font-normal text-muted-foreground">
                |
              </span>{" "}
              <span className="font-semibold text-foreground">Prefeitura Municipal</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Portal oficial de serviços ao cidadão. Atendimento presencial de segunda a sexta,
              das 8h às 18h.
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone aria-hidden="true" className="h-4 w-4 shrink-0" />
                (69) 3216-1000
              </li>
              <li className="flex items-center gap-2">
                <Mail aria-hidden="true" className="h-4 w-4 shrink-0" />
                atendimento@prefeitura.gov.br
              </li>
              <li className="flex items-center gap-2">
                <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />
                Av. Jorge Teixeira, 1000 — Centro
              </li>
            </ul>
          </div>

          {GRUPOS.map((grupo) => (
            <nav key={grupo.titulo} aria-label={grupo.ariaLabel} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-foreground">{grupo.titulo}</h2>
              {grupo.links.map((link) => (
                <Link key={link} href="#proto" variant="muted">
                  {link}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <Separator className="my-6" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 Prefeitura Municipal · Acessibilidade · Política de privacidade
          </p>
          <ul className="flex flex-wrap items-center gap-2" aria-label="Redes sociais">
            {REDES.map(({ nome, Icon }) => (
              <li key={nome}>
                <Link href="#proto" variant="muted" className="rounded-full">
                  <Badge variant="outline" className="gap-1.5">
                    <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                    {nome}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  );
}
