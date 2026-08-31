/**
 * Manifesto da vitrine proto `@semec/base`.
 * Fonte de verdade para: índice, rotas [slug], prompts e snippets de uso.
 * `file` é relativo à raiz do repo; a página lê o fonte real via fs.
 */

export const protoCategories = [
  { key: "formulario", label: "Formulário" },
  { key: "layout-dados", label: "Layout e dados" },
  { key: "navegacao", label: "Navegação" },
  { key: "overlay-feedback", label: "Overlay e feedback" },
];

export const protoComponents = [
  {
    slug: "button",
    label: "Button",
    file: "base/components/button.tsx",
    category: "formulario",
    desc: "Ação principal. Seis variantes e quatro tamanhos; `asChild` transforma o botão num link.",
    variants: [
      { prop: "variant", values: "primary · secondary · outline · ghost · destructive · link" },
      { prop: "size", values: "sm · md · lg · icon" },
    ],
    usage: `import { Button } from "@semec/base";

<Button variant="primary" size="md">Salvar</Button>
<Button variant="outline">Cancelar</Button>
<Button asChild><Link href="/ok">Como link</Link></Button>`,
  },
  {
    slug: "icon-button",
    label: "IconButton",
    file: "base/components/icon-button.tsx",
    category: "formulario",
    desc: "Botão quadrado só com ícone. Exige `aria-label`.",
    variants: [{ prop: "variant", values: "primary · secondary · outline · ghost · destructive · link" }],
    usage: `import { IconButton } from "@semec/base";
import { Plus } from "lucide-react";

<IconButton aria-label="Adicionar"><Plus /></IconButton>`,
  },
  {
    slug: "link",
    label: "Link",
    file: "base/components/link.tsx",
    category: "formulario",
    desc: "Link tipográfico com variantes de cor.",
    variants: [{ prop: "variant", values: "primary · muted" }],
    usage: `import { Link } from "@semec/base";

<Link href="/pagina">Ir para a página</Link>
<Link href="/ajuda" variant="muted">Texto de ajuda</Link>`,
  },
  {
    slug: "input",
    label: "Input",
    file: "base/components/input.tsx",
    category: "formulario",
    desc: "Campo de texto. Estado de erro via `aria-invalid`.",
    variants: [{ prop: "estados", values: "padrão · inválido (aria-invalid) · disabled" }],
    usage: `import { Input } from "@semec/base";

<Input placeholder="Nome completo" />
<Input aria-invalid="true" />`,
  },
  {
    slug: "textarea",
    label: "Textarea",
    file: "base/components/textarea.tsx",
    category: "formulario",
    desc: "Campo multilinha com as mesmas variantes visuais do Input.",
    variants: [{ prop: "estados", values: "padrão · inválido · disabled" }],
    usage: `import { Textarea } from "@semec/base";

<Textarea rows={4} placeholder="Descreva a demanda" />`,
  },
  {
    slug: "select",
    label: "Select",
    file: "base/components/select.tsx",
    category: "formulario",
    desc: "Seleção fechada (Radix Select) com gatilho, conteúdo e itens compostos.",
    variants: [{ prop: "composição", values: "Select · SelectTrigger · SelectValue · SelectContent · SelectItem" }],
    usage: `import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@semec/base";

<Select defaultValue="pbh">
  <SelectTrigger aria-label="UF"><SelectValue placeholder="UF" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="pbh">Porto Velho</SelectItem>
    <SelectItem value="riob">Rio Branco</SelectItem>
  </SelectContent>
</Select>`,
  },
  {
    slug: "combobox",
    label: "Combobox",
    file: "base/components/combobox.tsx",
    category: "formulario",
    desc: "Campo com busca e lista filtrada (Popover + filtro). Opções via `options`.",
    variants: [{ prop: "props", values: "options · value · onChange · placeholder · emptyMessage · disabled" }],
    usage: `import { Combobox } from "@semec/base";

<Combobox
  options={[{ value: "cnpj", label: "CNPJ" }, { value: "cpf", label: "CPF" }]}
  value={valor}
  onChange={setValor}
/>`,
  },
  {
    slug: "date-picker",
    label: "DatePicker",
    file: "base/components/date-picker.tsx",
    category: "formulario",
    desc: 'Data com `<input type="date">` nativo — sem biblioteca de calendário.',
    variants: [{ prop: "props", values: "nativo HTML (min · max · disabled) + variantes do Input" }],
    usage: `import { DatePicker } from "@semec/base";

<DatePicker defaultValue="2026-08-31" />`,
  },
  {
    slug: "file-upload",
    label: "FileUpload",
    file: "base/components/file-upload.tsx",
    category: "formulario",
    desc: "Área de arrastar-e-soltar com lista de arquivos, limite por tamanho e erro.",
    variants: [{ prop: "props", values: "accept · maxSize · label · hint · error · onChange" }],
    usage: `import { FileUpload } from "@semec/base";

<FileUpload accept=".pdf,image/*" maxSize={5 * 1024 * 1024} hint="PDF ou imagem, até 5 MB" />`,
  },
  {
    slug: "checkbox",
    label: "Checkbox",
    file: "base/components/checkbox.tsx",
    category: "formulario",
    desc: "Caixa de marcação (Radix), com estado indeterminado.",
    variants: [{ prop: "estados", values: "desmarcado · marcado (checked) · indeterminado · disabled" }],
    usage: `import { Checkbox, Label } from "@semec/base";

<div className="flex items-center gap-2">
  <Checkbox id="termos" />
  <Label htmlFor="termos">Aceito os termos</Label>
</div>`,
  },
  {
    slug: "radio-group",
    label: "RadioGroup",
    file: "base/components/radio-group.tsx",
    category: "formulario",
    desc: "Escolha única vertical (Radix).",
    variants: [{ prop: "composição", values: "RadioGroup · RadioGroupItem + Label" }],
    usage: `import { RadioGroup, RadioGroupItem, Label } from "@semec/base";

<RadioGroup defaultValue="pessoa-fisica">
  <div className="flex items-center gap-2">
    <RadioGroupItem value="pessoa-fisica" id="pf" />
    <Label htmlFor="pf">Pessoa física</Label>
  </div>
</RadioGroup>`,
  },
  {
    slug: "switch",
    label: "Switch",
    file: "base/components/switch.tsx",
    category: "formulario",
    desc: "Interruptor on/off (Radix).",
    variants: [{ prop: "estados", values: "off · on (checked) · disabled · inválido" }],
    usage: `import { Switch, Label } from "@semec/base";

<div className="flex items-center gap-2">
  <Switch id="alertas" defaultChecked />
  <Label htmlFor="alertas">Receber alertas</Label>
</div>`,
  },
  {
    slug: "label",
    label: "Label",
    file: "base/components/label.tsx",
    category: "formulario",
    desc: "Rótulo acessível (Radix Label).",
    variants: [],
    usage: `import { Label, Input } from "@semec/base";

<Label htmlFor="nome">Nome</Label>
<Input id="nome" />`,
  },
  {
    slug: "form-field",
    label: "FormField",
    file: "base/components/form-field.tsx",
    category: "formulario",
    desc: "Casaco do campo: label, obrigatório, dica e mensagem de erro na ordem certa.",
    variants: [{ prop: "props", values: "label · htmlFor · required · hint · error" }],
    usage: `import { FormField, Input } from "@semec/base";

<FormField label="E-mail" htmlFor="email" required hint="Usado para o comprovante" error="Informe um e-mail válido">
  <Input id="email" aria-invalid />
</FormField>`,
  },
  {
    slug: "card",
    label: "Card",
    file: "base/components/card.tsx",
    category: "layout-dados",
    desc: "Superfície de conteúdo com header, corpo e footer.",
    variants: [{ prop: "composição", values: "Card · CardHeader · CardTitle · CardDescription · CardContent · CardFooter" }],
    usage: `import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from "@semec/base";

<Card>
  <CardHeader><CardTitle>IPTU 2026</CardTitle></CardHeader>
  <CardContent>Parcela em dia.</CardContent>
  <CardFooter><Button>Emitir boleto</Button></CardFooter>
</Card>`,
  },
  {
    slug: "badge",
    label: "Badge",
    file: "base/components/badge.tsx",
    category: "layout-dados",
    desc: "Etiqueta curta de status ou contagem.",
    variants: [{ prop: "variant", values: "default · secondary · outline · success · warning · danger · info" }],
    usage: `import { Badge } from "@semec/base";

<Badge>Pendente</Badge>
<Badge variant="success">Deferido</Badge>
<Badge variant="danger">Indeferido</Badge>`,
  },
  {
    slug: "table",
    label: "Table",
    file: "base/components/table.tsx",
    category: "layout-dados",
    desc: "Tabela de dados semântica com caption, header, body e footer.",
    variants: [{ prop: "composição", values: "Table · TableHeader · TableRow · TableHead · TableBody · TableCell · TableFooter · TableCaption" }],
    usage: `import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@semec/base";

<Table>
  <TableHeader><TableRow><TableHead>Serviço</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
  <TableBody><TableRow><TableCell>IPTU</TableCell><TableCell>Aberto</TableCell></TableRow></TableBody>
</Table>`,
  },
  {
    slug: "skeleton",
    label: "Skeleton",
    file: "base/components/skeleton.tsx",
    category: "layout-dados",
    desc: "Placeholder pulsante de carregamento.",
    variants: [],
    usage: `import { Skeleton } from "@semec/base";

<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-4 w-[180px]" />`,
  },
  {
    slug: "empty-state",
    label: "EmptyState",
    file: "base/components/empty-state.tsx",
    category: "layout-dados",
    desc: "Estado vazio com ícone, título, descrição e ação opcional.",
    variants: [{ prop: "props", values: "icon · title · description · action" }],
    usage: `import { EmptyState, Button } from "@semec/base";
import { Inbox } from "lucide-react";

<EmptyState
  icon={<Inbox />}
  title="Nenhum protocolo encontrado"
  description="Ajuste os filtros ou abra um novo requerimento."
  action={<Button>Abrir requerimento</Button>}
/>`,
  },
  {
    slug: "breadcrumb",
    label: "Breadcrumb",
    file: "base/components/breadcrumb.tsx",
    category: "navegacao",
    desc: "Trilha de navegação com último item marcado (`current`).",
    variants: [{ prop: "props", values: "items: { label, href?, current? }[]" }],
    usage: `import { Breadcrumb } from "@semec/base";

<Breadcrumb items={[
  { label: "Início", href: "/" },
  { label: "Serviços", href: "/servicos" },
  { label: "IPTU", current: true },
]} />`,
  },
  {
    slug: "tabs",
    label: "Tabs",
    file: "base/components/tabs.tsx",
    category: "navegacao",
    desc: "Abas (Radix) para alternar conteúdo na mesma tela.",
    variants: [{ prop: "composição", values: "Tabs · TabsList · TabsTrigger · TabsContent" }],
    usage: `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@semec/base";

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
    slug: "pagination",
    label: "Pagination",
    file: "base/components/pagination.tsx",
    category: "navegacao",
    desc: "Controle de páginas com elipses (janela por `siblingCount`).",
    variants: [{ prop: "props", values: "page · pageCount · onPageChange · siblingCount" }],
    usage: `import { Pagination } from "@semec/base";

<Pagination page={pagina} pageCount={42} onPageChange={setPagina} />`,
  },
  {
    slug: "dialog",
    label: "Dialog",
    file: "base/components/dialog.tsx",
    category: "overlay-feedback",
    desc: "Modal acessível (Radix) com overlay, header, título, descrição e footer.",
    variants: [{ prop: "composição", values: "Dialog · DialogTrigger · DialogContent · DialogHeader · DialogTitle · DialogDescription · DialogFooter · DialogClose" }],
    usage: `import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, Button } from "@semec/base";

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
    slug: "toast",
    label: "Toast",
    file: "base/components/toast.tsx",
    category: "overlay-feedback",
    desc: "Notificação temporária com `useToast()` e viewport empilhável.",
    variants: [{ prop: "variant", values: "default · success · warning · destructive" }],
    usage: `import { ToastProvider, ToastViewport, useToast } from "@semec/base";

function Acao() {
  const { toast } = useToast();
  return <Button onClick={() => toast({ variant: "success", title: "Protocolo enviado" })}>Enviar</Button>;
}

// no app: <ToastProvider><App /><ToastViewport /></ToastProvider>`,
  },
  {
    slug: "tooltip",
    label: "Tooltip",
    file: "base/components/tooltip.tsx",
    category: "overlay-feedback",
    desc: "Dica curta ao passar o foco/ponteiro (Radix).",
    variants: [{ prop: "composição", values: "TooltipProvider · Tooltip · TooltipTrigger · TooltipContent" }],
    usage: `import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, IconButton } from "@semec/base";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild><IconButton aria-label="Ajuda"><HelpCircle /></IconButton></TooltipTrigger>
    <TooltipContent>Explica o campo ao lado</TooltipContent>
  </Tooltip>
</TooltipProvider>`,
  },
  {
    slug: "alert",
    label: "Alert",
    file: "base/components/alert.tsx",
    category: "overlay-feedback",
    desc: "Mensagem de feedback em linha, com ícone automático por variante.",
    variants: [{ prop: "variant", values: "default · success · warning · destructive" }],
    usage: `import { Alert, AlertTitle, AlertDescription } from "@semec/base";

<Alert variant="warning">
  <AlertTitle>Carnê indisponível</AlertTitle>
  <AlertDescription>O sistema volta às 14h.</AlertDescription>
</Alert>`,
  },
];

export const protoBySlug = Object.fromEntries(protoComponents.map((c) => [c.slug, c]));

export function protoPrompt(c) {
  const v = c.variants.map((x) => `${x.prop}: ${x.values}`).join(" · ");
  return `Crie um ${c.label} usando @semec/base (\`${c.file}\`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4.${v ? ` Variantes: ${v}.` : ""} ${c.desc}`;
}
