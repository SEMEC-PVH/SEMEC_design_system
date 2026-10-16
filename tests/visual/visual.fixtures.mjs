/**
 * Estados extras da regressão visual: só o que o gate NÃO cobre.
 *
 * O estado padrão de cada componente vem de `getComponentElement`
 * (scripts/gate/check-smoke-a11y.mjs) e as camadas abertas vêm de
 * `openStateCases` (scripts/gate/open-states.fixtures.mjs). Aqui ficam
 * disabled / invalid / marcado / variantes e alguns conteúdos longos
 * (estresse de quebra de linha no mobile). Hover e foco visível são
 * produzidos pelo próprio teste (mouse e Tab), sobre o estado padrão.
 *
 * Cada fábrica recebe o namespace do kit (`ds`) e devolve um elemento React.
 * As chaves são lidas no Node pelo spec (sem renderizar nada).
 */
import React from "react";

const h = React.createElement;
const pilha = (...children) => h("div", { className: "flex flex-col gap-4 max-w-md" }, ...children);
const linha = (...children) => h("div", { className: "flex flex-wrap items-center gap-3" }, ...children);

const BUTTON_VARIANTS = ["primary", "secondary", "outline", "ghost", "destructive", "success", "link"];
const BADGE_VARIANTS = ["default", "secondary", "outline", "success", "warning", "danger", "info"];

export const extraStates = {
  button: {
    variantes: (ds) =>
      pilha(
        linha(...BUTTON_VARIANTS.map((v) => h(ds.Button, { key: v, variant: v }, `Botão ${v}`))),
        linha(
          h(ds.Button, { size: "sm" }, "Pequeno"),
          h(ds.Button, { size: "md" }, "Médio"),
          h(ds.Button, { size: "lg" }, "Grande")
        )
      ),
    disabled: (ds) => linha(...BUTTON_VARIANTS.map((v) => h(ds.Button, { key: v, variant: v, disabled: true }, `Botão ${v}`))),
    "texto-longo": (ds) => h(ds.Button, null, "Enviar requerimento de matrícula para análise da secretaria"),
  },
  "icon-button": {
    disabled: (ds) => h(ds.IconButton, { "aria-label": "Fechar", disabled: true }, "×"),
  },
  input: {
    disabled: (ds) => h(ds.Input, { "aria-label": "Nome", defaultValue: "Maria da Silva", disabled: true }),
    invalid: (ds) => h(ds.Input, { "aria-label": "Nome", defaultValue: "M", invalid: true }),
  },
  "password-input": {
    disabled: (ds) => h(ds.PasswordInput, { "aria-label": "Senha", defaultValue: "segredo123", disabled: true }),
    invalid: (ds) => h(ds.PasswordInput, { "aria-label": "Senha", defaultValue: "123", invalid: true }),
  },
  "input-mask": {
    invalid: (ds) => h(ds.InputMask, { "aria-label": "CPF", mask: "cpf", defaultValue: "123", invalid: true }),
  },
  textarea: {
    disabled: (ds) => h(ds.Textarea, { "aria-label": "Observações", defaultValue: "Sem observações.", disabled: true }),
    invalid: (ds) => h(ds.Textarea, { "aria-label": "Observações", defaultValue: "", invalid: true }),
  },
  select: {
    disabled: (ds) =>
      h(
        ds.Select,
        { defaultValue: "pvh", disabled: true },
        h(ds.SelectTrigger, { "aria-label": "Município" }, h(ds.SelectValue, null)),
        h(ds.SelectContent, null, h(ds.SelectItem, { value: "pvh" }, "Porto Velho"))
      ),
    invalid: (ds) =>
      h(
        ds.Select,
        null,
        h(ds.SelectTrigger, { "aria-label": "Município", invalid: true }, h(ds.SelectValue, { placeholder: "Selecione" })),
        h(ds.SelectContent, null, h(ds.SelectItem, { value: "pvh" }, "Porto Velho"))
      ),
  },
  combobox: {
    disabled: (ds) =>
      h(ds.Combobox, { "aria-label": "Município", options: [{ value: "pvh", label: "Porto Velho" }], disabled: true }),
    invalid: (ds) =>
      h(ds.Combobox, { "aria-label": "Município", options: [{ value: "pvh", label: "Porto Velho" }], invalid: true }),
  },
  "date-picker": {
    disabled: (ds) => h(ds.DatePicker, { "aria-label": "Data de nascimento", defaultValue: "2015-03-20", disabled: true }),
    invalid: (ds) => h(ds.DatePicker, { "aria-label": "Data de nascimento", invalid: true }),
  },
  "file-upload": {
    disabled: (ds) => h(ds.FileUpload, { label: "Anexo", disabled: true }),
    invalid: (ds) => h(ds.FileUpload, { label: "Anexo", error: "Envie o comprovante de residência." }),
  },
  checkbox: {
    marcado: (ds) =>
      pilha(
        h(ds.Checkbox, { "aria-label": "Marcado", defaultChecked: true }),
        h(ds.Checkbox, { "aria-label": "Indeterminado", checked: "indeterminate" })
      ),
    disabled: (ds) =>
      linha(
        h(ds.Checkbox, { "aria-label": "Desmarcado desabilitado", disabled: true }),
        h(ds.Checkbox, { "aria-label": "Marcado desabilitado", disabled: true, defaultChecked: true })
      ),
    invalid: (ds) => h(ds.Checkbox, { "aria-label": "Termos", invalid: true }),
  },
  "radio-group": {
    disabled: (ds) =>
      h(
        ds.RadioGroup,
        { defaultValue: "a", disabled: true, "aria-label": "Turno" },
        h(ds.RadioGroupItem, { value: "a", "aria-label": "Manhã" }),
        h(ds.RadioGroupItem, { value: "b", "aria-label": "Tarde" })
      ),
    invalid: (ds) =>
      h(
        ds.RadioGroup,
        { invalid: true, "aria-label": "Turno" },
        h(ds.RadioGroupItem, { value: "a", "aria-label": "Manhã" }),
        h(ds.RadioGroupItem, { value: "b", "aria-label": "Tarde" })
      ),
  },
  switch: {
    marcado: (ds) => h(ds.Switch, { "aria-label": "Notificações", defaultChecked: true }),
    disabled: (ds) =>
      linha(
        h(ds.Switch, { "aria-label": "Desligado desabilitado", disabled: true }),
        h(ds.Switch, { "aria-label": "Ligado desabilitado", disabled: true, defaultChecked: true })
      ),
  },
  slider: {
    disabled: (ds) => h(ds.Slider, { defaultValue: [30], max: 100, "aria-label": "Raio", disabled: true }),
  },
  toggle: {
    pressionado: (ds) => h(ds.Toggle, { "aria-label": "Negrito", defaultPressed: true }, "B"),
    disabled: (ds) => h(ds.Toggle, { "aria-label": "Negrito", disabled: true }, "B"),
  },
  "input-otp": {
    invalid: (ds) =>
      h(
        ds.InputOTP,
        { maxLength: 4, "aria-label": "Código", invalid: true },
        h(ds.InputOTPGroup, null, ...[0, 1, 2, 3].map((i) => h(ds.InputOTPSlot, { key: i, index: i })))
      ),
  },
  "form-field": {
    erro: (ds) =>
      h(
        ds.FormField,
        { label: "CPF", htmlFor: "cpf-erro", required: true, hint: "Somente números.", error: "Informe um CPF válido." },
        h(ds.Input, { id: "cpf-erro", defaultValue: "123" })
      ),
  },
  badge: {
    variantes: (ds) => linha(...BADGE_VARIANTS.map((v) => h(ds.Badge, { key: v, variant: v }, `Badge ${v}`))),
  },
  tabs: {
    "aba-desabilitada": (ds) =>
      h(
        ds.Tabs,
        { defaultValue: "a" },
        h(
          ds.TabsList,
          null,
          h(ds.TabsTrigger, { value: "a" }, "Dados pessoais"),
          h(ds.TabsTrigger, { value: "b" }, "Documentos"),
          h(ds.TabsTrigger, { value: "c", disabled: true }, "Revisão")
        ),
        h(ds.TabsContent, { value: "a" }, "Conteúdo de dados pessoais")
      ),
  },
  breadcrumb: {
    "texto-longo": (ds) =>
      h(ds.Breadcrumb, {
        items: [
          { label: "Início", href: "/" },
          { label: "Serviços educacionais", href: "/servicos" },
          { label: "Transporte escolar rural", href: "/servicos/transporte" },
          { label: "Solicitação de inclusão de estudante na rota", active: true },
        ],
      }),
  },
  stepper: {
    "cinco-etapas": (ds) =>
      h(ds.Stepper, {
        steps: [
          { label: "Dados do responsável" },
          { label: "Dados do estudante" },
          { label: "Documentos" },
          { label: "Escola pretendida" },
          { label: "Revisão e envio" },
        ],
        currentStep: 2,
      }),
  },
  pagination: {
    "muitas-paginas": (ds) => h(ds.Pagination, { page: 12, pageCount: 40, onPageChange: () => {} }),
  },
  header: {
    "texto-longo": (ds) =>
      h(
        ds.Header,
        null,
        h(ds.HeaderBrand, {
          orgName: "Secretaria Municipal de Educação",
          serviceName: "Sistema Integrado de Gestão de Matrículas da Rede Municipal",
          logo: h("span", { "aria-hidden": "true", className: "inline-block size-8 rounded-full bg-primary" }),
        }),
        h(
          ds.HeaderNav,
          null,
          h(ds.HeaderNavLink, { href: "#a", current: true }, "Início"),
          h(ds.HeaderNavLink, { href: "#b" }, "Matrículas"),
          h(ds.HeaderNavLink, { href: "#c" }, "Relatórios")
        )
      ),
  },
  "data-table": {
    "valores-ptbr": (ds) =>
      h(ds.DataTable, {
        caption: "Repasses do mês",
        columns: [
          { header: "Escola", key: "escola", sortable: true },
          { header: "Data do repasse", key: "data" },
          { header: "Valor", key: "valor" },
          { header: "Situação", key: "situacao" },
        ],
        data: [
          { escola: "EMEF Professora Maria Aparecida dos Santos", data: "16/10/2026", valor: "R$ 1.234,56", situacao: "Pago" },
          { escola: "EMEIEF Rio Madeira", data: "01/11/2026", valor: "R$ 98.765,43", situacao: "Em análise" },
        ],
        page: 1,
        pageCount: 3,
        onPageChange: () => {},
      }),
  },
  // O fixture do smoke (Toast solto em ToastProvider) não desenha nada visível;
  // aqui vai o uso documentado no manifest: <Toaster /> + toast().
  toast: {
    disparado: (ds) =>
      h(function Disparo() {
        const { toast } = ds.useToast();
        React.useEffect(() => {
          const longo = 1e9; // não fecha sozinho durante o print
          toast({ title: "Protocolo enviado", description: "Nº 2026/000123 em 16/10/2026.", variant: "success", duration: longo });
          toast({ title: "Pagamento recusado", description: "Valor de R$ 1.234,56 não confirmado.", variant: "destructive", duration: longo });
          toast({ title: "Rascunho salvo", duration: longo });
        }, [toast]);
        return h(ds.Toaster);
      }),
  },
  alert: {
    "texto-longo": (ds) =>
      h(
        ds.Alert,
        { variant: "warning" },
        h(ds.AlertTitle, null, "Prazo de rematrícula termina em 31/10/2026"),
        h(
          ds.AlertDescription,
          null,
          "Responsáveis que não confirmarem a vaga até a data limite perderão a prioridade na escola atual e entrarão na lista geral de espera da rede municipal."
        )
      ),
  },
};

export function extraStateNames(code) {
  return Object.keys(extraStates[code] ?? {});
}
