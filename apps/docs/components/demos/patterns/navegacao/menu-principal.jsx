"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "semec-ds/react";

const GRUPOS = {
  servicos: [
    {
      titulo: "Tributos",
      itens: [
        { label: "IPTU", desc: "Segunda via e parcelamento" },
        { label: "Licença de funcionamento", desc: "Renovação anual do comércio" },
      ],
    },
    {
      titulo: "Urbanismo",
      itens: [
        { label: "Alvará de obra", desc: "Autorização de construção e reforma" },
        { label: "Habite-se", desc: "Certidão de conclusão da obra" },
      ],
    },
  ],
  institucional: [
    {
      titulo: "A prefeitura",
      itens: [
        { label: "Secretarias", desc: "Contato por pasta administrativa" },
        { label: "Transparência", desc: "Orçamento e dados abertos" },
      ],
    },
    {
      titulo: "Participe",
      itens: [
        { label: "Ouvidoria", desc: "Elogios, sugestões e reclamações" },
        { label: "Licitações", desc: "Editais e resultados" },
      ],
    },
  ],
};

/** Coluna de links dentro do submenu: rótulo de grupo + itens com descrição. */
function MenuGrupo({ titulo, itens }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-muted-foreground">{titulo}</p>
      <ul className="flex flex-col gap-1">
        {itens.map((item) => (
          <li key={item.label}>
            <NavigationMenuLink
              href="#proto"
              className="block rounded-md px-3 py-2 text-sm font-medium text-foreground no-underline transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="block">{item.label}</span>
              <span className="block text-xs font-normal text-muted-foreground">{item.desc}</span>
            </NavigationMenuLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Menu principal de topo com dois gatilhos e conteúdo agrupado por tema.
 * O Radix monta nav + aria-haspopup/aria-expanded e percorre os itens
 * com as setas do teclado; Esc fecha o submenu.
 */
export function MenuPrincipalDemo() {
  return (
    <div className="w-full text-left">
      <div className="rounded-lg border border-border bg-surface p-3">
        <NavigationMenu aria-label="Menu principal">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Serviços</NavigationMenuTrigger>
              <NavigationMenuContent className="w-[320px] p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {GRUPOS.servicos.map((grupo) => (
                    <MenuGrupo key={grupo.titulo} titulo={grupo.titulo} itens={grupo.itens} />
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Institucional</NavigationMenuTrigger>
              <NavigationMenuContent className="w-[320px] p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {GRUPOS.institucional.map((grupo) => (
                    <MenuGrupo key={grupo.titulo} titulo={grupo.titulo} itens={grupo.itens} />
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-4">
        <p className="text-sm font-medium text-foreground">Conteúdo da página</p>
        <p className="mt-1 text-sm text-muted-foreground">
          O submenu abre abaixo do gatilho e sobrepõe o conteúdo, sem empurrar a página.
        </p>
      </div>
    </div>
  );
}
