/**
 * Manifesto dos componentes do design system (kit @semec/base, `base/`).
 * Fonte única: páginas de rota, índice, sidebar, snippets e prompts.
 * `file` é relativo à raiz do repo; a página lê o fonte real via fs.
 * `code` é o nome no código (usado no prompt); `label`/`slug` são PT.
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
    file: "base/components/button.tsx",
    category: "acoes",
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
    code: "icon-button",
    slug: "botao-de-icone",
    label: "Botão de ícone",
    file: "base/components/icon-button.tsx",
    category: "acoes",
    desc: "Botão quadrado só com ícone. Exige `aria-label`.",
    variants: [{ prop: "variant", values: "primary · secondary · outline · ghost · destructive · link" }],
    usage: `import { IconButton } from "@semec/base";
import { Plus } from "lucide-react";

<IconButton aria-label="Adicionar"><Plus /></IconButton>`,
  },
  {
    code: "link",
    slug: "link",
    label: "Link",
    file: "base/components/link.tsx",
    category: "acoes",
    desc: "Link tipográfico com variantes de cor.",
    variants: [{ prop: "variant", values: "primary · muted" }],
    usage: `import { Link } from "@semec/base";

<Link href="/pagina">Ir para a página</Link>
<Link href="/ajuda" variant="muted">Texto de ajuda</Link>`,
  },
  {
    code: "input",
    slug: "caixa-de-texto",
    label: "Caixa de texto",
    file: "base/components/input.tsx",
    category: "formularios",
    desc: "Campo de texto. Estado de erro via `aria-invalid`.",
    variants: [{ prop: "estados", values: "padrão · inválido (aria-invalid) · disabled" }],
    usage: `import { Input } from "@semec/base";

<Input placeholder="Nome completo" />
<Input aria-invalid="true" />`,
  },
  {
    code: "textarea",
    slug: "area-de-texto",
    label: "Área de texto",
    file: "base/components/textarea.tsx",
    category: "formularios",
    desc: "Campo multilinha com as mesmas variantes visuais do campo de texto.",
    variants: [{ prop: "estados", values: "padrão · inválido · disabled" }],
    usage: `import { Textarea } from "@semec/base";

<Textarea rows={4} placeholder="Descreva a demanda" />`,
  },
  {
    code: "select",
    slug: "menu-de-selecao",
    label: "Menu de seleção",
    file: "base/components/select.tsx",
    category: "formularios",
    desc: "Seleção fechada com gatilho, conteúdo e itens compostos.",
    variants: [{ prop: "composição", values: "Select · SelectTrigger · SelectValue · SelectContent · SelectItem" }],
    usage: `import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@semec/base";

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
    file: "base/components/combobox.tsx",
    category: "formularios",
    desc: "Campo com busca e lista filtrada. Opções via `options`.",
    variants: [{ prop: "props", values: "options · value · onChange · placeholder · emptyMessage · disabled" }],
    usage: `import { Combobox } from "@semec/base";

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
    file: "base/components/date-picker.tsx",
    category: "formularios",
    desc: 'Data com `<input type="date">` nativo — sem biblioteca de calendário.',
    variants: [{ prop: "props", values: "nativo HTML (min · max · disabled) + variantes visuais do campo" }],
    usage: `import { DatePicker } from "@semec/base";

<DatePicker defaultValue="2026-08-31" />`,
  },
  {
    code: "file-upload",
    slug: "envio-de-arquivos",
    label: "Envio de arquivos",
    file: "base/components/file-upload.tsx",
    category: "formularios",
    desc: "Área de arrastar-e-soltar com lista de arquivos, limite por tamanho e erro.",
    variants: [{ prop: "props", values: "accept · maxSize · label · hint · error · onChange" }],
    usage: `import { FileUpload } from "@semec/base";

<FileUpload accept=".pdf,image/*" maxSize={5 * 1024 * 1024} hint="PDF ou imagem, até 5 MB" />`,
  },
  {
    code: "checkbox",
    slug: "caixa-de-marcacao",
    label: "Caixa de marcação",
    file: "base/components/checkbox.tsx",
    category: "formularios",
    desc: "Caixa de marcação com estado indeterminado.",
    variants: [{ prop: "estados", values: "desmarcado · marcado (checked) · indeterminado · disabled" }],
    usage: `import { Checkbox, Label } from "@semec/base";

<div className="flex items-center gap-2">
  <Checkbox id="termos" />
  <Label htmlFor="termos">Aceito os termos</Label>
</div>`,
  },
  {
    code: "radio-group",
    slug: "botao-de-opcao",
    label: "Botão de opção",
    file: "base/components/radio-group.tsx",
    category: "formularios",
    desc: "Escolha única entre duas ou mais opções.",
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
    code: "switch",
    slug: "interruptor",
    label: "Interruptor",
    file: "base/components/switch.tsx",
    category: "formularios",
    desc: "Interruptor on/off para ativação imediata.",
    variants: [{ prop: "estados", values: "off · on (checked) · disabled · inválido" }],
    usage: `import { Switch, Label } from "@semec/base";

<div className="flex items-center gap-2">
  <Switch id="alertas" defaultChecked />
  <Label htmlFor="alertas">Receber alertas</Label>
</div>`,
  },
  {
    code: "label",
    slug: "rotulo",
    label: "Rótulo",
    file: "base/components/label.tsx",
    category: "formularios",
    desc: "Rótulo acessível vinculado ao campo.",
    variants: [],
    usage: `import { Label, Input } from "@semec/base";

<Label htmlFor="nome">Nome</Label>
<Input id="nome" />`,
  },
  {
    code: "form-field",
    slug: "campo-de-formulario",
    label: "Campo de formulário",
    file: "base/components/form-field.tsx",
    category: "formularios",
    desc: "Casaco do campo: label, obrigatório, dica e mensagem de erro na ordem certa.",
    variants: [{ prop: "props", values: "label · htmlFor · required · hint · error" }],
    usage: `import { FormField, Input } from "@semec/base";

<FormField label="E-mail" htmlFor="email" required hint="Usado para o comprovante" error="Informe um e-mail válido">
  <Input id="email" aria-invalid />
</FormField>`,
  },
  {
    code: "error-summary",
    slug: "error-summary",
    label: "ErrorSummary",
    file: "base/components/error-summary.tsx",
    category: "formularios",
    desc: "Resumo de erros de validação no topo do formulário, com links para cada campo. A11y: `role=\"alert\"`, foco automático.",
    variants: [{ prop: "props", values: "title · errors [{ id, message }] · autoFocus · focusKey" }],
    usage: `import { ErrorSummary } from "@semec/base";

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
    file: "base/components/card.tsx",
    category: "conteudo-dados",
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
    code: "badge",
    slug: "etiqueta",
    label: "Etiqueta",
    file: "base/components/badge.tsx",
    category: "conteudo-dados",
    desc: "Etiqueta curta de status ou contagem.",
    variants: [{ prop: "variant", values: "default · secondary · outline · success · warning · danger · info" }],
    usage: `import { Badge } from "@semec/base";

<Badge>Pendente</Badge>
<Badge variant="success">Deferido</Badge>
<Badge variant="danger">Indeferido</Badge>`,
  },
  {
    code: "table",
    slug: "tabela",
    label: "Tabela",
    file: "base/components/table.tsx",
    category: "conteudo-dados",
    desc: "Tabela de dados semântica com caption, header, body e footer.",
    variants: [{ prop: "composição", values: "Table · TableHeader · TableRow · TableHead · TableBody · TableCell · TableFooter · TableCaption" }],
    usage: `import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@semec/base";

<Table>
  <TableHeader><TableRow><TableHead>Serviço</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
  <TableBody><TableRow><TableCell>IPTU</TableCell><TableCell>Aberto</TableCell></TableRow></TableBody>
</Table>`,
  },
  {
    code: "skeleton",
    slug: "esqueleto",
    label: "Esqueleto",
    file: "base/components/skeleton.tsx",
    category: "feedback",
    desc: "Placeholder pulsante de carregamento.",
    variants: [],
    usage: `import { Skeleton } from "@semec/base";

<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-4 w-[180px]" />`,
  },
  {
    code: "empty-state",
    slug: "estado-vazio",
    label: "Estado vazio",
    file: "base/components/empty-state.tsx",
    category: "feedback",
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
    code: "breadcrumb",
    slug: "trilha-de-navegacao",
    label: "Trilha de navegação",
    file: "base/components/breadcrumb.tsx",
    category: "navegacao",
    desc: "Trilha com o item atual marcado (`current`).",
    variants: [{ prop: "props", values: "items: { label, href?, current? }[]" }],
    usage: `import { Breadcrumb } from "@semec/base";

<Breadcrumb items={[
  { label: "Início", href: "/" },
  { label: "Serviços", href: "/servicos" },
  { label: "IPTU", current: true },
]} />`,
  },
  {
    code: "tabs",
    slug: "abas",
    label: "Abas",
    file: "base/components/tabs.tsx",
    category: "navegacao",
    desc: "Abas para alternar conteúdo na mesma tela.",
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
    code: "pagination",
    slug: "paginacao",
    label: "Paginação",
    file: "base/components/pagination.tsx",
    category: "navegacao",
    desc: "Controle de páginas com elipses (janela por `siblingCount`).",
    variants: [{ prop: "props", values: "page · pageCount · onPageChange · siblingCount" }],
    usage: `import { Pagination } from "@semec/base";

<Pagination page={pagina} pageCount={42} onPageChange={setPagina} />`,
  },
  {
    code: "dialog",
    slug: "modal",
    label: "Modal",
    file: "base/components/dialog.tsx",
    category: "feedback",
    desc: "Diálogo modal acessível com overlay, header, título, descrição e footer.",
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
    code: "toast",
    slug: "notificacao",
    label: "Notificação",
    file: "base/components/toast.tsx",
    category: "feedback",
    desc: "Mensagem temporária com `useToast()` e viewport empilhável.",
    variants: [{ prop: "variant", values: "default · success · warning · destructive" }],
    usage: `import { ToastProvider, ToastViewport, useToast } from "@semec/base";

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
    file: "base/components/tooltip.tsx",
    category: "feedback",
    desc: "Dica curta ao passar o ponteiro ou focar o elemento.",
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
    code: "alert",
    slug: "aviso",
    label: "Aviso",
    file: "base/components/alert.tsx",
    category: "feedback",
    desc: "Mensagem de feedback em linha, com ícone automático por variante.",
    variants: [{ prop: "variant", values: "default · success · warning · destructive" }],
    usage: `import { Alert, AlertTitle, AlertDescription } from "@semec/base";

<Alert variant="warning">
  <AlertTitle>Carnê indisponível</AlertTitle>
  <AlertDescription>O sistema volta às 14h.</AlertDescription>
</Alert>`,
  },
];

export const dsBySlug = Object.fromEntries(dsComponents.map((c) => [c.slug, c]));
export const dsByCategory = (key) => dsComponents.filter((c) => c.category === key);

export function dsPrompt(c) {
  const v = c.variants.map((x) => `${x.prop}: ${x.values}`).join(" · ");
  return `Crie um ${c.code} (${c.label}) usando @semec/base (\`${c.file}\`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4.${v ? ` Variantes: ${v}.` : ""} ${c.desc}`;
}
