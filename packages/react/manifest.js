/**
 * Manifesto dos componentes do design system (kit @semec/ds/react, `packages/react/`).
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
    desc: "Ação principal. Seis variantes e quatro tamanhos; `asChild` transforma o botão num link. Todos os tamanhos têm alvo de toque de 44px: `sm` mantém o visual de 36px com a área clicável estendida.",
    variants: [
      { prop: "variant", values: "primary · secondary · outline · ghost · destructive · success · link" },
      { prop: "size", values: "sm (36px visual, alvo 44px) · md (44px) · lg (48px) · icon (44×44px)" },
    ],
    usage: `import { Button } from "@semec/ds/react";
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
    usage: `import { IconButton } from "@semec/ds/react";
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
    desc: "Link tipográfico com variantes de cor, sublinhado por padrão (a cor sozinha não distingue o link do texto: 2,91:1, WCAG 1.4.1). `onSurface` para links sobre superfícies elevadas.",
    variants: [
      { prop: "variant", values: "primary · onSurface · muted" },
      { prop: "underline", values: "true (padrão) · false (sublinha só no hover; use apenas em menus, rodapés e listas de navegação, nunca em texto corrido)" },
    ],
    usage: `import { Link } from "@semec/ds/react";

<p>Consulte o <Link href="/iptu">guia do IPTU 2026</Link> antes de emitir a guia.</p>
<Link href="/protocolo" variant="onSurface">Acompanhar protocolo</Link>
<Link href="/ajuda" variant="muted">Saiba mais sobre prazos</Link>

// Só em contexto de navegação, em que a posição já identifica o link:
<Link href="/servicos" underline={false}>Serviços</Link>`,
  },
  {
    code: "input",
    slug: "caixa-de-texto",
    label: "Caixa de texto",
    file: "src/components/input.tsx",
    category: "formularios",
    desc: "Campo de texto. Estado de erro via `aria-invalid`. Dentro de um FormField, recebe `id`, `aria-describedby` (dica + erro) e `aria-invalid` automaticamente.",
    variants: [{ prop: "estados", values: "padrão · inválido (aria-invalid) · disabled" }],
    usage: `import { FormField, Input } from "@semec/ds/react";

// Todo campo precisa de rótulo visível (placeholder não substitui o rótulo).
// Dentro do FormField, id, aria-describedby e aria-invalid são ligados sozinhos.
<FormField label="Nome completo" hint="Como no documento">
  <Input autoComplete="name" />
</FormField>

// Com id próprio (ex.: alvo do ErrorSummary): o rótulo e a mensagem seguem o id
<FormField label="CPF" error="Informe os 11 dígitos do CPF.">
  <Input id="cpf" inputMode="numeric" />
</FormField>
// → <label for="cpf">, aria-invalid="true", aria-describedby="cpf-error"`,
  },
  {
    code: "textarea",
    slug: "area-de-texto",
    label: "Área de texto",
    file: "src/components/textarea.tsx",
    category: "formularios",
    desc: "Campo multilinha com as mesmas variantes visuais do campo de texto.",
    variants: [{ prop: "estados", values: "padrão · inválido · disabled" }],
    usage: `import { FormField, Textarea } from "@semec/ds/react";

<FormField label="Descreva a demanda" hint="Até 500 caracteres">
  <Textarea id="demanda" rows={4} />
</FormField>`,
  },
  {
    code: "select",
    slug: "menu-de-selecao",
    label: "Menu de seleção",
    file: "src/components/select.tsx",
    category: "formularios",
    desc: "Seleção fechada com gatilho, conteúdo e itens compostos.",
    variants: [{ prop: "composição", values: "Select · SelectTrigger · SelectValue · SelectContent · SelectItem" }],
    usage: `import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@semec/ds/react";

<Select defaultValue="pbh">
  <SelectTrigger aria-label="Município"><SelectValue placeholder="Município" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="pbh">Porto Velho</SelectItem>
    <SelectItem value="riob">Rio Branco</SelectItem>
  </SelectContent>
</Select>

// Dentro de FormField, o SelectTrigger recebe id, aria-describedby e aria-invalid
<FormField label="Município" error={erro}>
  <Select>
    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
    <SelectContent>
      <SelectItem value="pbh">Porto Velho</SelectItem>
    </SelectContent>
  </Select>
</FormField>`,
  },
  {
    code: "combobox",
    slug: "combobox",
    label: "Combobox",
    file: "src/components/combobox.tsx",
    category: "formularios",
    desc: "Seleção com busca, no padrão APG combobox + listbox: uma parada de Tab, setas ↑/↓, Home/End, Enter seleciona, Esc fecha e devolve o foco. Opções via `options`; aceita `id`, `name`, `aria-*` e integra com FormField.",
    variants: [
      { prop: "props", values: "options · value · defaultValue · onChange · placeholder · searchPlaceholder · emptyText · name · required · disabled · labels · portalContainer" },
      { prop: "deprecadas", values: "ariaLabel (use rótulo visível ou aria-labelledby) · emptyMessage (use emptyText)" },
    ],
    usage: `import { Combobox, FormField, Label } from "@semec/ds/react";

// Rótulo visível pelo FormField: nome acessível = rótulo + texto do gatilho (WCAG 2.5.3)
<FormField label="Tipo de documento" error={erro}>
  <Combobox
    name="tipoDocumento"
    placeholder="Selecione o tipo de documento"
    searchPlaceholder="Buscar tipo…"
    emptyText="Nenhum tipo encontrado."
    options={[{ value: "cnpj", label: "CNPJ" }, { value: "cpf", label: "CPF" }]}
    value={valor}
    onChange={setValor}
  />
</FormField>

// Ou com <Label htmlFor> + id (também aceita aria-labelledby)
<Label htmlFor="orgao">Órgão emissor</Label>
<Combobox id="orgao" options={orgaos} />`,
  },
  {
    code: "date-picker",
    slug: "seletor-de-data",
    label: "Seletor de data",
    file: "src/components/date-picker.tsx",
    category: "formularios",
    desc: 'Data com `<input type="date">` nativo — sem biblioteca de calendário. Um só indicador: botão "Abrir calendário" de 44px que chama `showPicker()` (o indicador nativo fica oculto; no Firefox, fica só o nativo).',
    variants: [{ prop: "props", values: "nativo HTML (min · max · disabled) + labels.openCalendar + variantes visuais do campo" }],
    usage: `import { DatePicker, FormField } from "@semec/ds/react";

<FormField label="Data de vencimento" hint="dd/mm/aaaa">
  <DatePicker id="vencimento" defaultValue="2026-08-31" />
</FormField>`,
  },
  {
    code: "file-upload",
    slug: "envio-de-arquivos",
    label: "Envio de arquivos",
    file: "src/components/file-upload.tsx",
    category: "formularios",
    desc: "Área de arrastar-e-soltar com lista de arquivos, limite por tamanho e erro.",
    variants: [{ prop: "props", values: "accept · maxSize · label · hint · error · onChange · value · multiple · id · inputProps · labels" }],
    usage: `import { FileUpload } from "@semec/ds/react";

// \`label\` é o rótulo do campo de arquivo — não omita
<FileUpload
  label="Documento de identidade"
  accept=".pdf,image/*"
  maxSize={5 * 1024 * 1024}
  hint="PDF ou imagem, até 5 MB"
/>

// Textos fixos sobrescrevíveis (padrão PT-BR)
<FileUpload label="Anexo" labels={{ invalidType: "Envie só PDF.", tooLarge: (max) => \`Máximo de \${max}.\` }} />`,
  },
  {
    code: "checkbox",
    slug: "caixa-de-marcacao",
    label: "Caixa de marcação",
    file: "src/components/checkbox.tsx",
    category: "formularios",
    desc: "Caixa de marcação com estado indeterminado.",
    variants: [{ prop: "estados", values: "desmarcado · marcado (checked) · indeterminado · disabled" }],
    usage: `import { Checkbox, Label } from "@semec/ds/react";

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
    usage: `import { RadioGroup, RadioGroupItem, Label } from "@semec/ds/react";

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
    usage: `import { Switch, Label } from "@semec/ds/react";

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
    usage: `import { Label, Input } from "@semec/ds/react";

<Label htmlFor="nome">Nome</Label>
<Input id="nome" />`,
  },
  {
    code: "form-field",
    slug: "campo-de-formulario",
    label: "Campo de formulário",
    file: "src/components/form-field.tsx",
    category: "formularios",
    desc: "Casaco do campo: label, obrigatório, dica e mensagem de erro na ordem certa. Liga o campo filho pelo contexto (`FormFieldContext`): `id` (gerado com `useId` se faltar), `aria-describedby` (dica + erro) e `aria-invalid` com erro, sem sobrescrever o que for passado. Funciona com Input, Textarea, SelectTrigger, Combobox, DatePicker, Checkbox, RadioGroup, Switch, InputOTP, FileUpload e Slider. O erro não usa `role=\"alert\"`: é lido ao focar o campo, e o anúncio fica com o ErrorSummary. Para sucesso após envio, use Toast.",
    variants: [
      { prop: "props", values: "label · htmlFor · required · hint · error · id (base dos ids <id>-hint/<id>-error)" },
      { prop: "hooks", values: "useFormField · useFormFieldControl (para campos próprios)" },
    ],
    usage: `import { FormField, Input, Button, useToast } from "@semec/ds/react";

// Em formulários: erros ficam inline no FormField (+ ErrorSummary no topo).
// Sucesso na submissão dispara notificação via toast:
function Formulario() {
  const { toast } = useToast();
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      toast({ variant: "success", title: "Salvo com sucesso", description: "Alterações registradas." });
    }}>
      {/* id, aria-describedby (dica/erro) e aria-invalid chegam ao Input pelo contexto */}
      <FormField label="E-mail" required hint="Usado para o comprovante" error={erro}>
        <Input id="email" type="email" />
      </FormField>
      <Button type="submit">Salvar</Button>
    </form>
  );
}`,
  },
  {
    code: "error-summary",
    slug: "error-summary",
    label: "ErrorSummary",
    file: "src/components/error-summary.tsx",
    category: "formularios",
    desc: "Resumo de erros de validação no topo do formulário, com links para cada campo (`id` do campo, ou `name` como recuo). A11y: `role=\"alert\"`, foco automático, título ligado por id gerado. Sem margem externa: espace pelo layout (ex.: `className=\"mb-6\"`).",
    variants: [{ prop: "props", values: "title · errors [{ id, message }] · autoFocus · focusKey" }],
    usage: `import { ErrorSummary } from "@semec/ds/react";

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
    desc: "Superfície de conteúdo com header, corpo e footer. Sombra pelo token `shadow-elevation-1`.",
    variants: [
      { prop: "composição", values: "Card · CardHeader · CardTitle · CardDescription · CardContent · CardFooter · FormHeader · SectionHeader" },
      { prop: "títulos", values: "CardTitle as: h1–h6 · div (padrão) · p · SectionHeader titleAs (padrão h2)" },
    ],
    usage: `import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from "@semec/ds/react";

// "as" escolhe o nível do título conforme a hierarquia da página
<Card>
  <CardHeader><CardTitle as="h2">IPTU 2026</CardTitle></CardHeader>
  <CardContent>Parcela em dia.</CardContent>
  <CardFooter><Button>Emitir boleto</Button></CardFooter>
</Card>`,
  },
  {
    code: "heading",
    slug: "titulo",
    label: "Título",
    file: "src/components/heading.tsx",
    category: "conteudo-dados",
    desc: "Título semântico h1–h6 com a escala tipográfica do kit. O nível (level) segue a estrutura da página; o tamanho (size) segue o visual.",
    variants: [
      { prop: "level", values: "1 · 2 (padrão) · 3 · 4 · 5 · 6" },
      { prop: "size", values: "1–6 (padrão: igual ao level)" },
    ],
    usage: `import { Heading } from "@semec/ds/react";

<Heading level={1}>Requerimento de matrícula</Heading>
<Heading level={2}>Dados do estudante</Heading>

// Nível semântico 3 com visual de nível 2
<Heading level={3} size={2}>Documentos</Heading>`,
  },
  {
    code: "badge",
    slug: "etiqueta",
    label: "Etiqueta",
    file: "src/components/badge.tsx",
    category: "conteudo-dados",
    desc: "Etiqueta curta de status ou contagem.",
    variants: [{ prop: "variant", values: "default · secondary · outline · success · warning · danger · info" }],
    usage: `import { Badge } from "@semec/ds/react";

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
      { prop: "a11y", values: "scope=col (TableHead) · aria-sort repassado pelo consumidor em TableHead · TableCaption para nome" },
    ],
    usage: `import { Table, TableCaption, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@semec/ds/react";

// Básico
<Table>
  <TableCaption>Serviços solicitados</TableCaption>
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
    desc: "Placeholder pulsante de carregamento, decorativo (aria-hidden). Fundo `surface-sunken`. Anuncie o carregamento no contêiner com aria-busy e um texto ou Spinner.",
    variants: [{ prop: "a11y", values: "aria-hidden=true (padrão) · aria-busy no contêiner" }],
    usage: `import { Skeleton } from "@semec/ds/react";

<div aria-busy="true">
  <p className="sr-only">Carregando protocolos…</p>
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>`,
  },
  {
    code: "empty-state",
    slug: "estado-vazio",
    label: "Estado vazio",
    file: "src/components/empty-state.tsx",
    category: "feedback",
    desc: "Estado vazio com ícone, título, descrição e ação opcional.",
    variants: [{ prop: "props", values: "icon · title · description · action · titleAs (padrão h3)" }],
    usage: `import { EmptyState, Button } from "@semec/ds/react";
import { Inbox } from "lucide-react";

<EmptyState
  icon={<Inbox />}
  title="Nenhum protocolo encontrado"
  titleAs="h2"
  description="Ajuste os filtros ou abra um novo requerimento."
  action={<Button>Abrir requerimento</Button>}
/>`,
  },
  {
    code: "error-state",
    slug: "estado-de-erro",
    label: "Estado de erro",
    file: "src/components/error-state.tsx",
    category: "feedback",
    desc: "Estado de erro com anúncio acessível (role=alert), mensagem explicativa e ação de recuperação (onRetry ou ação personalizada).",
    variants: [
      { prop: "variant", values: "default · inline" },
      { prop: "props", values: "title · description · icon · action · onRetry · retryLabel · variant · titleAs (padrão h3; p no inline)" },
      { prop: "a11y", values: "role=alert · aria-live=assertive · ícones com aria-hidden" },
    ],
    usage: `import { ErrorState, Button } from "@semec/ds/react";

// Variante padrão com atalho onRetry
<ErrorState
  title="Não foi possível carregar os protocolos"
  description="Houve uma falha na conexão com o servidor. Verifique sua rede e tente novamente."
  onRetry={() => recarregarDados()}
/>

// Variante inline para seções menores
<ErrorState
  variant="inline"
  title="Falha ao atualizar indicador"
  description="Serviço temporariamente indisponível."
  onRetry={() => atualizar()}
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
    usage: `import { Breadcrumb } from "@semec/ds/react";

<Breadcrumb items={[
  { label: "Início", href: "/" },
  { label: "Serviços", href: "/servicos" },
  { label: "IPTU" },
]} />`,
  },
  {
    code: "header",
    slug: "cabecalho",
    label: "Cabeçalho",
    file: "src/components/header.tsx",
    category: "navegacao",
    desc: "Topo do portal: marca, navegação e CTA. Composição Header + Brand + Nav.",
    variants: [
      { prop: "composição", values: "Header · HeaderBrand · HeaderNav · HeaderNavLink" },
      { prop: "props", values: "HeaderBrand: orgName · serviceName · logo · href (\"\" = sem link) · truncate · homeLabel · HeaderNavLink: current" },
      { prop: "a11y", values: "sem logo: placeholder decorativo (aria-hidden) e aviso em dev · nome quebra linha no mobile (truncate opcional)" },
    ],
    usage: `import { Header, HeaderBrand, HeaderNav, HeaderNavLink } from "@semec/ds/react";
import { Button } from "@semec/ds/react";

<Header>
  <HeaderBrand
    orgName="SEMEC"
    serviceName="Nome do serviço"
    logo={<img src="/logo-prefeitura.svg" alt="Prefeitura de Porto Velho" className="h-9 w-auto" />}
  />
  <div className="flex items-center gap-2">
    <HeaderNav>
      <HeaderNavLink href="/prefeitura" current>Prefeitura</HeaderNavLink>
      <HeaderNavLink href="/servicos">Serviços</HeaderNavLink>
    </HeaderNav>
    <Button asChild>
      <a href="/contato">Fale Conosco</a>
    </Button>
  </div>
</Header>`,
  },
  {
    code: "skip-link",
    slug: "link-para-o-conteudo",
    label: "Link para o conteúdo",
    file: "src/components/skip-link.tsx",
    category: "navegacao",
    desc: "Link \"Pular para o conteúdo principal\" (WCAG 2.4.1): oculto até receber foco pelo teclado. Primeiro elemento focável da página; leva o foco ao alvo (padrão #conteudo).",
    variants: [
      { prop: "props", values: "href (padrão #conteudo) · children (padrão \"Pular para o conteúdo principal\")" },
      { prop: "a11y", values: "visível no foco · foco movido ao alvo (tabindex=-1 aplicado se preciso) · alvo de 44px" },
    ],
    usage: `import { SkipLink, Header } from "@semec/ds/react";

<body>
  <SkipLink />
  <Header>…</Header>
  <main id="conteudo">…</main>
</body>`,
  },
  {
    code: "footer",
    slug: "rodape",
    label: "Rodapé",
    file: "src/components/footer.tsx",
    category: "navegacao",
    desc: "Rodapé institucional (<footer>, landmark contentinfo) com seções de links e faixa final. Use um por página, fora do <main>.",
    variants: [
      { prop: "composição", values: "Footer · FooterContent · FooterSection · FooterLinks · FooterLink · FooterBottom" },
      { prop: "props", values: "FooterSection: title · titleAs (padrão h2)" },
      { prop: "a11y", values: "landmark contentinfo · FooterLinks envolve cada filho em <li> · links com alvo de 44px e sublinhado" },
    ],
    usage: `import { Footer, FooterContent, FooterSection, FooterLinks, FooterLink, FooterBottom } from "@semec/ds/react";

<Footer>
  <FooterContent>
    <FooterSection title="Atendimento">
      <p>Rua Exemplo, 100 · Centro · Porto Velho/RO</p>
    </FooterSection>
    <FooterSection title="Serviços">
      <FooterLinks>
        <FooterLink href="/matricula">Matrícula</FooterLink>
        <FooterLink href="/transporte">Transporte escolar</FooterLink>
      </FooterLinks>
    </FooterSection>
  </FooterContent>
  <FooterBottom>
    <p>© 2026 Prefeitura de Porto Velho · SEMEC</p>
  </FooterBottom>
</Footer>`,
  },
  {
    code: "tabs",
    slug: "abas",
    label: "Abas",
    file: "src/components/tabs.tsx",
    category: "navegacao",
    desc: "Abas para alternar conteúdo na mesma tela. Gerenciamento de foco e roving tabindex via Radix. A aba ativa tem barra inferior de 3px em `primary` (≥4,97:1) e peso semibold, além do fundo: não depende só de cor. Alvo de 44px.",
    variants: [
      { prop: "composição", values: "Tabs · TabsList · TabsTrigger · TabsContent" },
      { prop: "a11y", values: "role=tablist · role=tab · aria-selected · role=tabpanel · navegação teclado (setas, Home/End) · indicador não cromático da aba ativa" },
    ],
    usage: `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@semec/ds/react";

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
    desc: "Controle de páginas com elipses (janela por `siblingCount`). Navegação por teclado completa. Botões de 44px. Textos em PT-BR, sobrescrevíveis por `labels`.",
    variants: [
      { prop: "props", values: "page · pageCount · onPageChange · siblingCount · labels?: Partial<{ navigation, previous, next, page(n) }>" },
      { prop: "a11y", values: "role=navigation · aria-label=Paginação · aria-current=page · aria-label \"Página N\" nos números · aria-label nos botões prev/next · aria-hidden nos elipses" },
    ],
    usage: `import { Pagination } from "@semec/ds/react";

<Pagination page={pagina} pageCount={42} onPageChange={setPagina} />

<Pagination
  page={pagina}
  pageCount={42}
  onPageChange={setPagina}
  labels={{ navigation: "Paginação dos protocolos" }}
/>`,
  },
  {
    code: "sidebar-trigger",
    slug: "gatilho-da-barra-lateral",
    label: "Gatilho da barra lateral",
    file: "src/components/sidebar-trigger.tsx",
    category: "navegacao",
    desc: "`SidebarToggleButton`: botão controlado (`open` + `onToggle`) para colapsar/expandir uma sidebar cujo estado vive no seu layout (ex.: Header). Alterna entre ícones PanelLeftOpen e PanelLeftClose. Dentro de `SidebarProvider`, use `SidebarTrigger` (ver Barra lateral), que não recebe `open`/`onToggle`.",
    variants: [
      { prop: "props", values: "open · onToggle · labelOpen · labelClosed" },
      { prop: "a11y", values: "aria-expanded · aria-label dinâmico (Abrir/Fechar menu)" },
    ],
    usage: `import { SidebarToggleButton } from "@semec/ds/react";

// Estado no seu layout; o rótulo acessível vem de labelOpen/labelClosed
<SidebarToggleButton open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

// Com SidebarProvider (componente Barra lateral), use <SidebarTrigger /> — sem open/onToggle`,
  },
  {
    code: "dialog",
    slug: "modal",
    label: "Modal",
    file: "src/components/dialog.tsx",
    category: "feedback",
    desc: "Diálogo modal acessível com overlay, header, título, descrição e footer.",
    variants: [
      { prop: "composição", values: "Dialog · DialogTrigger · DialogContent · DialogHeader · DialogTitle · DialogDescription · DialogFooter · DialogClose" },
      { prop: "closeLabel", values: "nome acessível do X de 44×44px (padrão \"Fechar\")" },
    ],
    usage: `import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, Button } from "@semec/ds/react";

// Para confirmação destrutiva use AlertDialog (role="alertdialog").
<Dialog>
  <DialogTrigger asChild><Button>Editar contato</Button></DialogTrigger>
  <DialogContent closeLabel="Fechar edição">
    <DialogHeader>
      <DialogTitle>Editar contato</DialogTitle>
      <DialogDescription>Atualize o telefone do responsável.</DialogDescription>
    </DialogHeader>
    <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose></DialogFooter>
  </DialogContent>
</Dialog>

// Controlado SEM DialogTrigger: o Radix não sabe para onde devolver o foco.
// Guarde o elemento de origem e devolva o foco em onCloseAutoFocus.
const origemRef = React.useRef(null);
<Button ref={origemRef} onClick={() => setAberto(true)}>Editar</Button>
<Dialog open={aberto} onOpenChange={setAberto}>
  <DialogContent onCloseAutoFocus={(e) => { e.preventDefault(); origemRef.current?.focus(); }}>…</DialogContent>
</Dialog>`,
  },
  {
    code: "toast",
    slug: "notificacao",
    label: "Notificação",
    file: "src/components/toast.tsx",
    category: "feedback",
    desc: "Notificação temporária flutuante disparada com `useToast()` e viewport empilhável. Padrão oficial para confirmação de envio de formulários e ações com a variante `success`.",
    variants: [
      { prop: "variant", values: "default · success (verde SEMEC #82C353, texto #26325B, 12px, Poppins) · warning · destructive" },
      { prop: "uso", values: "<Toaster /> uma vez no root do app + useToast() em formulários, botões de ação e fluxos assíncronos" },
      { prop: "Toaster", values: "label · viewportLabel · closeLabel (textos PT-BR sobrescrevíveis)" },
      { prop: "alvos", values: "X e ToastAction com 44px" },
    ],
    usage: `import { Toaster, useToast, Button } from "@semec/ds/react";

// Dispare de qualquer componente com useToast():
function Acao() {
  const { toast } = useToast();
  return <Button onClick={() => toast({ variant: "success", title: "Protocolo enviado" })}>Enviar</Button>;
}

// Monte <Toaster /> UMA vez no root do app (ex.: app/layout.tsx).
// Não use ToastProvider/ToastViewport soltos: sem o Toaster nenhum toast aparece.
<Acao />
<Toaster />`,
  },
  {
    code: "tooltip",
    slug: "dica",
    label: "Dica",
    file: "src/components/tooltip.tsx",
    category: "feedback",
    desc: "Dica curta ao passar o ponteiro ou focar o elemento.",
    variants: [{ prop: "composição", values: "TooltipProvider · Tooltip · TooltipTrigger · TooltipContent" }],
    usage: `import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, IconButton } from "@semec/ds/react";
import { HelpCircle } from "lucide-react";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild><IconButton label="Ajuda"><HelpCircle /></IconButton></TooltipTrigger>
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
    desc: "Mensagem de feedback em linha, com ícone automático por variante. Só destructive interrompe o leitor de tela (role=alert); as demais usam role=status.",
    variants: [
      { prop: "variant", values: "default · success · warning · destructive" },
      { prop: "announce", values: "assertive (role=alert) · polite (role=status) · off (sem região viva) — padrão: destructive → assertive, demais → polite; role explícito tem precedência" },
      { prop: "AlertTitle as", values: "div (padrão) · p · h1–h6" },
    ],
    usage: `import { Alert, AlertTitle, AlertDescription } from "@semec/ds/react";

<Alert variant="warning">
  <AlertTitle>Carnê indisponível</AlertTitle>
  <AlertDescription>O sistema volta às 14h.</AlertDescription>
</Alert>

// Erro que pede ação imediata: role=alert automático
<Alert variant="destructive">
  <AlertTitle>Pagamento recusado</AlertTitle>
  <AlertDescription>Confira os dados do cartão.</AlertDescription>
</Alert>

// Aviso estático, presente desde o carregamento: sem região viva
<Alert announce="off">
  <AlertTitle as="h2">Como funciona</AlertTitle>
  <AlertDescription>O protocolo é analisado em até 5 dias úteis.</AlertDescription>
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
    usage: `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@semec/ds/react";

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
    desc: "Confirmação perigosa. Força decisão (ação/cancelar) antes de prosseguir: role=\"alertdialog\", sempre modal, não fecha por clique fora e abre com o foco no Cancelar.",
    variants: [
      { prop: "composição", values: "AlertDialog · AlertDialogTrigger · AlertDialogContent · AlertDialogHeader · AlertDialogTitle · AlertDialogDescription · AlertDialogFooter · AlertDialogAction · AlertDialogCancel" },
      { prop: "variant (Action/Cancel)", values: "as do Button; padrão primary (Action) e outline (Cancel), 44px" },
      { prop: "regras", values: "inclua sempre AlertDialogCancel (recebe o foco inicial) · Esc fecha · para validar antes de fechar, controle open e use event.preventDefault() no onClick do Action" },
    ],
    usage: `import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, Button } from "@semec/ds/react";

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
      <AlertDialogAction variant="destructive">Excluir</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

// Validar antes de fechar (ação assíncrona): controle open e impeça o fechamento automático
<AlertDialog open={aberto} onOpenChange={setAberto}>
  <AlertDialogContent>
    …
    <AlertDialogAction
      variant="destructive"
      onClick={async (e) => { e.preventDefault(); await excluir(); setAberto(false); }}
    >Excluir</AlertDialogAction>
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
    usage: `import { Popover, PopoverTrigger, PopoverContent, Button } from "@semec/ds/react";

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Filtros</Button>
  </PopoverTrigger>
  {/* PopoverContent é role=dialog: dê um nome com aria-label ou aria-labelledby */}
  <PopoverContent aria-label="Filtros">
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
    usage: `import { Separator } from "@semec/ds/react";

<Separator />
<Separator orientation="vertical" className="h-6" />`,
  },
  {
    code: "avatar",
    slug: "avatar",
    label: "Avatar",
    file: "src/components/avatar.tsx",
    category: "conteudo-dados",
    desc: "Foto de perfil com fallback automático (iniciais).",
    variants: [
      { prop: "composição", values: "Avatar · AvatarImage · AvatarFallback" },
      { prop: "tamanhos", values: "h-10 w-10 (padrão) — sobrescreva com className" },
    ],
    usage: `import { Avatar, AvatarImage, AvatarFallback } from "@semec/ds/react";

<Avatar>
  <AvatarImage src="/foto.jpg" alt="João Silva" />
  <AvatarFallback>JS</AvatarFallback>
</Avatar>`,
  },
  {
    code: "toggle",
    slug: "toggle",
    label: "Toggle",
    file: "src/components/toggle.tsx",
    category: "formularios",
    desc: "Botão binário para estados on/off em toolbars. Alvo de toque de 44px em todos os tamanhos.",
    variants: [
      { prop: "variant", values: "default · outline" },
      { prop: "size", values: "sm (36px visual, alvo 44px) · md (44px, padrão) · lg (48px)" },
    ],
    usage: `import { Toggle } from "@semec/ds/react";
import { Bold } from "lucide-react";

<Toggle variant="outline" aria-label="Negrito">
  <Bold />
</Toggle>`,
  },
  {
    code: "spinner",
    slug: "spinner",
    label: "Spinner",
    file: "src/components/spinner.tsx",
    category: "feedback",
    desc: "Indicador de carregamento inline (role=status).",
    variants: [{ prop: "label", values: "texto anunciado (padrão \"Carregando\")" }],
    usage: `import { Spinner } from "@semec/ds/react";

<Spinner label="Carregando protocolos" />
<p className="text-muted-foreground">Carregando dados…</p>`,
  },
  {
    code: "progress",
    slug: "progress",
    label: "Progresso",
    file: "src/components/progress.tsx",
    category: "feedback",
    desc: "Barra de progresso determinada. Trilha com contorno border-strong (3,77:1 sobre surface) e indicador primary.",
    variants: [],
    usage: `import { Progress } from "@semec/ds/react";

// Nome acessível obrigatório: aria-label ou aria-labelledby
<p id="envio-progresso" className="text-sm text-muted-foreground">Envio dos documentos: 60% concluído</p>
<Progress value={60} aria-labelledby="envio-progresso" />`,
  },
  {
    code: "slider",
    slug: "slider",
    label: "Slider",
    file: "src/components/slider.tsx",
    category: "formularios",
    desc: "Controle deslizante para faixas de valor.",
    variants: [],
    usage: `import { Slider } from "@semec/ds/react";

// Nome acessível obrigatório: aria-label (ou aria-labelledby) vai para o polegar
<Slider defaultValue={[50]} max={100} step={1} aria-label="Raio de busca em km" />

// Faixa com 2 polegares: anunciados como "Faixa de preço (1 de 2)" e "(2 de 2)"; use getAriaLabel(i) para nomes próprios
<Slider defaultValue={[100, 500]} max={1000} step={10} aria-label="Faixa de preço" />`,
  },
  {
    code: "input-otp",
    slug: "input-otp",
    label: "Input OTP",
    file: "src/components/input-otp.tsx",
    category: "formularios",
    desc: "Campo de código OTP com foco automático entre dígitos.",
    variants: [
      { prop: "composição", values: "InputOTP · InputOTPGroup · InputOTPSlot · InputOTPSeparator" },
      { prop: "props", values: "maxLength · disabled · labels (group · slot(index, total))" },
    ],
    usage: `import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@semec/ds/react";

<InputOTP value={code} onChange={setCode} maxLength={6}>
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
</InputOTP>`,
  },
  {
    code: "calendar",
    slug: "calendario",
    label: "Calendário",
    file: "src/components/calendar.tsx",
    category: "formularios",
    desc: "Calendário mensal no padrão APG de grade de datas: uma parada de Tab na grade, setas, Home/End, PageUp/PageDown e nomes completos em PT-BR. Células e botões de 44px.",
    variants: [
      { prop: "props", values: "value · onChange · min · max (AAAA-MM-DD, data local) · disabled · labels?: Partial<{ previousMonth, nextMonth }>" },
      { prop: "a11y", values: "role=grid rotulado pelo mês (aria-live=polite) · roving tabindex · aria-selected · aria-current=date no dia de hoje · aria-disabled fora de min/max · nome \"14 de outubro de 2026\"" },
      { prop: "teclado", values: "←/→ dia · ↑/↓ semana · Home/End início/fim da semana · PageUp/PageDown mês · Shift+PageUp/PageDown ano · Enter/Espaço seleciona" },
    ],
    usage: `import { Calendar } from "@semec/ds/react";

<Calendar value={data} onChange={setData} />

<Calendar value={data} onChange={setData} min="2026-01-01" max="2026-12-31" />`,
  },
  {
    code: "scroll-area",
    slug: "scroll-area",
    label: "Área de scroll",
    file: "src/components/scroll-area.tsx",
    category: "navegacao",
    desc: "Scroll customizado e consistente entre navegadores.",
    variants: [
      { prop: "composição", values: "ScrollArea · ScrollBar" },
      { prop: "orientation", values: "vertical · horizontal" },
    ],
    usage: `import { ScrollArea } from "@semec/ds/react";

<ScrollArea className="h-48">
  <div className="p-4">Conteúdo longo aqui…</div>
</ScrollArea>`,
  },
  {
    code: "dropdown-menu",
    slug: "menu-suspenso",
    label: "Menu suspenso",
    file: "src/components/dropdown-menu.tsx",
    category: "navegacao",
    desc: "Menu flutuante com itens, checkbox, radio, sub-menus e separadores.",
    variants: [
      { prop: "composição", values: "DropdownMenu · Trigger · Content · Item · CheckboxItem · RadioItem · Label · Separator · Sub · SubTrigger · SubContent" },
    ],
    usage: `import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, IconButton } from "@semec/ds/react";
import { MoreHorizontal } from "lucide-react";

// Gatilho só com ícone: use IconButton (label obrigatório vira o nome acessível)
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <IconButton variant="ghost" label="Mais ações do protocolo"><MoreHorizontal /></IconButton>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Editar</DropdownMenuItem>
    <DropdownMenuItem>Duplicar</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
  },
  {
    code: "drawer",
    slug: "drawer",
    label: "Drawer",
    file: "src/components/drawer.tsx",
    category: "feedback",
    desc: "Painel deslizante de qualquer lado da tela.",
    variants: [
      { prop: "side", values: "bottom (padrão) · top · left · right" },
      { prop: "composição", values: "Drawer · Trigger · Content · Header · Footer · Title · Description · Close" },
      { prop: "closeLabel", values: "nome acessível do X de 44×44px (padrão \"Fechar\")" },
      { prop: "rolagem", values: "overflow-y-auto; top/bottom com max-h 85dvh" },
    ],
    usage: `import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose, Button } from "@semec/ds/react";

<Drawer>
  <DrawerTrigger asChild><Button>Abrir painel</Button></DrawerTrigger>
  <DrawerContent side="right">
    <DrawerHeader>
      <DrawerTitle>Detalhes</DrawerTitle>
      <DrawerDescription>Informações do protocolo.</DrawerDescription>
    </DrawerHeader>
    <div className="p-6">Conteúdo aqui</div>
    <DrawerFooter>
      <DrawerClose asChild><Button variant="outline">Fechar</Button></DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`,
  },
  {
    code: "sheet",
    slug: "sheet",
    label: "Sheet",
    file: "src/components/sheet.tsx",
    category: "feedback",
    desc: "Painel lateral modal com overlay. Variantes left/right/top/bottom.",
    variants: [
      { prop: "side", values: "left · right · top · bottom" },
      { prop: "composição", values: "Sheet · Trigger · Content · Header · Footer · Title · Description · Close" },
      { prop: "closeLabel", values: "nome acessível do X de 44×44px (padrão \"Fechar\")" },
      { prop: "rolagem", values: "overflow-y-auto; top/bottom com max-h 85dvh" },
    ],
    usage: `import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose, Button } from "@semec/ds/react";

<Sheet>
  <SheetTrigger asChild><Button variant="outline">Abrir filtros</Button></SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Filtros</SheetTitle>
      <SheetDescription>Refine sua busca.</SheetDescription>
    </SheetHeader>
    <div className="p-6">Filtros aqui</div>
    <SheetFooter>
      <SheetClose asChild><Button>Aplicar</Button></SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>

// Controlado SEM SheetTrigger (ex.: aberto por um item de tabela): o Radix
// não sabe para onde devolver o foco. Guarde a origem e devolva em onCloseAutoFocus.
function FiltrosControlados() {
  const [aberto, setAberto] = React.useState(false);
  const origemRef = React.useRef(null);
  return (
    <>
      <Button ref={origemRef} onClick={() => setAberto(true)}>Filtros</Button>
      <Sheet open={aberto} onOpenChange={setAberto}>
        <SheetContent
          closeLabel="Fechar filtros"
          onCloseAutoFocus={(e) => { e.preventDefault(); origemRef.current?.focus(); }}
        >
          <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
          {/* conteúdo longo rola dentro do painel (overflow-y-auto) */}
        </SheetContent>
      </Sheet>
    </>
  );
}`,
  },
  {
    code: "data-table",
    slug: "tabela-de-dados",
    label: "Tabela de dados",
    file: "src/components/data-table.tsx",
    category: "conteudo-dados",
    desc: "Tabela com ordenação, paginação e estados vazios.",
    variants: [
      { prop: "props", values: "columns · data · sortKey · sortDir · onSort · page · pageCount · onPageChange · onRowClick · emptyMessage · caption · labels (sortBy · pageOf · previous · next)" },
      { prop: "a11y", values: "ordenação por botão com aria-sort · linha focável e ativável por Enter/Espaço quando há onRowClick · paginação com alvos de 44px" },
    ],
    usage: `import { DataTable, Button } from "@semec/ds/react";

// Quando a linha tem várias ações, prefira uma coluna de ações com render + Button a onRowClick
<DataTable
  caption="Protocolos do contribuinte"
  columns={[
    { key: "nome", header: "Nome", sortable: true },
    { key: "status", header: "Status" },
    {
      key: "acoes",
      header: "Ações",
      render: (row) => (
        <Button variant="outline" onClick={() => abrirProtocolo(row)}>Ver detalhes</Button>
      ),
    },
  ]}
  data={registros}
  sortKey={sortField}
  sortDir={sortDir}
  onSort={handleSort}
  page={pagina}
  pageCount={totalPaginas}
  onPageChange={setPagina}
/>`,
  },
  {
    code: "timeline",
    slug: "timeline",
    label: "Linha do tempo",
    file: "src/components/timeline.tsx",
    category: "conteudo-dados",
    desc: "Sequência temporal em lista ordenada (ol/li), com pontos, conectores visíveis e conteúdo. O status vai em texto (srLabel), não só na cor.",
    variants: [
      { prop: "composição", values: "Timeline · TimelineItem · TimelineSeparator · TimelineDot · TimelineConnector · TimelineContent · TimelineTitle · TimelineDescription" },
      { prop: "dot variant", values: "default · success · warning · destructive · info" },
      { prop: "props", values: "TimelineDot srLabel · TimelineTitle as (padrão div)" },
      { prop: "a11y", values: "ol/li · srLabel com o status por item · conector border-strong (3,77:1)" },
    ],
    usage: `import { Timeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineConnector, TimelineContent, TimelineTitle, TimelineDescription } from "@semec/ds/react";

<Timeline>
  <TimelineItem>
    <TimelineSeparator>
      <TimelineDot variant="success" srLabel="Concluído" />
      <TimelineConnector />
    </TimelineSeparator>
    <TimelineContent>
      <TimelineTitle>Protocolo recebido</TimelineTitle>
      <TimelineDescription>12/08/2026 às 14:30</TimelineDescription>
    </TimelineContent>
  </TimelineItem>
  <TimelineItem>
    <TimelineSeparator>
      <TimelineDot srLabel="Em andamento" />
    </TimelineSeparator>
    <TimelineContent>
      <TimelineTitle>Em análise</TimelineTitle>
      <TimelineDescription>Aguardando parecer</TimelineDescription>
    </TimelineContent>
  </TimelineItem>
</Timeline>`,
  },
  {
    code: "navigation-menu",
    slug: "menu-de-navegacao",
    label: "Menu de navegação",
    file: "src/components/navigation-menu.tsx",
    category: "navegacao",
    desc: "Navegação principal com mega-menu e viewport animado. O `<nav>` se chama \"Menu principal\" por padrão (sobrescreva com `aria-label`). Gatilhos de 44px.",
    variants: [
      { prop: "composição", values: "NavigationMenu · List · Item · Trigger · Content · Link · Viewport · Indicator" },
      { prop: "a11y", values: "aria-label padrão \"Menu principal\" · Tab/ArrowDown entram no conteúdo aberto · Esc fecha e devolve o foco · aria-hidden-focus aberto é exceção EXC-01 (sentinela do Radix)" },
    ],
    usage: `import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink } from "@semec/ds/react";

<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Serviços</NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavigationMenuLink href="/iptu">IPTU</NavigationMenuLink>
        <NavigationMenuLink href="/alvara">Alvará</NavigationMenuLink>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`,
  },
  {
    code: "sidebar",
    slug: "sidebar",
    label: "Barra lateral",
    file: "src/components/sidebar.tsx",
    category: "navegacao",
    desc: "Shell completo: SidebarProvider + Sidebar + Header/Content/Footer + grupos, menus, colapso e mobile. Abaixo de 768px (48rem, via `matchMedia`) a Sidebar vira gaveta modal (Radix Dialog): foco preso, Esc fecha, conteúdo de trás inerte, foco volta a quem abriu e botão visível \"Fechar menu\" (44×44). No desktop renderiza um landmark `<nav aria-label=\"Menu lateral\">`. `SidebarMenuButton isActive` gera `aria-current=\"page\"`; `tooltip` aparece só no modo recolhido (`collapsible=\"icon\"`). `SidebarTrigger` (44×44) expõe `aria-expanded` e `aria-controls`.",
    variants: [
      { prop: "side", values: "left · right" },
      { prop: "variant", values: "sidebar · floating · inset" },
      { prop: "collapsible", values: "offcanvas · icon · none" },
      { prop: "as (Sidebar)", values: "nav (padrão) · aside · div" },
      { prop: "labels (Sidebar)", values: "navigation (\"Menu lateral\") · mobileTitle (\"Menu de navegação\") · close (\"Fechar menu\")" },
      { prop: "as (SidebarInset)", values: "main (padrão) · div · section" },
      { prop: "label (SidebarTrigger)", values: "padrão \"Alternar barra lateral\"" },
      { prop: "SidebarMenuButton", values: "isActive (aria-current=page) · tooltip (string ou props do TooltipContent) · asChild" },
      { prop: "a11y", values: "landmark nav/aside com aria-label · gaveta mobile com focus trap, Esc e retorno de foco · aria-expanded/aria-controls no gatilho · aria-current=page no item ativo · alvos de 44px · barra offcanvas recolhida fica inert" },
      { prop: "composição", values: "SidebarProvider · Sidebar · SidebarTrigger · SidebarInset · SidebarHeader · SidebarContent · SidebarFooter · SidebarGroup · SidebarGroupLabel · SidebarGroupContent · SidebarMenu · SidebarMenuItem · SidebarMenuButton · SidebarMenuSub · SidebarMenuSubItem · SidebarMenuSubButton · SidebarSeparator · SidebarRail" },
    ],
    usage: `import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@semec/ds/react";
import { LayoutDashboard } from "lucide-react";

<SidebarProvider>
  <Sidebar>
    <SidebarHeader>Logo</SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Menu</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive>Dashboard</SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>Protocolos</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>Footer</SidebarFooter>
  </Sidebar>
  {/* SidebarInset renderiza <main> por padrão: não aninhe outro <main> dentro dele.
      Se o layout já tem o próprio <main>, use <SidebarInset as="div">. */}
  <SidebarInset>
    <SidebarTrigger />
    <div className="p-4">Conteúdo</div>
  </SidebarInset>
</SidebarProvider>

// Item ativo com link (aria-current="page" vem de isActive) e tooltip no modo recolhido
<Sidebar collapsible="icon" labels={{ navigation: "Menu do servidor" }}>
  <SidebarContent>
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive tooltip="Painel">
          <a href="/painel"><LayoutDashboard aria-hidden="true" /><span>Painel</span></a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarContent>
</Sidebar>`,
  },
];

export const dsBySlug = Object.fromEntries(dsComponents.map((c) => [c.slug, c]));
export const dsByCategory = (key) => dsComponents.filter((c) => c.category === key);

/** Nomes importados de `@semec/ds/react` no snippet `usage` (ordem do snippet). */
export function dsImportNames(c) {
  const names = [];
  const re = /import\s*\{([^}]*)\}\s*from\s*["']@semec\/ds\/react["']/g;
  for (const m of (c.usage ?? "").matchAll(re)) {
    for (const raw of m[1].split(",")) {
      const name = raw.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim();
      if (name && !names.includes(name)) names.push(name);
    }
  }
  return names;
}

/**
 * Export principal do componente: `exportName` explícito na entrada, senão o nome
 * importado no `usage` que corresponde ao `code` (`input-otp` → `InputOTP`), senão
 * o primeiro importado, senão o `code` em PascalCase.
 */
export function dsExportName(c) {
  if (c.exportName) return c.exportName;
  const pascal = c.code.replace(/(^|-)([a-z0-9])/g, (_, __, l) => l.toUpperCase());
  const names = dsImportNames(c);
  return names.find((n) => n.toLowerCase() === pascal.toLowerCase()) ?? names[0] ?? pascal;
}

/**
 * Prompt curto por componente (site, manifest.json e components/<slug>.md).
 * Manda USAR o componente publicado, nunca recriá-lo (AUD-67).
 */
export function dsPrompt(c) {
  const v = c.variants.map((x) => `${x.prop}: ${x.values}`).join(" · ");
  const name = dsExportName(c);
  return `Use o componente \`${name}\` (${c.label}) importado de \`@semec/ds/react\`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. ${c.desc}${v ? ` API e variantes: ${v}.` : ""} Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.`;
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
      desc: "Topo com marca, navegação e CTA. Componente `Header` do kit.",
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
