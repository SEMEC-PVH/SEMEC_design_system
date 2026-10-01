"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Breadcrumb,
  Button,
  Calendar,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Combobox,
  DataTable,
  DatePicker,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  ErrorSummary,
  FileUpload,
  FormField,
  Header,
  HeaderBrand,
  HeaderNav,
  HeaderNavLink,
  IconButton,
  Input,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Label,
  Link,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  Pagination,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  RadioGroup,
  RadioGroupItem,
  ScrollArea,
  ScrollBar,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarToggleButton,
  Skeleton,
  Slider,
  Spinner,
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
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  Toggle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useToast,
} from "semec-ds/react";
import { Bell, Download, HelpCircle, Inbox, MoreHorizontal, Plus, Printer, Search, Trash2 } from "lucide-react";
import PreviewFrame, { usePreviewPortalContainer } from "@/components/docs/PreviewFrame";

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
  const portalContainer = usePreviewPortalContainer();
  return (
    <div className="w-64">
      <Combobox
        ariaLabel="Tipo de cadastro"
        portalContainer={portalContainer}
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

function AccordionPreview() {
  return (
    <div className="w-full max-w-sm">
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>Como emitir o IPTU?</AccordionTrigger>
          <AccordionContent>
            Acesse o portal, informe o número do contribuinte e clique em &quot;Emitir carnê&quot;.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Prazo de pagamento</AccordionTrigger>
          <AccordionContent>
            O carnê pode ser pago até 31 de outubro sem juros.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function PopoverPreview() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Abrir popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm">Conteúdo do popover com informações adicionais.</p>
      </PopoverContent>
    </Popover>
  );
}

function SeparatorPreview() {
  return (
    <div className="w-full max-w-sm space-y-4">
      <p className="text-sm text-muted-foreground">Seção acima</p>
      <Separator />
      <p className="text-sm text-muted-foreground">Seção abaixo</p>
      <Separator orientation="vertical" className="h-16 mx-auto" />
    </div>
  );
}

function AvatarPreview() {
  return (
    <div className={ROW}>
      <Avatar>
        <AvatarFallback>PV</AvatarFallback>
      </Avatar>
      <Avatar className="h-12 w-12">
        <AvatarFallback>PB</AvatarFallback>
      </Avatar>
      <Avatar className="h-16 w-16">
        <AvatarFallback>CV</AvatarFallback>
      </Avatar>
    </div>
  );
}

function TogglePreview() {
  return (
    <div className={ROW}>
      <Toggle>Padrão</Toggle>
      <Toggle variant="outline">Outline</Toggle>
      <Toggle size="sm">Pequeno</Toggle>
      <Toggle size="lg">Grande</Toggle>
      <Toggle disabled>Desabilitado</Toggle>
    </div>
  );
}

function SpinnerPreview() {
  return (
    <div className={ROW}>
      <Spinner />
      <Spinner className="h-6 w-6" />
      <Spinner className="h-8 w-8" />
    </div>
  );
}

function ProgressPreview() {
  const [value, setValue] = useState(45);
  return (
    <div className="w-full max-w-sm space-y-3">
      <Progress value={value} />
      <div className={ROW}>
        <Button variant="outline" size="sm" onClick={() => setValue((v) => Math.max(0, v - 10))}>-10</Button>
        <span className="text-sm text-muted-foreground">{value}%</span>
        <Button variant="outline" size="sm" onClick={() => setValue((v) => Math.min(100, v + 10))}>+10</Button>
      </div>
    </div>
  );
}

function SliderPreview() {
  const [value, setValue] = useState(50);
  return (
    <div className="w-full max-w-sm space-y-3">
      <Slider value={[value]} onValueChange={(v) => setValue(v[0])} max={100} />
      <p className="text-sm text-muted-foreground">Valor: {value}</p>
    </div>
  );
}

function InputOTPPreview() {
  const [value, setValue] = useState("482915");
  return (
    <div className="w-full max-w-sm space-y-4 text-left">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Código de verificação</p>
        <InputOTP value={value} onChange={setValue} maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        <p className="text-xs text-muted-foreground">
          Valor: {value || "—"} ({value.length}/6)
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Desabilitado</p>
        <InputOTP value="000000" disabled maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>
    </div>
  );
}

function CalendarPreview() {
  return <Calendar />;
}

function ScrollAreaPreview() {
  return (
    <ScrollArea className="h-40 w-48 rounded-md border">
      <div className="p-4">
        <h4 className="text-sm font-medium mb-2">Itens</h4>
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i} className="text-sm py-1">Item {i + 1}</p>
        ))}
      </div>
      <ScrollBar />
    </ScrollArea>
  );
}

function TimelinePreview() {
  return (
    <Timeline>
      <TimelineItem>
        <TimelineSeparator>
          <TimelineDot variant="success" />
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          <TimelineTitle>Requerimento aberto</TimelineTitle>
          <TimelineDescription>01/08/2026</TimelineDescription>
        </TimelineContent>
      </TimelineItem>
      <TimelineItem>
        <TimelineSeparator>
          <TimelineDot variant="default" />
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          <TimelineTitle>Em análise</TimelineTitle>
          <TimelineDescription>05/08/2026</TimelineDescription>
        </TimelineContent>
      </TimelineItem>
      <TimelineItem>
        <TimelineSeparator>
          <TimelineDot variant="info" />
        </TimelineSeparator>
        <TimelineContent>
          <TimelineTitle>Deferido</TimelineTitle>
          <TimelineDescription>10/08/2026</TimelineDescription>
        </TimelineContent>
      </TimelineItem>
    </Timeline>
  );
}

function NavigationMenuPreview() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Serviços</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="#proto">IPTU</NavigationMenuLink>
            <NavigationMenuLink href="#proto">Alvará</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Atendimento</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="#proto">Agendamento</NavigationMenuLink>
            <NavigationMenuLink href="#proto">Ouvidoria</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function SidebarPreview() {
  return (
    <div className="flex h-48 overflow-hidden rounded-md border">
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Início</SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>Serviços</SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>Configurações</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </div>
  );
}

function HeaderPreview() {
  return (
    <div className="w-full">
      <Header>
        <HeaderBrand orgName="SEMEC" serviceName="Nome do serviço" href="#proto" />
        <div className="flex items-center gap-2">
          <HeaderNav>
            <HeaderNavLink href="#proto" current>
              Prefeitura
            </HeaderNavLink>
            <HeaderNavLink href="#proto">Serviços</HeaderNavLink>
          </HeaderNav>
          <Button asChild size="sm">
            <a href="#proto">Fale Conosco</a>
          </Button>
        </div>
      </Header>
    </div>
  );
}

function SheetPreview() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Abrir filtros</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription>Refine sua busca.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 p-6">
          <div>
            <p className="mb-2 text-sm font-medium">Status</p>
            <div className="flex items-center gap-2 text-sm">
              <Checkbox id="sh-pendente" defaultChecked />
              <Label htmlFor="sh-pendente">Pendente</Label>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Checkbox id="sh-andamento" />
              <Label htmlFor="sh-andamento">Em andamento</Label>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Checkbox id="sh-concluido" defaultChecked />
              <Label htmlFor="sh-concluido">Concluído</Label>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Período</p>
            <div className="flex items-center gap-2 text-sm">
              <input type="radio" id="sh-p7" name="periodo" defaultChecked />
              <Label htmlFor="sh-p7">Últimos 7 dias</Label>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <input type="radio" id="sh-p30" name="periodo" />
              <Label htmlFor="sh-p30">Últimos 30 dias</Label>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <input type="radio" id="sh-ptodos" name="periodo" />
              <Label htmlFor="sh-ptodos">Todos</Label>
            </div>
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button>Aplicar</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function DrawerPreview() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Abrir painel</Button>
      </DrawerTrigger>
      <DrawerContent side="right">
        <DrawerHeader>
          <DrawerTitle>Detalhes</DrawerTitle>
          <DrawerDescription>Informações do protocolo.</DrawerDescription>
        </DrawerHeader>
        <div className="p-6">
          <p>
            Este é o conteúdo do painel. Aqui podem ser exibidos detalhes,
            configurações ou qualquer informação complementar.
          </p>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Fechar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function AlertDialogPreview() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Excluir requerimento</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir requerimento?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction>Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SidebarTriggerPreview() {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex items-center gap-3">
        <SidebarToggleButton open={open} onToggle={() => setOpen((v) => !v)} />
        <span className="text-sm">
          Estado: <strong>{open ? "Aberta" : "Fechada"}</strong>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <SidebarToggleButton open={true} onToggle={() => {}} />
          <span className="text-xs text-muted-foreground">Ícone: fechar</span>
        </div>
        <div className="flex items-center gap-2">
          <SidebarToggleButton open={false} onToggle={() => {}} />
          <span className="text-xs text-muted-foreground">Ícone: abrir</span>
        </div>
      </div>
    </div>
  );
}

function DropdownMenuPreview() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Mais opções">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Editar</DropdownMenuItem>
        <DropdownMenuItem>Duplicar</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const DT_COLUMNS = [
  { key: "nome", header: "Nome", sortable: true },
  { key: "email", header: "E-mail" },
  { key: "status", header: "Status", sortable: true },
];

const DT_DATA = [
  { nome: "João Silva", email: "joao@email.com", status: "Ativo" },
  { nome: "Maria Santos", email: "maria@email.com", status: "Pendente" },
  { nome: "Pedro Lima", email: "pedro@email.com", status: "Inativo" },
  { nome: "Ana Oliveira", email: "ana@email.com", status: "Ativo" },
  { nome: "Carlos Souza", email: "carlos@email.com", status: "Pendente" },
  { nome: "Lucia Ferreira", email: "lucia@email.com", status: "Ativo" },
  { nome: "Roberto Alves", email: "roberto@email.com", status: "Inativo" },
  { nome: "Fernanda Costa", email: "fernanda@email.com", status: "Ativo" },
  { nome: "Marcos Ribeiro", email: "marcos@email.com", status: "Pendente" },
];

function DataTablePreview() {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="w-full max-w-xl">
      <DataTable
        columns={DT_COLUMNS}
        data={DT_DATA}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        page={page}
        pageCount={3}
        onPageChange={setPage}
      />
    </div>
  );
}

function ErrorSummaryPreview() {
  const [valores, setValores] = useState({ nome: "", email: "" });
  const [erros, setErros] = useState([]);
  const [tentativa, setTentativa] = useState(0);
  const [enviado, setEnviado] = useState(false);

  function aoEnviar(event) {
    event.preventDefault();
    const encontrados = [];
    if (!valores.nome.trim()) {
      encontrados.push({ id: "nome", message: "Informe o nome completo." });
    }
    if (!valores.email.trim()) {
      encontrados.push({ id: "email", message: "Informe o e-mail." });
    } else if (!valores.email.includes("@")) {
      encontrados.push({ id: "email", message: "O e-mail precisa conter @." });
    }
    setErros(encontrados);
    setEnviado(encontrados.length === 0);
    setTentativa((n) => n + 1);
  }

  const erroDe = (id) => erros.find((e) => e.id === id);

  return (
    <form onSubmit={aoEnviar} noValidate className="w-full max-w-md space-y-4 text-left">
      <ErrorSummary errors={erros} focusKey={tentativa} />
      {enviado && (
        <p role="status" className="text-sm text-muted-foreground">
          Formulário válido — demonstração apenas.
        </p>
      )}
      <FormField
        label="Nome completo"
        htmlFor="es-nome"
        error={erroDe("nome")?.message}
      >
        <Input
          id="es-nome"
          value={valores.nome}
          aria-invalid={erroDe("nome") ? true : undefined}
          onChange={(e) => setValores((v) => ({ ...v, nome: e.target.value }))}
        />
      </FormField>
      <FormField
        label="E-mail"
        htmlFor="es-email"
        error={erroDe("email")?.message}
      >
        <Input
          id="es-email"
          type="email"
          value={valores.email}
          aria-invalid={erroDe("email") ? true : undefined}
          onChange={(e) => setValores((v) => ({ ...v, email: e.target.value }))}
        />
      </FormField>
      <Button type="submit">Enviar</Button>
    </form>
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
  header: HeaderPreview,
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
  accordion: AccordionPreview,
  popover: PopoverPreview,
  separator: SeparatorPreview,
  avatar: AvatarPreview,
  toggle: TogglePreview,
  spinner: SpinnerPreview,
  progress: ProgressPreview,
  slider: SliderPreview,
  "input-otp": InputOTPPreview,
  calendar: CalendarPreview,
  "scroll-area": ScrollAreaPreview,
  timeline: TimelinePreview,
  "navigation-menu": NavigationMenuPreview,
  sidebar: SidebarPreview,
  sheet: SheetPreview,
  drawer: DrawerPreview,
  "alert-dialog": AlertDialogPreview,
  "sidebar-trigger": SidebarTriggerPreview,
  "dropdown-menu": DropdownMenuPreview,
  "data-table": DataTablePreview,
  "error-summary": ErrorSummaryPreview,
};

export default function BasePreview({ slug }) {
  const Preview = PREVIEWS[slug];
  if (!Preview) return <p className="text-sm text-muted-foreground">Preview indisponível.</p>;
  return (
    <PreviewFrame>
      <div
        style={{
          padding: "1.5rem",
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "120px",
          textAlign: "center",
        }}
      >
        <Preview />
      </div>
    </PreviewFrame>
  );
}
