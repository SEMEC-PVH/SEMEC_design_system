"use client";

import { useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Combobox,
  DatePicker,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  FileUpload,
  FormField,
  IconButton,
  Input,
  Label,
  Link,
  Pagination,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useToast,
} from "@semec/ds/react";
import { Bell, Download, HelpCircle, Inbox, Plus, Printer, Search, Trash2 } from "lucide-react";
import PreviewFrame from "@/components/docs/PreviewFrame";

const ROW = "flex flex-wrap items-center gap-3";

function ButtonPreview() {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Hierarquia de ação</p>
        <div className={ROW}>
          <Button variant="primary">Emitir boleto</Button>
          <Button variant="outline">Salvar rascunho</Button>
          <Button variant="ghost">Cancelar</Button>
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Ação destrutiva</p>
        <div className={ROW}>
          <Button variant="destructive">Excluir requerimento</Button>
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Com ícone</p>
        <div className={ROW}>
          <Button><Plus /> Adicionar serviço</Button>
          <Button variant="outline"><Download /> Baixar carnê</Button>
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Tamanhos</p>
        <div className={ROW}>
          <Button size="sm">Pequeno</Button>
          <Button size="md">Médio</Button>
          <Button size="lg">Grande</Button>
          <Button disabled>Enviando…</Button>
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Botão como link</p>
        <div className={ROW}>
          <Button asChild><a href="#proto">Ver meu IPTU</a></Button>
        </div>
      </div>
    </div>
  );
}

function IconButtonPreview() {
  return (
    <div className={ROW}>
      <IconButton label="Adicionar serviço" variant="primary"><Plus /></IconButton>
      <IconButton label="Buscar requerimento"><Search /></IconButton>
      <IconButton label="Baixar carnê"><Download /></IconButton>
      <IconButton label="Imprimir comprovante" variant="ghost"><Printer /></IconButton>
      <IconButton label="Notificações" variant="secondary"><Bell /></IconButton>
      <IconButton label="Excluir requerimento" variant="destructive"><Trash2 /></IconButton>
    </div>
  );
}

function LinkPreview() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground">
        Consulte a <Link href="#proto">guia do IPTU 2026</Link> e{" "}
        <Link href="#proto" variant="muted">saiba mais sobre prazos de contestação</Link>.
      </p>
      <div className={ROW}>
        <Link href="#proto">Acessar serviços</Link>
        <Link href="#proto" variant="onSurface">Acompanhar protocolo</Link>
        <Link href="#proto" variant="muted">Voltar ao topo</Link>
      </div>
    </div>
  );
}

function InputPreview() {
  return (
    <div className="flex max-w-sm flex-col gap-3">
      <Input placeholder="Nome completo" />
      <div>
        <Input aria-invalid="true" defaultValue="email errado" />
        <p className="mt-1 text-xs text-destructive">Informe um e-mail válido.</p>
      </div>
      <Input placeholder="Disabled" disabled />
    </div>
  );
}

function TextareaPreview() {
  return (
    <div className="flex max-w-md flex-col gap-3">
      <Textarea rows={3} placeholder="Descreva a demanda" />
      <Textarea rows={3} aria-invalid="true" disabled placeholder="Disabled" />
    </div>
  );
}

function SelectPreview() {
  return (
    <Select defaultValue="pbh">
      <SelectTrigger className="w-48" aria-label="Município">
        <SelectValue placeholder="Município" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pbh">Porto Velho</SelectItem>
        <SelectItem value="riob">Rio Branco</SelectItem>
        <SelectItem value="cv">Cruzeiro do Sul</SelectItem>
      </SelectContent>
    </Select>
  );
}

function ComboboxPreview() {
  const [value, setValue] = useState("cnpj");
  return (
    <div className="w-64">
      <Combobox
        ariaLabel="Tipo de cadastro"
        options={[
          { value: "cnpj", label: "CNPJ" },
          { value: "cpf", label: "CPF" },
          { value: "os", label: "Ordem bancária" },
        ]}
        value={value}
        onChange={setValue}
      />
      <p className="mt-2 text-xs text-muted-foreground">Selecionado: {value || "—"}</p>
    </div>
  );
}

function DatePickerPreview() {
  return (
    <div className="w-56">
      <DatePicker defaultValue="2026-08-31" />
    </div>
  );
}

function FileUploadPreview() {
  return (
    <div className="max-w-md">
      <FileUpload accept=".pdf,image/*" maxSize={5 * 1024 * 1024} label="Comprovante" hint="PDF ou imagem, até 5 MB" />
    </div>
  );
}

function CheckboxPreview() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="p-termos" defaultChecked />
        <Label htmlFor="p-termos">Aceito os termos de uso</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="p-ind" checked="indeterminate" />
        <Label htmlFor="p-ind">Indeterminado</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="p-dis" disabled />
        <Label htmlFor="p-dis" className="opacity-50">Disabled</Label>
      </div>
    </div>
  );
}

function RadioGroupPreview() {
  return (
    <RadioGroup defaultValue="pf" className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="pf" id="p-pf" />
        <Label htmlFor="p-pf">Pessoa física</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="pj" id="p-pj" />
        <Label htmlFor="p-pj">Pessoa jurídica</Label>
      </div>
    </RadioGroup>
  );
}

function SwitchPreview() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Switch id="p-on" defaultChecked />
        <Label htmlFor="p-on">Receber alertas (on)</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="p-off" />
        <Label htmlFor="p-off">Off</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="p-dis" disabled />
        <Label htmlFor="p-dis">Disabled</Label>
      </div>
    </div>
  );
}

function LabelPreview() {
  return (
    <div className="flex max-w-xs flex-col gap-1.5">
      <Label htmlFor="p-nome">Nome do contribuinte</Label>
      <Input id="p-nome" placeholder="Digite o nome" />
    </div>
  );
}

function FormFieldPreview() {
  return (
    <div className="flex max-w-xs flex-col gap-5">
      <FormField label="E-mail" htmlFor="p-email" required hint="Usado para enviar o comprovante">
        <Input id="p-email" type="email" />
      </FormField>
      <FormField label="Telefone" htmlFor="p-tel" error="Formato inválido. Use (RO) 90000-0000.">
        <Input id="p-tel" aria-invalid="true" defaultValue="123" />
      </FormField>
    </div>
  );
}

function CardPreview() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>IPTU 2026</CardTitle>
        <p className="text-sm text-muted-foreground">Parcela única em dia.</p>
      </CardHeader>
      <CardContent>Carnê disponível para impressão até 30/09.</CardContent>
      <CardFooter><Button>Emitir boleto</Button></CardFooter>
    </Card>
  );
}

function BadgePreview() {
  return (
    <div className={ROW}>
      <Badge>default</Badge>
      <Badge variant="secondary">secondary</Badge>
      <Badge variant="outline">outline</Badge>
      <Badge variant="success">success</Badge>
      <Badge variant="warning">warning</Badge>
      <Badge variant="danger">danger</Badge>
      <Badge variant="info">info</Badge>
    </div>
  );
}

function TablePreview() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Serviço</TableHead>
          <TableHead>Protocolo</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>IPTU</TableCell>
          <TableCell>2026.001</TableCell>
          <TableCell><Badge variant="success">Deferido</Badge></TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Alvará</TableCell>
          <TableCell>2026.002</TableCell>
          <TableCell><Badge variant="warning">Em análise</Badge></TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

function SkeletonPreview() {
  return (
    <div className="flex max-w-sm space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[220px]" />
        <Skeleton className="h-4 w-[160px]" />
      </div>
    </div>
  );
}

function EmptyStatePreview() {
  return (
    <EmptyState
      icon={<Inbox />}
      title="Nenhum protocolo encontrado"
      description="Ajuste os filtros ou abra um novo requerimento."
      action={<Button>Abrir requerimento</Button>}
    />
  );
}

function BreadcrumbPreview() {
  return (
    <Breadcrumb
      items={[
        { label: "Início", href: "#proto" },
        { label: "Serviços", href: "#proto" },
        { label: "IPTU", current: true },
      ]}
    />
  );
}

function TabsPreview() {
  return (
    <Tabs defaultValue="resumo">
      <TabsList>
        <TabsTrigger value="resumo">Resumo</TabsTrigger>
        <TabsTrigger value="debitos">Débitos</TabsTrigger>
      </TabsList>
      <TabsContent value="resumo">Nada em aberto neste exercício.</TabsContent>
      <TabsContent value="debitos">2 parcelas vencidas em julho.</TabsContent>
    </Tabs>
  );
}

function PaginationPreview() {
  const [page, setPage] = useState(7);
  return (
    <div className="space-y-2">
      <Pagination page={page} pageCount={24} onPageChange={setPage} />
      <p className="text-xs text-muted-foreground">Página atual: {page} de 24</p>
    </div>
  );
}

function DialogPreview() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Excluir requerimento</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir requerimento 2026.042?</DialogTitle>
          <DialogDescription>Esta ação não pode ser desfeita. Os anexos também serão removidos.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <DialogClose asChild><Button variant="destructive">Excluir</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ToastDemo() {
  const { toasts, toast } = useToast();
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => toast({ title: "Salvo com sucesso" })}>
          default
        </Button>
        <Button variant="outline" onClick={() => toast({ variant: "success", title: "Protocolo enviado", description: "Guarde o número 2026.123." })}>
          success
        </Button>
        <Button variant="outline" onClick={() => toast({ variant: "warning", title: "Sessão expira em 2 min" })}>
          warning
        </Button>
        <Button variant="outline" onClick={() => toast({ variant: "destructive", title: "Falha ao anexar arquivo" })}>
          destructive
        </Button>
      </div>
      {toasts.map(({ id, title, description, variant, ...rest }) => (
        <Toast key={id} variant={variant} {...rest}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastAction altText="Desfazer">Desfazer</ToastAction>
          <ToastClose />
        </Toast>
      ))}
    </>
  );
}

function ToastPreview() {
  return (
    <ToastProvider>
      <ToastDemo />
      <ToastViewport />
    </ToastProvider>
  );
}

function TooltipPreview() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <IconButton aria-label="Ajuda" variant="outline"><HelpCircle /></IconButton>
        </TooltipTrigger>
        <TooltipContent>Explica o campo ao lado.</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function AlertPreview() {
  return (
    <div className="flex flex-col gap-3">
      <Alert>
        <AlertTitle>Aviso informativo</AlertTitle>
        <AlertDescription>Atendimento presencial apenas com agendamento.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <AlertTitle>Envio confirmado</AlertTitle>
        <AlertDescription>Protocolo 2026.042 registrado.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertTitle>Carnê indisponível</AlertTitle>
        <AlertDescription>O sistema volta às 14h.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTitle>Pagamento rejeitado</AlertTitle>
        <AlertDescription>Verifique os dados da conta e tente novamente.</AlertDescription>
      </Alert>
    </div>
  );
}

const PREVIEWS = {
  button: ButtonPreview,
  "icon-button": IconButtonPreview,
  link: LinkPreview,
  input: InputPreview,
  textarea: TextareaPreview,
  select: SelectPreview,
  combobox: ComboboxPreview,
  "date-picker": DatePickerPreview,
  "file-upload": FileUploadPreview,
  checkbox: CheckboxPreview,
  "radio-group": RadioGroupPreview,
  switch: SwitchPreview,
  label: LabelPreview,
  "form-field": FormFieldPreview,
  card: CardPreview,
  badge: BadgePreview,
  table: TablePreview,
  skeleton: SkeletonPreview,
  "empty-state": EmptyStatePreview,
  breadcrumb: BreadcrumbPreview,
  tabs: TabsPreview,
  pagination: PaginationPreview,
  dialog: DialogPreview,
  toast: ToastPreview,
  tooltip: TooltipPreview,
  alert: AlertPreview,
};

export default function BasePreview({ slug }) {
  const Preview = PREVIEWS[slug];
  if (!Preview) return <p className="text-sm text-muted-foreground">Preview indisponível.</p>;
  return (
    <PreviewFrame>
      <div style={{ padding: "1.5rem" }}>
        <Preview />
      </div>
    </PreviewFrame>
  );
}
