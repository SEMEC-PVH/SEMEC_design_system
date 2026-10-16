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

/**
 * Quantidade por extenso (PT-BR). Descrições que citam "N variantes" derivam o
 * número da própria lista (TST-31: o Button dizia "Seis variantes" com sete).
 * @param {number} n
 * @param {"f" | "m"} genero gênero do substantivo contado
 */
function countPt(n, genero) {
  const palavras = ["zero", genero === "f" ? "uma" : "um", genero === "f" ? "duas" : "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez"];
  return palavras[n] ?? String(n);
}
const capitalize = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** Variantes e tamanhos do Button, na ordem do `buttonVariants` (button.tsx). */
const BUTTON_VARIANTS = ["primary", "secondary", "outline", "ghost", "destructive", "success", "link"];
const BUTTON_SIZES = [
  ["sm", "36px visual, alvo 44px"],
  ["md", "44px"],
  ["lg", "48px"],
  ["icon", "44×44px"],
];

export const dsComponents = [
  {
    code: "button",
    slug: "botoes",
    label: "Botões",
    file: "src/components/button.tsx",
    category: "acoes",
    desc: `Ação principal. ${capitalize(countPt(BUTTON_VARIANTS.length, "f"))} variantes e ${countPt(BUTTON_SIZES.length, "m")} tamanhos; \`asChild\` transforma o botão num link. Todos os tamanhos têm alvo de toque de 44px: \`sm\` mantém o visual de 36px com a área clicável estendida. A altura é mínima (\`min-h-*\`), não fixa: rótulo longo quebra em linhas balanceadas em vez de criar rolagem horizontal; para reduzir a altura com \`className\`, sobrescreva o \`min-h-*\` junto com o \`h-*\`. \`loading\` mostra um Spinner decorativo, aplica \`aria-busy\` e \`aria-disabled\` e bloqueia o clique sem tirar o foco do botão; o nome acessível continua sendo o texto visível.`,
    variants: [
      { prop: "variant", values: BUTTON_VARIANTS.join(" · ") },
      { prop: "size", values: BUTTON_SIZES.map(([size, nota]) => `${size} (${nota})`).join(" · ") },
      { prop: "loading", values: "false (padrão) · true (Spinner decorativo, aria-busy, aria-disabled, clique bloqueado, continua focalizável) · loadingText (texto visível durante o carregamento) · com asChild, o spinner entra no link e o onClick do filho não dispara · o clique ainda sobe aos ancestrais (só envio e navegação são cancelados)" },
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
</Button>

// Envio em andamento: o foco fica no botão e o clique é ignorado
<Button type="submit" loading={enviando} loadingText="Enviando…">
  Enviar requerimento
</Button>`,
  },
  {
    code: "icon-button",
    slug: "botao-de-icone",
    label: "Botão de ícone",
    file: "src/components/icon-button.tsx",
    category: "acoes",
    desc: "Botão quadrado só com ícone. Exige `label` (vira `aria-label` e `title`). `loading` troca o ícone por um Spinner decorativo e mantém o `label` como nome.",
    variants: [
      { prop: "variant", values: "primary · secondary · outline · ghost · destructive · link" },
      { prop: "loading", values: "false (padrão) · true (Spinner no lugar do ícone, aria-busy, aria-disabled, clique bloqueado)" },
    ],
    usage: `import { IconButton } from "@semec/ds/react";
import { Download, Search, Trash2 } from "lucide-react";

<IconButton label="Buscar requerimento"><Search /></IconButton>
<IconButton label="Baixar carnê"><Download /></IconButton>
<IconButton label="Excluir requerimento" variant="destructive"><Trash2 /></IconButton>
<IconButton label="Baixar carnê" loading={baixando}><Download /></IconButton>`,
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
      { prop: "alvo de toque", values: "abaixo de sm, área mínima de 44×44px por um ::after centralizado, sem mudar a altura da linha (ex.: link tel/mailto sozinho num parágrafo); no desktop o ::after não existe" },
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
    desc: "Campo de texto. Estado de erro via `invalid` (vira `aria-invalid`). Dentro de um FormField, recebe `id`, `aria-describedby` (dica + erro) e `aria-invalid` automaticamente. `onChange` é o evento nativo; `onValueChange` recebe só a string.",
    variants: [
      { prop: "estados", values: "padrão · inválido (invalid / aria-invalid) · disabled" },
      { prop: "contrato", values: "value · defaultValue · onValueChange(value) · onChange(evento nativo) · name · id · invalid · disabled · required" },
    ],
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
// → <label for="cpf">, aria-invalid="true", aria-describedby="cpf-error"

// Controlado: onValueChange recebe a string (onChange continua recebendo o evento)
<FormField label="E-mail">
  <Input type="email" name="email" value={email} onValueChange={setEmail} invalid={emailInvalido} />
</FormField>`,
  },
  {
    code: "password-input",
    slug: "campo-de-senha",
    label: "Campo de senha",
    file: "src/components/password-input.tsx",
    category: "formularios",
    desc: "Campo de senha sobre o `Input`, com botão de 44px para mostrar ou ocultar o texto. O botão tem nome fixo (\"Mostrar senha\") e `aria-pressed` (pressionado = senha visível), além de `aria-controls` para o campo. Desliga corretor e maiúscula automática (`spellCheck={false}`, `autoCapitalize=\"none\"`, `autoCorrect=\"off\"`, sobrescrevíveis), que alterariam a senha visível. Repassa todas as props do `Input`, inclusive `autoComplete`.",
    variants: [
      { prop: "visibilidade", values: "defaultVisible · visible + onVisibleChange (controlado)" },
      { prop: "labels", values: "show (padrão \"Mostrar senha\")" },
      { prop: "autoComplete", values: "current-password (login) · new-password (cadastro e troca de senha)" },
    ],
    usage: `import { FormField, PasswordInput } from "@semec/ds/react";

<FormField label="Senha" hint="Mínimo de 8 caracteres">
  <PasswordInput autoComplete="current-password" />
</FormField>

<FormField label="Nova senha">
  <PasswordInput autoComplete="new-password" />
</FormField>`,
  },
  {
    code: "input-mask",
    slug: "campo-com-mascara",
    label: "Campo com máscara",
    file: "src/components/input-mask.tsx",
    category: "formularios",
    desc: "Campo sobre o `Input` que formata enquanto a pessoa digita: CPF, CNPJ, CEP, data, telefone (fixo ou celular, automático) ou padrão próprio (`9` dígito, `A` letra, `*` letra ou dígito). O cursor não pula ao editar no meio; Backspace/Delete junto de um literal apagam o dígito vizinho (também no teclado virtual do Android, via `beforeinput`); colar valor com outra pontuação funciona (nos telefones, o `+55` de país é descartado; num padrão com prefixo fixo, como `0800-999-9999`, um valor colado que já começa com o prefixo não o repete) e o `inputMode` vem da máscara. `onValueChange(masked, raw)` entrega o valor formatado e o sem máscara.",
    variants: [
      { prop: "mask", values: "cpf · cnpj · cep · data · telefone (fixo ou celular pelo nº de dígitos) · telefone-fixo · celular · padrão próprio (ex.: \"AAA-9*99\")" },
      { prop: "valor", values: "defaultValue · value + onValueChange(masked, raw)" },
      { prop: "inputMode", values: "numeric (CPF, CNPJ, CEP, data) · tel (telefones) · sobrescrevível" },
    ],
    usage: `import { FormField, InputMask } from "@semec/ds/react";

<FormField label="CPF" hint="Somente números">
  <InputMask mask="cpf" onValueChange={(masked, raw) => setCpf(raw)} />
</FormField>

<FormField label="Telefone">
  <InputMask mask="telefone" autoComplete="tel-national" />
</FormField>

<FormField label="CEP">
  <InputMask mask="cep" autoComplete="postal-code" />
</FormField>

// Padrão próprio: placa de veículo (9 dígito, A letra, * letra ou dígito)
<FormField label="Placa do veículo">
  <InputMask mask="AAA-9*99" />
</FormField>`,
  },
  {
    code: "textarea",
    slug: "area-de-texto",
    label: "Área de texto",
    file: "src/components/textarea.tsx",
    category: "formularios",
    desc: "Campo multilinha com as mesmas variantes visuais e o mesmo contrato do campo de texto (`onValueChange`, `invalid`).",
    variants: [
      { prop: "estados", values: "padrão · inválido (invalid) · disabled" },
      { prop: "contrato", values: "value · defaultValue · onValueChange(value) · onChange(evento nativo) · name · id · invalid · disabled · required" },
    ],
    usage: `import { FormField, Textarea } from "@semec/ds/react";

<FormField label="Descreva a demanda" hint="Até 500 caracteres">
  <Textarea id="demanda" name="demanda" rows={4} value={demanda} onValueChange={setDemanda} />
</FormField>`,
  },
  {
    code: "select",
    slug: "menu-de-selecao",
    label: "Menu de seleção",
    file: "src/components/select.tsx",
    category: "formularios",
    desc: "Seleção fechada com gatilho, conteúdo e itens compostos. O contrato de formulário fica na raiz (`value`, `defaultValue`, `onValueChange`, `name`, `required`, `disabled`, API Radix) e no gatilho (`id`, `invalid`).",
    variants: [
      { prop: "composição", values: "Select · SelectTrigger · SelectValue · SelectContent · SelectItem" },
      { prop: "contrato", values: "Select: value · defaultValue · onValueChange · name · required · disabled — SelectTrigger: id · invalid" },
    ],
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
  <Select name="municipio" value={municipio} onValueChange={setMunicipio}>
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
      { prop: "props", values: "options · value · defaultValue · onValueChange · placeholder · searchPlaceholder · emptyText · name · id · invalid · required · disabled · labels · portalContainer" },
      { prop: "removidas na 4.0", values: "onChange(value) → use onValueChange (guia docs/migracao-4.0.md; codemod codemod-4)" },
      { prop: "deprecadas", values: "ariaLabel (use rótulo visível ou aria-labelledby) · emptyMessage (use emptyText); anunciadas na 4.0, saem na 5.0" },
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
    onValueChange={setValor}
  />
</FormField>
// name gera um <input type="hidden"> com o valor: vai no FormData de um <form> nativo

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
    variants: [
      { prop: "props", values: "nativo HTML (min · max · disabled · name · required · onChange(evento)) + value · defaultValue · onValueChange(ISO) · invalid · labels.openCalendar" },
      { prop: "mudou na 4.0", values: "onChange é o evento nativo do <input> (até a 3.x recebia a string); para o valor, use onValueChange" },
    ],
    usage: `import { DatePicker, FormField } from "@semec/ds/react";

<FormField label="Data de vencimento" hint="dd/mm/aaaa">
  <DatePicker id="vencimento" name="vencimento" defaultValue="2026-08-31" />
</FormField>

// Controlado: onValueChange recebe o ISO (AAAA-MM-DD)
<FormField label="Data de início" error={erroData}>
  <DatePicker value={inicio} onValueChange={setInicio} />
</FormField>`,
  },
  {
    code: "file-upload",
    slug: "envio-de-arquivos",
    label: "Envio de arquivos",
    file: "src/components/file-upload.tsx",
    category: "formularios",
    desc: "Área de arrastar-e-soltar com lista de arquivos, limite por tamanho e erro. `error` (mensagem) equivale a `invalid` + mensagem; `invalid` sozinho marca o campo sem texto próprio. Com `name`/`required`, funciona em `<form>` nativo: o `input.files` acompanha a lista mostrada (escolha, soltar e `value` do pai). Cada escolha substitui a seleção anterior, como no input nativo; para juntar arquivos de várias escolhas, controle `value` no pai. No Safari anterior à 16.4 (sem o evento `cancel`), cancelar o seletor depois de já haver arquivo esvazia o `input.files`, embora a lista continue mostrando o arquivo, e ele não vai no envio.",
    variants: [
      { prop: "props", values: "accept · maxSize · label · hint · error · invalid · onValueChange(files) · value · multiple · id · name · required · disabled · inputProps · labels" },
      { prop: "removidas na 4.0", values: "onChange(files) → use onValueChange" },
    ],
    usage: `import { FileUpload } from "@semec/ds/react";

// \`label\` é o rótulo do campo de arquivo — não omita
<FileUpload
  label="Documento de identidade"
  accept=".pdf,image/*"
  maxSize={5 * 1024 * 1024}
  hint="PDF ou imagem, até 5 MB"
  value={arquivos}
  onValueChange={setArquivos}
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
    desc: "Caixa de marcação com estado indeterminado. Mantém a API Radix (`checked`/`onCheckedChange`), equivalente a `value`/`onValueChange` no contrato de formulário; `invalid` vira `aria-invalid`.",
    variants: [
      { prop: "estados", values: "desmarcado · marcado (checked) · indeterminado · disabled · inválido (invalid)" },
      { prop: "contrato", values: "checked · defaultChecked · onCheckedChange · name · value (valor enviado) · id · invalid · disabled · required" },
    ],
    usage: `import { Checkbox, Label } from "@semec/ds/react";

<div className="flex items-center gap-2">
  <Checkbox id="termos" />
  <Label htmlFor="termos">Aceito os termos</Label>
</div>

// Controlado, com envio em <form> e erro (checked/onCheckedChange = value/onValueChange)
<div className="flex items-center gap-2">
  <Checkbox id="aceite" name="aceite" checked={aceito} onCheckedChange={(v) => setAceito(v === true)} invalid={!aceito && enviado} />
  <Label htmlFor="aceite">Li e aceito o regulamento</Label>
</div>`,
  },
  {
    code: "radio-group",
    slug: "botao-de-opcao",
    label: "Botão de opção",
    file: "src/components/radio-group.tsx",
    category: "formularios",
    desc: "Escolha única entre duas ou mais opções. Já segue o contrato de formulário (`value`/`defaultValue`/`onValueChange`/`name`, API Radix) e aceita `invalid`.",
    variants: [
      { prop: "composição", values: "RadioGroup · RadioGroupItem + Label" },
      { prop: "contrato", values: "value · defaultValue · onValueChange · name · id · invalid · disabled · required" },
    ],
    usage: `import { RadioGroup, RadioGroupItem, Label } from "@semec/ds/react";

<RadioGroup name="tipoPessoa" defaultValue="pessoa-fisica" onValueChange={setTipoPessoa}>
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
    desc: "Interruptor on/off para ativação imediata. API Radix (`checked`/`onCheckedChange`), equivalente a `value`/`onValueChange` no contrato de formulário; `invalid` vira `aria-invalid`.",
    variants: [
      { prop: "estados", values: "off · on (checked) · disabled · inválido (invalid)" },
      { prop: "contrato", values: "checked · defaultChecked · onCheckedChange · name · value (valor enviado) · id · invalid · disabled · required" },
    ],
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
    desc: "Estrutura do campo: label, obrigatório (*), dica e mensagem de erro na ordem a11y correta. Integra-se ao react-hook-form (via Controller ou register) e esquemas Zod (@semec/ds/react/validacao). Liga o campo filho pelo contexto (`FormFieldContext`): `id` (gerado com `useId` se faltar), `aria-describedby` (dica + erro) e `aria-invalid`. Suporta três padrões de erro: inline, resumo no topo com ErrorSummary e falha de servidor com Alert. Inclui padrão para legenda auxiliar de ação/download em botões de envio.",
    variants: [
      { prop: "props", values: "label · htmlFor · required · hint · error (mensagem; implica invalid) · invalid (sem mensagem) · errorRole (\"alert\" | undefined) · id" },
      { prop: "hooks", values: "useFormField · useFormFieldControl (para campos próprios)" },
      { prop: "padrões", values: "1. Inline (FormField error) · 2. Resumo topo (ErrorSummary) · 3. Servidor (Alert destructive) · Legenda de ação no botão" },
    ],
    usage: `import { FormField, Input, ErrorSummary, Button, useToast, maskCurrency } from "@semec/ds/react";
import { cpfSchema, emailSchema } from "@semec/ds/react/validacao";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

// npm install react-hook-form @hookform/resolvers zod (opcionais, só para esta receita)
const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: emailSchema,
  cpf: cpfSchema,
  valor: z.string().min(1, "Informe o valor"),
});

type FormValues = z.infer<typeof formSchema>;

// Ordem dos campos na tela: o ErrorSummary segue esta lista (não a ordem do objeto errors)
const ORDEM_CAMPOS = ["nome", "email", "cpf", "valor"] as const satisfies readonly (keyof FormValues)[];

export function FormularioExemplo() {
  const { toast } = useToast();
  const [tentativa, setTentativa] = useState(0);
  const { register, control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: "", email: "", cpf: "", valor: "" },
    // Sem isto o RHF foca o 1º campo inválido e o ErrorSummary nunca recebe o foco
    shouldFocusError: false,
  });

  // Padrão 2: Resumo consolidado no topo, na ordem da tela
  const errorSummaryItems = ORDEM_CAMPOS.flatMap((id) => {
    const message = errors[id]?.message;
    return message ? [{ id, message }] : [];
  });

  const onSubmit = (data: FormValues) => {
    void data;
    // Padrão de sucesso via Toast:
    toast({ variant: "success", title: "Sucesso!", description: "Dados gravados com sucesso." });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () => setTentativa((t) => t + 1))}
      noValidate
      className="max-w-xl space-y-4"
    >
      {errorSummaryItems.length > 0 && (
        <ErrorSummary title="Corrija os erros destacados" errors={errorSummaryItems} focusKey={tentativa} />
      )}

      {/* Padrão 1: Erro inline ligado via aria-describedby e aria-invalid */}
      <FormField label="Nome completo" htmlFor="nome" required error={errors.nome?.message}>
        <Input id="nome" {...register("nome")} />
      </FormField>

      <FormField label="E-mail" htmlFor="email" required error={errors.email?.message}>
        <Input id="email" type="email" {...register("email")} />
      </FormField>

      {/* Uso canônico com Controller para componentes controlados ou máscaras */}
      <Controller
        name="cpf"
        control={control}
        render={({ field }) => (
          <FormField label="CPF" htmlFor="cpf" required error={errors.cpf?.message}>
            <Input id="cpf" inputMode="numeric" {...field} />
          </FormField>
        )}
      />

      {/* Campo R$: maskCurrency("") devolve "", então min(1) barra o vazio */}
      <Controller
        name="valor"
        control={control}
        render={({ field }) => (
          <FormField label="Valor da taxa" htmlFor="valor" required error={errors.valor?.message}>
            <Input
              id="valor"
              inputMode="numeric"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={field.value}
              onValueChange={(v) => field.onChange(maskCurrency(v))}
            />
          </FormField>
        )}
      />

      {/* Padrão de Ação com Legenda Auxiliar de Ação / Download */}
      <div className="pt-2 space-y-2">
        <Button type="submit" variant="primary">Gerar requerimento</Button>
        <p className="text-xs text-text-muted">
          Ao clicar, o arquivo PDF do requerimento será gerado e baixado automaticamente.
        </p>
      </div>
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
    desc: "Resumo de erros de validação no topo do formulário, com links para cada campo (`id` do campo, ou `name` como recuo). A11y: `role=\"alert\"`, foco automático só quando o `focusKey` muda (passe `focusKey={tentativa}`, somado a cada envio inválido; sem `focusKey`, foca ao passar de 0 para N erros). O resumo que some e volta enquanto a pessoa digita não rouba o foco. Título ligado por id gerado. Liste os itens na ordem dos campos na tela; com React Hook Form, use `shouldFocusError: false`. Sem margem externa: espace pelo layout (ex.: `className=\"mb-6\"`).",
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
    desc: "Título semântico h1–h6 com a escala tipográfica do kit. O nível (level) segue a estrutura da página; o tamanho (size) segue o visual. Escala: 1 = `text-3xl` (32px, título da página), 2 = `text-2xl` (24px), 3 = `text-xl` (20px), 4 = `text-base`, 5 = `text-sm`, 6 = `text-xs` em caixa alta.",
    variants: [
      { prop: "level", values: "1 · 2 (padrão) · 3 · 4 · 5 · 6" },
      { prop: "size", values: "1–6 (padrão: igual ao level) · 1 = 32px · 2 = 24px · 3 = 20px · 4 = 16px · 5 = 14px · 6 = 12px" },
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
      { prop: "a11y", values: "aria-label=Trilha de navegação · aria-current=page no último item · aria-hidden nos separadores · abaixo de sm, links com alvo mínimo de 44×44px (min-h-11 + ::after de largura)" },
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
      { prop: "com Sidebar", values: "Header dentro do SidebarInset (as=\"div\"), antes do <main id=\"conteudo\">; SkipLink antes do SidebarProvider. Antes do provider o Header fica sob a Sidebar fixa e a marca recebe foco sem aparecer" },
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
    code: "stepper",
    slug: "etapas",
    label: "Etapas",
    file: "src/components/stepper.tsx",
    category: "navegacao",
    desc: "Etapas de um processo (ex.: requerimento em 3 passos) numa lista ordenada. A etapa atual tem `aria-current=\"step\"` e cada etapa diz em texto (para leitor de tela) se está concluída, atual ou pendente, não só pela cor. Horizontal a partir de 768px e empilhado em telas estreitas. Com `onStepClick`, as etapas concluídas e a atual viram botões de 44px.",
    variants: [
      { prop: "orientation", values: "horizontal (padrão; empilha abaixo de 768px) · vertical" },
      { prop: "estados", values: "concluída (check) · atual (borda e texto em negrito) · pendente; sempre com texto sr-only" },
      { prop: "interação", values: "onStepClick(index) · isStepClickable(index, status) (padrão: concluídas e atual)" },
      { prop: "labels", values: "list · position(n, total) · complete · current · upcoming" },
    ],
    usage: `import { Stepper } from "@semec/ds/react";

const etapas = [
  { label: "Dados do estudante" },
  { label: "Documentos", description: "RG, CPF e comprovante de residência" },
  { label: "Revisão e envio" },
];

<Stepper steps={etapas} currentStep={1} />

// Voltar a uma etapa já preenchida
<Stepper steps={etapas} currentStep={2} onStepClick={(i) => setEtapa(i)} />`,
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
    desc: "Controle de páginas com elipses (janela por `siblingCount`). Navegação por teclado completa. Botões de 44px que não encolhem. Abaixo de `sm` ficam só as setas e a página atual ± 1 (primeira, última e elipses ocultas). Textos em PT-BR, sobrescrevíveis por `labels`.",
    variants: [
      { prop: "props", values: "page · pageCount · onPageChange · siblingCount · labels?: Partial<{ navigation, previous, next, page(n) }>" },
      { prop: "siblingCount", values: "páginas de cada lado da atual · padrão 1 · aceita 0 (só a atual entre as elipses) · negativo conta como 0 · abaixo de sm, no máximo 1" },
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
    usage: `import * as React from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, Button } from "@semec/ds/react";

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
function EdicaoControlada() {
  const [aberto, setAberto] = React.useState(false);
  // Tipe o ref (TS strict): sem o tipo, origemRef.current vira never.
  const origemRef = React.useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button ref={origemRef} onClick={() => setAberto(true)}>Editar</Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent onCloseAutoFocus={(e) => { e.preventDefault(); origemRef.current?.focus(); }}>
          <DialogHeader>
            <DialogTitle>Editar contato</DialogTitle>
            <DialogDescription>Atualize o telefone do responsável.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}`,
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
      { prop: "deprecadas", values: "modal (AlertDialog) · onPointerDownOutside · onInteractOutside (AlertDialogContent): ignoradas desde a 3.1.0; anunciadas na 4.0, saem na 5.0" },
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
    desc: "Foto de perfil com fallback automático (iniciais). Com a foto quebrada, o `AvatarFallback` anuncia o `alt` da `AvatarImage` (as iniciais ficam só visuais); um `aria-label` no `AvatarFallback` continua aceito e tem prioridade.",
    variants: [
      { prop: "composição", values: "Avatar · AvatarImage · AvatarFallback" },
      { prop: "a11y", values: "alt da AvatarImage = nome da pessoa (vale também para o fallback) · alt vazio para foto decorativa (o fallback não anuncia) · aria-label no AvatarFallback vence o alt" },
      { prop: "tamanhos", values: "h-10 w-10 (padrão) — sobrescreva com className" },
    ],
    usage: `import { Avatar, AvatarImage, AvatarFallback } from "@semec/ds/react";

// Se a foto falhar, o leitor de tela continua ouvindo "João Silva" (não "JS")
<Avatar>
  <AvatarImage src="/foto.jpg" alt="João Silva" />
  <AvatarFallback>JS</AvatarFallback>
</Avatar>

// Sem foto: dê o nome no próprio fallback
<Avatar>
  <AvatarFallback aria-label="Maria Souza">MS</AvatarFallback>
</Avatar>`,
  },
  {
    code: "toggle",
    slug: "toggle",
    label: "Toggle",
    file: "src/components/toggle.tsx",
    category: "formularios",
    desc: "Botão binário para estados on/off em toolbars (`pressed`/`onPressedChange`, API Radix). Não é controle de formulário: não envia valor em `<form>` nem tem `name`/`invalid`; para opção de formulário, use Checkbox ou Switch. Alvo de toque de 44px em todos os tamanhos. Ligado = fundo `tint` + contorno de 2px em `primary` (5,00:1 sobre `--bg`, 5,42:1 sobre branco) e texto `foreground`; o estado vai ao leitor de tela por `aria-pressed`.",
    variants: [
      { prop: "variant", values: "default (solto sem borda) · outline (solto com borda input)" },
      { prop: "estado ligado", values: "data-state=on · aria-pressed=true · fundo tint · contorno primary de 2px (borda + inset-ring) · hover escurece para primary-hover" },
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
    desc: "Indicador de carregamento inline (role=status). Com `decorative`, é só visual (sem role, aria-label nem texto sr-only), para quando outro elemento já anuncia o carregamento; é o que o `Button` com `loading` usa.",
    variants: [
      { prop: "label", values: "texto anunciado (padrão \"Carregando\")" },
      { prop: "decorative", values: "false (padrão, role=status) · true (aria-hidden, sem nome; raiz <span>)" },
    ],
    usage: `import { Spinner } from "@semec/ds/react";

<Spinner label="Carregando protocolos" />
<p className="text-muted-foreground">Carregando dados…</p>

// Só visual: o texto ao lado já diz o que está acontecendo
<p className="flex items-center gap-2"><Spinner decorative /> Atualizando a lista…</p>`,
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
    desc: "Controle deslizante para faixas de valor. Contrato de formulário pela API Radix (`value`/`defaultValue`/`onValueChange` com `number[]`, `name`); `invalid` vira `aria-invalid` nos polegares.",
    variants: [{ prop: "contrato", values: "value · defaultValue · onValueChange(number[]) · name · id · invalid · disabled" }],
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
      { prop: "props", values: "value · defaultValue · onValueChange · name (input oculto) · form · id · invalid · required · maxLength · disabled · labels (group · slot(index, total))" },
      { prop: "removidas na 4.0", values: "onChange(value) → use onValueChange" },
    ],
    usage: `import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@semec/ds/react";

// name gera um <input type="hidden"> com o código: vai no FormData de um <form> nativo
<InputOTP name="codigo" value={code} onValueChange={setCode} maxLength={6}>
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
      { prop: "props", values: "value · onValueChange · min · max (AAAA-MM-DD, data local) · disabled · labels?: Partial<{ previousMonth, nextMonth }>" },
      { prop: "removidas na 4.0", values: "onChange(date) → use onValueChange" },
      { prop: "a11y", values: "role=grid rotulado pelo mês (aria-live=polite) · roving tabindex · aria-selected · aria-current=date no dia de hoje · aria-disabled fora de min/max · nome \"14 de outubro de 2026\"" },
      { prop: "teclado", values: "←/→ dia · ↑/↓ semana · Home/End início/fim da semana · PageUp/PageDown mês · Shift+PageUp/PageDown ano · Enter/Espaço seleciona" },
    ],
    usage: `import { Calendar } from "@semec/ds/react";

<Calendar value={data} onValueChange={setData} />

<Calendar value={data} onValueChange={setData} min="2026-01-01" max="2026-12-31" />`,
  },
  {
    code: "scroll-area",
    slug: "scroll-area",
    label: "Área de scroll",
    file: "src/components/scroll-area.tsx",
    category: "navegacao",
    desc: "Scroll customizado e consistente entre navegadores. A região rolável é alcançável pelo teclado: sem nada focável dentro (ex.: texto puro), a viewport vira parada de Tab com anel de foco (`focusable=\"auto\"`, o padrão). Dê nome à região com `viewportProps={{ \"aria-label\": \"…\" }}`.",
    variants: [
      { prop: "composição", values: "ScrollArea · ScrollBar" },
      { prop: "orientation", values: "vertical · horizontal" },
      { prop: "focusable", values: "\"auto\" (padrão: focável só sem conteúdo focável dentro) · true (sempre) · false (nunca; só se o conteúdo garantir outro caminho de teclado)" },
      { prop: "viewportProps", values: "props da viewport (ex.: aria-label da região focável, className)" },
    ],
    usage: `import { ScrollArea } from "@semec/ds/react";

// Texto puro: a viewport recebe tabIndex=0; o aria-label nomeia a região
<ScrollArea className="h-48" viewportProps={{ "aria-label": "Termos de uso" }}>
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
    usage: `import * as React from "react";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose, Button } from "@semec/ds/react";

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
  const origemRef = React.useRef<HTMLButtonElement>(null);
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
    desc: "Tabela com ordenação, paginação e estados vazios. Com `onRowClick`, passe `rowLabel` para dar nome à linha clicável.",
    variants: [
      { prop: "props", values: "columns · data · sortKey · sortDir · onSort · page · pageCount · onPageChange · onRowClick · rowLabel?: (row, index) => string (aria-label da linha; use com onRowClick) · emptyMessage · caption · labels (sortBy: descrição \"Ordenar por …\" do botão de ordenação, via aria-describedby, não o nome dele · pageOf · previous · next)" },
      { prop: "a11y", values: "columnheader e botão de ordenação nomeados só pela coluna; \"Ordenar por …\" como descrição (aria-describedby) · aria-sort no cabeçalho ordenado · botão de ordenação com alvo de 44px · linha focável e ativável por Enter/Espaço quando há onRowClick · rowLabel nomeia a linha clicável · cliques e teclas em controles da célula (e em portais abertos por ela) não ativam a linha · rodapé empilha abaixo de sm · paginação com alvos de 44px" },
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
/>

// Linha inteira clicável (uma ação só): rowLabel diz ao leitor de tela o que o Enter faz
<DataTable
  caption="Protocolos abertos"
  columns={[
    { key: "numero", header: "Número", sortable: true },
    { key: "status", header: "Status" },
  ]}
  data={protocolos}
  onRowClick={(protocolo) => abrirProtocolo(protocolo)}
  rowLabel={(protocolo) => "Abrir protocolo " + protocolo.numero}
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
    desc: "Navegação principal com mega-menu e viewport animado. O `<nav>` se chama \"Menu principal\" por padrão (sobrescreva com `aria-label`). Gatilhos de 44px. O `NavigationMenuLink` já vem estilizado: alvo de 44px (`min-h-11`), `px-4`, hover/foco em `tint` e anel de foco por dentro; `active` marca a página atual com `aria-current=\"page\"`.",
    variants: [
      { prop: "composição", values: "NavigationMenu · List · Item · Trigger · Content · Link · Viewport · Indicator" },
      { prop: "estilos exportados", values: "navigationMenuTriggerStyle() (visual de gatilho, ex.: link solto na lista) · navigationMenuLinkStyle() (estilo padrão do NavigationMenuLink, para links próprios)" },
      { prop: "a11y", values: "aria-label padrão \"Menu principal\" · Tab/ArrowDown entram no conteúdo aberto · Esc fecha e devolve o foco · aria-hidden-focus aberto é exceção EXC-01 (sentinela do Radix)" },
    ],
    usage: `import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink } from "@semec/ds/react";

<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Serviços</NavigationMenuTrigger>
      <NavigationMenuContent className="p-2">
        {/* NavigationMenuLink já tem 44px de altura, px-4 e foco visível */}
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
    usage: `import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SkipLink, Header, HeaderBrand, Heading } from "@semec/ds/react";
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

// Painel com Header (composição única, TST-04): SkipLink antes do SidebarProvider,
// Header dentro do SidebarInset (as="div") e o <main> depois do Header.
// Header antes do provider fica sob a Sidebar fixa (marca focada sem aparecer).
<>
  <SkipLink />
  <SidebarProvider>
    <Sidebar>{/* … */}</Sidebar>
    <SidebarInset as="div">
      <Header>
        {/* Gatilho e marca num grupo à esquerda (o Header é justify-between) */}
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger />
          <HeaderBrand href="/" logo={<img src="/marca.svg" alt="Prefeitura de Porto Velho" />} serviceName="Gestão de protocolos" />
        </div>
      </Header>
      <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-[75rem] px-4 py-8">
        <Heading level={1}>Protocolos</Heading>
      </main>
    </SidebarInset>
  </SidebarProvider>
</>

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
