/**
 * Manifesto dos componentes do design system (kit @semec/ds-react, `packages/react/`).
 * Fonte única: páginas de rota, índice, sidebar, snippets, prompts e registry.
 * `file` é relativo a `packages/react/`; a página lê o fonte real via fs.
 * `code` é o nome no código (usado no prompt); `label`/`slug` são PT.
 * Este arquivo é DADOS PUROS (sem node:*) — pode ser importado por
 * Client Components. Helpers de Node ficam em server.js.
 */

export const dsCategories = [
  {
    key: "acoes",
    slug: "acoes-e-links",
    label: "Ações e links",
    desc: "Gatilhos de ação e vínculos de navegação.",
  },
  {
    key: "formularios",
    slug: "formularios",
    label: "Formulários",
    desc: "Campos, controles de escolha e ativação imediata.",
  },
  {
    key: "conteudo-dados",
    slug: "conteudo-e-dados",
    label: "Conteúdo e dados",
    desc: "Superfícies de conteúdo, sinalização e dados tabulares.",
  },
  {
    key: "navegacao",
    slug: "navegacao",
    label: "Navegação",
    desc: "Trilhas, abas e deslocamento entre páginas.",
  },
  {
    key: "feedback",
    slug: "feedback-e-estados",
    label: "Feedback e estados",
    desc: "Mensagens de estado, carregamento e camadas sobre a página.",
  },
];

export const dsComponents = [
  {
    code: "button",
    slug: "botoes",
    label: "Botões",
    file: "src/components/button.tsx",
    category: "acoes",
    desc: "Ação principal. Seis variantes e quatro tamanhos; `asChild` transforma o botão num link.",
    variants: [
      { prop: "variant", values: "primary · secondary · outline · ghost · destructive · link" },
      { prop: "size", values: "sm · md · lg · icon" },
    ],
    usage: `import { Button } from "@semec/ds-react";
import Link from "next/link";
import { Plus } from "lucide-react";

<Button variant="primary">Emitir boleto</Button>
<Button variant="outline">Salvar rascunho</Button>
<Button variant="ghost">Cancelar</Button>

<Button variant="destructive">Excluir requerimento</Button>

<Button><Plus /> Adicionar serviço</Button>

<Button asChild>
  <Link href="/iptu">Ver meu IPTU</Link>
</Button>`,
  },
  {
    code: "icon-button",
    slug: "botao-de-icone",
    label: "Botão de ícone",
    file: "src/components/icon-button.tsx",
    category: "acoes",
    desc: "Botão quadrado só com ícone. Exige `label` (vira `aria-label` e `title`).",
    variants: [{ prop: "variant", values: "primary · secondary · outline · ghost · destructive · link" }],
    usage: `import { IconButton } from "@semec/ds-react";
import { Download, Search, Trash2 } from "lucide-react";

<IconButton label="Buscar requerimento"><Search /></IconButton>
<IconButton label="Baixar carnê"><Download /></IconButton>
<IconButton label="Excluir requerimento" variant="destructive"><Trash2 /></IconButton>`,
  },
  {
    code: "link",
    slug: "link",
    label: "Link",
    file: "src/components/link.tsx",
    category: "acoes",
    desc: "Link tipográfico com variantes de cor. `onSurface` para links sobre superfícies elevadas.",
    variants: [{ prop: "variant", values: "primary · onSurface · muted" }],
    usage: `import { Link } from "@semec/ds-react";

<Link href="/iptu">Acessar guia do IPTU 2026</Link>
<Link href="/protocolo" variant="onSurface">Acompanhar protocolo</Link>
<Link href="/ajuda" variant="muted">Saiba mais sobre prazos</Link>`,
  },
  {
    code: "input",
    slug: "caixa-de-texto",
    label: "Caixa de texto",
    file: "src/components/input.tsx",
    category: "formularios",
    desc: "Campo de texto. Estado de erro via `aria-invalid`.",
    variants: [{ prop: "estados", values: "padrão · inválido (aria-invalid) · disabled" }],
    usage: `import { Input } from "@semec/ds-react";

<Input placeholder="Nome completo" />
<Input aria-invalid="true" />`,
  },
  {
    code: "textarea",
    slug: "area-de-texto",
    label: "Área de texto",
    file: "src/components/textarea.tsx",
    category: "formularios",
    desc: "Campo multilinha com as mesmas variantes visuais do campo de texto.",
    variants: [{ prop: "estados", values: "padrão · inválido · disabled" }],
    usage: `import { Textarea } from "@semec/ds-react";

<Textarea rows={4} placeholder="Descreva a demanda" />`,
  },
  {
    code: "select",
    slug: "menu-de-selecao",
    label: "Menu de seleção",
    file: "src/components/select.tsx",
    category: "formularios",
    desc: "Seleção fechada com gatilho, conteúdo e itens compostos.",
    variants: [{ prop: "composição", values: "Select · SelectTrigger · SelectValue · SelectContent · SelectItem" }],
    usage: `import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@semec/ds-react";

<Select defaultValue="pbh">
  <SelectTrigger aria-label="Município"><SelectValue placeholder="Município" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="pbh">Porto Velho</SelectItem>
    <SelectItem value="riob">Rio Branco</SelectItem>
  </SelectContent>
</Select>`,
  },
  {
    code: "combobox",
    slug: "combobox",
    label: "Combobox",
    file: "src/components/combobox.tsx",
    category: "formularios",
    desc: "Campo com busca e lista filtrada. Opções via `options`.",
    variants: [{ prop: "props", values: "options · value · onChange · placeholder · emptyMessage · disabled" }],
    usage: `import { Combobox } from "@semec/ds-react";

<Combobox
  options={[{ value: "cnpj", label: "CNPJ" }, { value: "cpf", label: "CPF" }]}
  value={valor}
  onChange={setValor}
/>`,
  },
  {
    code: "date-picker",
    slug: "seletor-de-data",
    label: "Seletor de data",
    file: "src/components/date-picker.tsx",
    category: "formularios",
    desc: 'Data com `<input type="date">` nativo — sem biblioteca de calendário.',
    variants: [{ prop: "props", values: "nativo HTML (min · max · disabled) + variantes visuais do campo" }],
    usage: `import { DatePicker } from "@semec/ds-react";

<DatePicker defaultValue="2026-08-31" />`,
  },
  {
    code: "file-upload",
    slug: "envio-de-arquivos",
    label: "Envio de arquivos",
    file: "src/components/file-upload.tsx",
    category: "formularios",
    desc: "Área de arrastar-e-soltar com lista de arquivos, limite por tamanho e erro.",
    variants: [{ prop: "props", values: "accept · maxSize · label · hint · error · onChange" }],
    usage: `import { FileUpload } from "@semec/ds-react";

<FileUpload accept=".pdf,image/*" maxSize={5 * 1024 * 1024} hint="PDF ou imagem, até 5 MB" />`,
  },
  {
    code: "checkbox",
    slug: "caixa-de-marcacao",
    label: "Caixa de marcação",
    file: "src/components/checkbox.tsx",
    category: "formularios",
    desc: "Caixa de marcação com estado indeterminado.",
    variants: [{ prop: "estados", values: "desmarcado · marcado (checked) · indeterminado · disabled" }],
    usage: `import { Checkbox, Label } from "@semec/ds-react";

<div className="flex items-center gap-2">
  <Checkbox id="termos" />
  <Label htmlFor="termos">Aceito os termos</Label>
</div>`,
  },
  {
    code: "radio-group",
    slug: "botao-de-opcao",
    label: "Botão de opção",
    file: "src/components/radio-group.tsx",
    category: "formularios",
    desc: "Escolha única entre duas ou mais opções.",
    variants: [{ prop: "composição", values: "RadioGroup · RadioGroupItem + Label" }],
    usage: `import { RadioGroup, RadioGroupItem, Label } from "@semec/ds-react";

<RadioGroup defaultValue="pessoa-fisica">
  <div className="flex items-center gap-2">
    <RadioGroupItem value="pessoa-fisica" id="pf" />
    <Label htmlFor="pf">Pessoa física</Label>
  </div>
</RadioGroup>`,
  },
  {
    code: "switch",
    slug: "interruptor",
    label: "Interruptor",
    file: "src/components/switch.tsx",
    category: "formularios",
    desc: "Interruptor on/off para ativação imediata.",
    variants: [{ prop: "estados", values: "off · on (checked) · disabled · inválido" }],
    usage: `import { Switch, Label } from "@semec/ds-react";

<div className="flex items-center gap-2">
  <Switch id="alertas" defaultChecked />
  <Label htmlFor="alertas">Receber alertas</Label>
</div>`,
  },
  {
    code: "label",
    slug: "rotulo",
    label: "Rótulo",
    file: "src/components/label.tsx",
    category: "formularios",
    desc: "Rótulo acessível vinculado ao campo.",
    variants: [],
    usage: `import { Label, Input } from "@semec/ds-react";

<Label htmlFor="nome">Nome</Label>
<Input id="nome" />`,
  },
  {
    code: "form-field",
    slug: "campo-de-formulario",
    label: "Campo de formulário",
    file: "src/components/form-field.tsx",
    category: "formularios",
    desc: "Casaco do campo: label, obrigatório, dica e mensagem de erro na ordem certa.",
    variants: [{ prop: "props", values: "label · htmlFor · required · hint · error" }],
    usage: `import { FormField, Input } from "@semec/ds-react";

<FormField label="E-mail" htmlFor="email" required hint="Usado para o comprovante" error="Informe um e-mail válido">
  <Input id="email" aria-invalid />
</FormField>`,
  },
  {
    code: "error-summary",
    slug: "error-summary",
    label: "ErrorSummary",
    file: "src/components/error-summary.tsx",
    category: "formularios",
    desc: "Resumo de erros de validação no topo do formulário, com links para cada campo. A11y: `role=\"alert\"`, foco automático.",
    variants: [{ prop: "props", values: "title · errors [{ id, message }] · autoFocus · focusKey" }],
    usage: `import { ErrorSummary } from "@semec/ds-react";

<ErrorSummary
  errors={[
    { id: "cpf", message: "O CPF precisa ter 11 dígitos." },
    { id: "email", message: "O e-mail precisa conter @." },
  ]}
  focusKey={tentativa}
/>`,
  },
  {
    code: "card",
    slug: "cartao",
    label: "Cartão",
    file: "src/components/card.tsx",
    category: "conteudo-dados",
    desc: "Superfície de conteúdo com header, corpo e footer.",
    variants: [{ prop: "composição", values: "Card · CardHeader · CardTitle · CardDescription · CardContent · CardFooter" }],
    usage: `import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from "@semec/ds-react";

<Card>
  <CardHeader><CardTitle>IPTU 2026</CardTitle></CardHeader>
  <CardContent>Parcela em dia.</CardContent>
  <CardFooter><Button>Emitir boleto</Button></CardFooter>
</Card>`,
  },
  {
    code: "badge",
    slug: "etiqueta",
    label: "Etiqueta",
    file: "src/components/badge.tsx",
    category: "conteudo-dados",
    desc: "Etiqueta curta de status ou contagem.",
    variants: [{ prop: "variant", values: "default · secondary · outline · success · warning · danger · info" }],
    usage: `import { Badge } from "@semec/ds-react";

<Badge>Pendente</Badge>
<Badge variant="success">Deferido</Badge>
<Badge variant="danger">Indeferido</Badge>`,
  },
  {
    code: "table",
    slug: "tabela",
    label: "Tabela",
    file: "src/components/table.tsx",
    category: "conteudo-dados",
    desc: "Tabela de dados semântica com caption, header, body e footer. Para ordenação, filtros e seleção, ver padrão avançado em /padroes/dados-relatorios/tabelas.",
    variants: [
      { prop: "composição", values: "Table · TableHeader · TableRow · TableHead · TableBody · TableCell · TableFooter · TableCaption" },
      { prop: "a11y", values: "role=table · scope=col (TableHead) · aria-sort · aria-rowcount · aria-colcount" },
    ],
    usage: `import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@semec/ds-react";

// Básico
<Table>
  <TableHeader><TableRow><TableHead>Serviço</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
  <TableBody><TableRow><TableCell>IPTU</TableCell><TableCell>Aberto</TableCell></TableRow></TableBody>
</Table>

// Avançado: ordenação + filtro + paginação + seleção
// Ver padroes/dados-relatorios/tabelas → demo com TableAdvanced`,
  },
  {
    code: "skeleton",
    slug: "esqueleto",
    label: "Esqueleto",
    file: "src/components/skeleton.tsx",
    category: "feedback",
    desc: "Placeholder pulsante de carregamento.",
    variants: [],
    usage: `import { Skeleton } from "@semec/ds-react";

<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-4 w-[180px]" />`,
  },
  {
    code: "empty-state",
    slug: "estado-vazio",
    label: "Estado vazio",
    file: "src/components/empty-state.tsx",
    category: "feedback",
    desc: "Estado vazio com ícone, título, descrição e ação opcional.",
    variants: [{ prop: "props", values: "icon · title · description · action" }],
    usage: `import { EmptyState, Button } from "@semec/ds-react";
import { Inbox } from "lucide-react";

<EmptyState
  icon={<Inbox />}
  title="Nenhum protocolo encontrado"
  description="Ajuste os filtros ou abra um novo requerimento."
  action={<Button>Abrir requerimento</Button>}
/>`,
  },
  {
    code: "breadcrumb",
    slug: "trilha-de-navegacao",
    label: "Trilha de navegação",
    file: "src/components/breadcrumb.tsx",
    category: "navegacao",
    desc: "Trilha com o item atual marcado (`current`). Separadores visuais ocultos de leitor de tela.",
    variants: [
      { prop: "props", values: "items: { label, href? }[]" },
      { prop: "a11y", values: "aria-label=Trilha de navegação · aria-current=page no último item · aria-hidden nos separadores" },
    ],
    usage: `import { Breadcrumb } from "@semec/ds-react";

<Breadcrumb items={[
  { label: "Início", href: "/" },
  { label: "Serviços", href: "/servicos" },
  { label: "IPTU" },
]} />`,
  },
  {
    code: "tabs",
    slug: "abas",
    label: "Abas",
    file: "src/components/tabs.tsx",
    category: "navegacao",
    desc: "Abas para alternar conteúdo na mesma tela. Gerenciamento de foco e roving tabindex via Radix.",
    variants: [
      { prop: "composição", values: "Tabs · TabsList · TabsTrigger · TabsContent" },
      { prop: "a11y", values: "role=tablist · role=tab · aria-selected · role=tabpanel · navegação teclado (setas)" },
    ],
    usage: `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@semec/ds-react";

<Tabs defaultValue="resumo">
  <TabsList>
    <TabsTrigger value="resumo">Resumo</TabsTrigger>
    <TabsTrigger value="debitos">Débitos</TabsTrigger>
  </TabsList>
  <TabsContent value="resumo">…</TabsContent>
  <TabsContent value="debitos">…</TabsContent>
</Tabs>`,
  },
  {
    code: "pagination",
    slug: "paginacao",
    label: "Paginação",
    file: "src/components/pagination.tsx",
    category: "navegacao",
    desc: "Controle de páginas com elipses (janela por `siblingCount`). Navegação por teclado completa.",
    variants: [
      { prop: "props", values: "page · pageCount · onPageChange · siblingCount" },
      { prop: "a11y", values: "role=navigation · aria-label=Paginação · aria-current=page · aria-label nos botões prev/next · aria-hidden nos elipses" },
    ],
    usage: `import { Pagination } from "@semec/ds-react";

<Pagination page={pagina} pageCount={42} onPageChange={setPagina} />`,
  },
  {
    code: "sidebar-trigger",
    slug: "gatilho-da-barra-lateral",
    label: "Gatilho da barra lateral",
    file: "src/components/sidebar-trigger.tsx",
    category: "navegacao",
    desc: "Botão para colapsar/expandir a sidebar. Alterna entre ícones PanelLeftOpen e PanelLeftClose.",
    variants: [
      { prop: "props", values: "open · onToggle · labelOpen · labelClosed" },
      { prop: "a11y", values: "aria-expanded · aria-label dinâmico (Abrir/Fechar menu)" },
    ],
    usage: `import { SidebarTrigger } from "@semec/ds-react";

<SidebarTrigger open={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} />`,
  },
  {
    code: "dialog",
    slug: "modal",
    label: "Modal",
    file: "src/components/dialog.tsx",
    category: "feedback",
    desc: "Diálogo modal acessível com overlay, header, título, descrição e footer.",
    variants: [{ prop: "composição", values: "Dialog · DialogTrigger · DialogContent · DialogHeader · DialogTitle · DialogDescription · DialogFooter · DialogClose" }],
    usage: `import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, Button } from "@semec/ds-react";

<Dialog>
  <DialogTrigger asChild><Button variant="destructive">Excluir</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Excluir requerimento?</DialogTitle>
      <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
    </DialogHeader>
    <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose></DialogFooter>
  </DialogContent>
</Dialog>`,
  },
  {
    code: "toast",
    slug: "notificacao",
    label: "Notificação",
    file: "src/components/toast.tsx",
    category: "feedback",
    desc: "Mensagem temporária com `useToast()` e viewport empilhável.",
    variants: [{ prop: "variant", values: "default · success · warning · destructive" }],
    usage: `import { ToastProvider, ToastViewport, useToast } from "@semec/ds-react";

function Acao() {
  const { toast } = useToast();
  return <Button onClick={() => toast({ variant: "success", title: "Protocolo enviado" })}>Enviar</Button>;
}

// no app: <ToastProvider><App /><ToastViewport /></ToastProvider>`,
  },
  {
    code: "tooltip",
    slug: "dica",
    label: "Dica",
    file: "src/components/tooltip.tsx",
    category: "feedback",
    desc: "Dica curta ao passar o ponteiro ou focar o elemento.",
    variants: [{ prop: "composição", values: "TooltipProvider · Tooltip · TooltipTrigger · TooltipContent" }],
    usage: `import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, IconButton } from "@semec/ds-react";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild><IconButton aria-label="Ajuda"><HelpCircle /></IconButton></TooltipTrigger>
    <TooltipContent>Explica o campo ao lado</TooltipContent>
  </Tooltip>
</TooltipProvider>`,
  },
  {
    code: "alert",
    slug: "aviso",
    label: "Aviso",
    file: "src/components/alert.tsx",
    category: "feedback",
    desc: "Mensagem de feedback em linha, com ícone automático por variante.",
    variants: [{ prop: "variant", values: "default · success · warning · destructive" }],
    usage: `import { Alert, AlertTitle, AlertDescription } from "@semec/ds-react";

<Alert variant="warning">
  <AlertTitle>Carnê indisponível</AlertTitle>
  <AlertDescription>O sistema volta às 14h.</AlertDescription>
</Alert>`,
  },
  {
    code: "accordion",
    slug: "acordeao",
    label: "Acordeão",
    file: "src/components/accordion.tsx",
    category: "conteudo-dados",
    desc: "Seções expansíveis. Um item abre por vez (`single`) ou vários (`multiple`).",
    variants: [
      { prop: "type", values: "single · multiple" },
      { prop: "composição", values: "Accordion · AccordionItem · AccordionTrigger · AccordionContent" },
    ],
    usage: `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@semec/ds-react";

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Pergunta frequente</AccordionTrigger>
    <AccordionContent>Resposta aqui.</AccordionContent>
  </AccordionItem>
</Accordion>`,
  },
  {
    code: "alert-dialog",
    slug: "dialogo-de-alerta",
    label: "Diálogo de alerta",
    file: "src/components/alert-dialog.tsx",
    category: "feedback",
    desc: "Confirmação perigosa. Força decisão (ação/cancelar) antes de prosseguir.",
    variants: [
      { prop: "composição", values: "AlertDialog · AlertDialogTrigger · AlertDialogContent · AlertDialogHeader · AlertDialogTitle · AlertDialogDescription · AlertDialogFooter · AlertDialogAction · AlertDialogCancel" },
    ],
    usage: `import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, Button } from "@semec/ds-react";

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Excluir</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir requerimento?</AlertDialogTitle>
      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction>Excluir</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
  },
  {
    code: "popover",
    slug: "popover",
    label: "Popover",
    file: "src/components/popover.tsx",
    category: "feedback",
    desc: "Camada flutuante ancorada a um elemento. Tooltips interativos, filtros, menus.",
    variants: [
      { prop: "composição", values: "Popover · PopoverTrigger · PopoverContent · PopoverAnchor" },
      { prop: "props", values: "sideOffset · align · side (top/right/bottom/left)" },
    ],
    usage: `import { Popover, PopoverTrigger, PopoverContent, Button } from "@semec/ds-react";

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Filtros</Button>
  </PopoverTrigger>
  <PopoverContent>
    <p>Opções de filtro aqui.</p>
  </PopoverContent>
</Popover>`,
  },
  {
    code: "separator",
    slug: "separador",
    label: "Separador",
    file: "src/components/separator.tsx",
    category: "conteudo-dados",
    desc: "Linha divisória visual. Horizontal ou vertical. Decorativo ou semântico.",
    variants: [
      { prop: "orientation", values: "horizontal · vertical" },
      { prop: "decorative", values: "true (role=none) · false (role=separator)" },
    ],
    usage: `import { Separator } from "@semec/ds-react";

<Separator />
<Separator orientation="vertical" className="h-6" />`,
  },
];

export const dsBySlug = Object.fromEntries(dsComponents.map((c) => [c.slug, c]));
export const dsByCategory = (key) => dsComponents.filter((c) => c.category === key);

export function dsPrompt(c) {
  const v = c.variants.map((x) => `${x.prop}: ${x.values}`).join(" · ");
  return `Crie um ${c.code} (${c.label}) usando @semec/ds-react (\`${c.file}\`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4.${v ? ` Variantes: ${v}.` : ""} ${c.desc}`;
}

/**
 * Estrutura de página — componentes de casca do portal (header, hero, controles,
 * service card, footer). São a base para os componentes que o kit vai criar e
 * entram no catálogo como categoria principal. Ainda não vivem em
 * `packages/react/src/components/`; o conteúdo canônico são as páginas estáticas
 * em `/componentes/<slug>`.
 */
export const dsPortal = {
  key: "estrutura",
  slug: "estrutura-de-pagina",
  label: "Estrutura de página",
  desc: "Casca do portal — base para os componentes que o kit vai criar.",
  items: [
    {
      slug: "header",
      label: "Header",
      href: "/componentes/header",
      desc: "Topo com marca, navegação e CTA.",
    },
    {
      slug: "hero",
      label: "Hero",
      href: "/componentes/hero",
      desc: "Bloco de abertura com eyebrow, título e métricas.",
    },
    {
      slug: "controles",
      label: "Barra de controles",
      href: "/componentes/controles",
      desc: "Tabs, busca e chips de filtro do catálogo.",
    },
    {
      slug: "service-card",
      label: "ServiceCard",
      href: "/componentes/service-card",
      desc: "Card de serviço com tag, selo e hover.",
    },
    {
      slug: "footer",
      label: "Footer",
      href: "/componentes/footer",
      desc: "Rodapé institucional com links e redes.",
    },
  ],
};
