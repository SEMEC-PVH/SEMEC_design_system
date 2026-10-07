/**
 * Registro dos exemplos visuais dos padrões de navegação.
 * Chave = rota (`/padroes/navegacao/<slug>`). Dados puros: sem "use client".
 */

export const navegacaoPatterns = {
  "navegacao/cabecalho": {
    label: "Cabeçalho",
    desc: "Marca clicável, navegação primária com página atual e ação contextual no topo.",
    filename: "CabecalhoDemo.jsx",
    prompt:
      "Crie um cabeçalho de portal com Header + HeaderBrand + HeaderNav usando @semec/ds/react: marca como link, item atual marcado com current, landmark header e foco visível.",
    usage: `import { Header, HeaderBrand, HeaderNav, HeaderNavLink, Button } from "@semec/ds/react";

<Header className="flex-wrap">
  <HeaderBrand orgName="SEMEC" serviceName="Portal de Serviços" href="/" />
  <div className="flex flex-wrap items-center gap-2">
    <HeaderNav>
      <HeaderNavLink href="/" current>Início</HeaderNavLink>
      <HeaderNavLink href="/servicos">Serviços</HeaderNavLink>
      <HeaderNavLink href="/transparencia">Transparência</HeaderNavLink>
    </HeaderNav>
    <Button asChild size="sm">
      <a href="/contato">Fale conosco</a>
    </Button>
  </div>
</Header>`,
  },
  "navegacao/menu-principal": {
    label: "Menu principal",
    desc: "Navegação primária de topo com submenus que agrupam os links por tema.",
    filename: "MenuPrincipalDemo.jsx",
    prompt:
      "Crie um menu principal com submenu usando @semec/ds/react (NavigationMenu): gatilho com aria-haspopup, itens agrupados por categoria e navegação por teclado.",
    usage: `import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink } from "@semec/ds/react";

<NavigationMenu aria-label="Menu principal">
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Serviços</NavigationMenuTrigger>
      <NavigationMenuContent className="w-[320px] p-4">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Tributos</p>
        <NavigationMenuLink href="/servicos/iptu">IPTU — segunda via</NavigationMenuLink>
        <NavigationMenuLink href="/servicos/alvara">Alvará de obra</NavigationMenuLink>
      </NavigationMenuContent>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Institucional</NavigationMenuTrigger>
      ...mesma estrutura com os grupos A prefeitura e Participe...
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`,
  },
  "navegacao/navegacao-lateral": {
    label: "Navegação lateral",
    desc: "Menu em coluna com grupos, item ativo e botão para recolher a barra.",
    filename: "NavegacaoLateralDemo.jsx",
    prompt:
      "Crie uma navegação lateral recolhível usando @semec/ds/react (SidebarProvider + Sidebar): grupos com rótulo, item ativo, gatilho com aria-expanded e conteúdo principal ao lado.",
    usage: `import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarToggleButton } from "@semec/ds/react";

<SidebarProvider open={aberto} onOpenChange={setAberto}>
  <Sidebar inert={!aberto}>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Operação do dia</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={ativo === "requerimentos"}>
              <a href="/requerimentos" aria-current="page">Requerimentos</a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
  <div className="flex-1 p-4"><SidebarToggleButton open={aberto} onToggle={() => setAberto((v) => !v)} /></div>
</SidebarProvider>`,
  },
  "navegacao/breadcrumbs": {
    label: "Breadcrumbs",
    desc: "Trilha com raiz, níveis clicáveis, separadores e a página atual sem link.",
    filename: "BreadcrumbsDemo.jsx",
    prompt:
      "Crie breadcrumbs acessíveis usando @semec/ds/react (Breadcrumb): nav com aria-label, aria-current na página atual, separadores ocultos para leitor de tela e foco visível.",
    usage: `import { Breadcrumb } from "@semec/ds/react";

<Breadcrumb
  items={[
    { label: "Início", href: "/" },
    { label: "Serviços", href: "/servicos" },
    { label: "Tributos", href: "/servicos/tributos" },
    { label: "IPTU 2026" },
  ]}
/>`,
  },
  "navegacao/abas": {
    label: "Abas",
    desc: "Visões alternadas do mesmo requerimento, com foco gerenciado pelo teclado.",
    filename: "AbasDemo.jsx",
    prompt:
      "Crie abas acessíveis usando @semec/ds/react (Tabs): role=tablist, setas percorrendo as abas, aria-selected e painéis com role=tabpanel.",
    usage: `import { Tabs, TabsList, TabsTrigger, TabsContent, Badge } from "@semec/ds/react";

<Tabs defaultValue="resumo">
  <TabsList>
    <TabsTrigger value="resumo">Resumo</TabsTrigger>
    <TabsTrigger value="debitos">Débitos</TabsTrigger>
    <TabsTrigger value="andamento">Andamento</TabsTrigger>
  </TabsList>
  <TabsContent value="resumo">…dados do requerimento em <dl>…</TabsContent>
  <TabsContent value="debitos">…parcelas com Badge de situação…</TabsContent>
  <TabsContent value="andamento">…histórico em <ol>…</TabsContent>
</Tabs>`,
  },
  "navegacao/busca": {
    label: "Campo de busca",
    desc: "Busca por palavra-chave que filtra as opções e anuncia o total encontrado.",
    filename: "BuscaDemo.jsx",
    prompt:
      "Crie um campo de busca com filtro ao digitar usando @semec/ds/react (Input): resultado em aria-live, estado vazio quando não há correspondência e rótulo visível.",
    usage: `import { useState } from "react";
import { Input, EmptyState, Button } from "@semec/ds/react";

const [termo, setTermo] = useState("");
const resultados = termo ? SERVICOS.filter((s) => normalizar(s.nome).includes(normalizar(termo))) : SERVICOS;

<label htmlFor="nv-busca">Buscar serviço</label>
<Input id="nv-busca" type="search" value={termo} onChange={(e) => setTermo(e.target.value)} />
<p role="status" aria-live="polite">{resultados.length} de {SERVICOS.length} serviços encontrados</p>

{resultados.length === 0 ? (
  <EmptyState title="Nenhum serviço encontrado" description="Tente outro termo."
    action={<Button onClick={() => setTermo("")}>Limpar busca</Button>} />
) : (
  <ul>{resultados.map((s) => <li key={s.nome}>{s.nome}</li>)}</ul>
)}`,
  },
  "navegacao/paginacao": {
    label: "Paginação",
    desc: "Números de página com janela e elipses, marcando onde o usuário está.",
    filename: "PaginacaoDemo.jsx",
    prompt:
      "Crie uma paginação acessível usando @semec/ds/react (Pagination): role=navigation com label, aria-current=page, janela de números com elipses e navegação por teclado.",
    usage: `import { useState } from "react";
import { Pagination } from "@semec/ds/react";

const [pagina, setPagina] = useState(4);
const inicio = (pagina - 1) * POR_PAGINA;
const visiveis = REQUERIMENTOS.slice(inicio, inicio + POR_PAGINA);

<p role="status" aria-live="polite">
  Mostrando {inicio + 1}–{inicio + visiveis.length} de {REQUERIMENTOS.length} · Página {pagina} de {totalPaginas}
</p>

<ul>{visiveis.map((r) => <li key={r.protocolo}>{r.protocolo} · {r.servico}</li>)}</ul>

<Pagination page={pagina} pageCount={totalPaginas} onPageChange={setPagina} />`,
  },
  "navegacao/indicacao-localizacao-atual": {
    label: "Indicação de localização atual",
    desc: "Trilha de navegação e item ativo do menu marcando onde o usuário está.",
    filename: "LocalizacaoDemo.jsx",
    prompt:
      "Crie a indicação de localização atual combinando breadcrumbs e item ativo do menu lateral usando @semec/ds/react, com aria-current em ambos.",
    usage: `import { Breadcrumb, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@semec/ds/react";

<Breadcrumb items={[{ label: "Início", href: "/" }, { label: "Serviços", href: "/" },
  { label: "Tributos", href: "/" }, { label: "IPTU 2026" }]} />

<Sidebar collapsible="none">
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive>
        <a href="/tributos/iptu" aria-current="page">IPTU</a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
</Sidebar>`,
  },
  "navegacao/rodape": {
    label: "Rodapé",
    desc: "Bloco institucional com marca, links úteis, contato e redes sociais.",
    filename: "RodapeDemo.jsx",
    prompt:
      "Crie um rodapé institucional semântico usando @semec/ds/react (Link, Separator, Badge): footer com nav por grupo de links, aria-label em cada grupo e texto alternativo nas redes.",
    usage: `import { Link, Separator, Badge } from "@semec/ds/react";
import { Camera } from "lucide-react";

<footer>
  <nav aria-label="Links institucionais" className="flex flex-col gap-2">
    <h2 className="text-sm font-semibold text-foreground">Institucional</h2>
    <Link href="/secretarias" variant="muted">Secretarias</Link>
    <Link href="/transparencia" variant="muted">Transparência</Link>
  </nav>
  ... outro nav com aria-label para o grupo Serviços ...
  <Separator className="my-6" />
  <Link href="/instagram" variant="muted" className="rounded-full">
    <Badge variant="outline" className="gap-1.5"><Camera aria-hidden="true" className="h-3.5 w-3.5" />Instagram</Badge>
  </Link>
</footer>`,
  },
};
