"use client";

import * as React from "react";
import { UploadCloud } from "lucide-react";

import { reportRemovedOnChange } from "../lib/removed-prop";
import { cn } from "../lib/utils";
import { useFormField } from "./form-field";

export interface FileUploadLabels {
  /** Nome do campo quando não há `label` nem FormField. Padrão: "Escolher arquivo". */
  chooseFile: string;
  /** Texto da zona antes do destaque. Padrão: "Arraste um arquivo ou". */
  dropzone: string;
  /** Destaque da zona. Padrão: "clique para escolher". */
  dropzoneAction: string;
  /** Erro de tipo não aceito. Padrão: "Tipo de arquivo não permitido.". */
  invalidType: string;
  /** Erro de tamanho; recebe o limite já formatado em PT-BR (ex.: "5 MB", "1,5 MB"). */
  tooLarge: (maxSize: string) => string;
}

const defaultLabels: FileUploadLabels = {
  chooseFile: "Escolher arquivo",
  dropzone: "Arraste um arquivo ou",
  dropzoneAction: "clique para escolher",
  invalidType: "Tipo de arquivo não permitido.",
  tooLarge: (maxSize) => `Arquivo excede o limite de ${maxSize}.`,
};

/**
 * Tipo impossível de satisfazer, com nome que explica o erro: o `onChange`
 * saiu na 4.0 (AUD-35). Com `never`, o `tsc` dizia só "not assignable to type
 * 'undefined'"; com este tipo, a mensagem cita o `onValueChange`.
 */
interface OnChangeRemovidoUseOnValueChange {
  readonly "onChange saiu na 4.0: use onValueChange": never;
}

export interface FileUploadProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  accept?: string;
  maxSize?: number;
  label?: string;
  hint?: string;
  /** Mensagem de erro. Equivale a `invalid` + mensagem (ver ADR-015). */
  error?: string;
  /** Marca o campo como inválido sem mensagem própria (ex.: erro no FormField). */
  invalid?: boolean;
  /** Recebe os arquivos aceitos (contrato de formulário, ADR-015). */
  onValueChange?: (files: File[]) => void;
  /**
   * Removido na 4.0 (AUD-35): use `onValueChange`. O FileUpload não tem
   * `onChange` próprio nem repassa `onChange` ao DOM; o tipo recusa a prop
   * e, em JavaScript, um handler passado aqui é descartado e nunca é chamado
   * (com um `console.error` único em desenvolvimento).
   */
  onChange?: OnChangeRemovidoUseOnValueChange;
  /** `name` do `<input type="file">`. Atalho de `inputProps.name`. */
  name?: string;
  /** `required` do `<input type="file">`. Atalho de `inputProps.required`. */
  required?: boolean;
  /** Desabilita o campo e a zona de soltar. */
  disabled?: boolean;
  /** Arquivos selecionados (modo controlado). Mantém a seleção ao voltar de etapa. */
  value?: File[];
  /** Permite selecionar mais de um arquivo. Padrão: `true`. */
  multiple?: boolean;
  /** `id` do `<input type="file">` (alvo de `<label htmlFor>` e de links do ErrorSummary). */
  id?: string;
  /** Props extras repassadas ao `<input type="file">` (ex.: `name`, `required`). */
  inputProps?: Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "id" | "accept" | "multiple" | "onChange" | "value"
  >;
  /** Textos fixos (PT-BR por padrão). */
  labels?: Partial<FileUploadLabels>;
}

// Vírgula decimal PT-BR e no máximo 1 casa (ADR-016; TST-13): "5 MB", "1,5 MB".
const decimalPtBR = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** Tamanho legível em PT-BR: `512 B`, `1,5 KB`, `5 MB`. */
const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${decimalPtBR.format(bytes / 1024)} KB`;
  return `${decimalPtBR.format(bytes / (1024 * 1024))} MB`;
};

// Mesma regra do atributo `accept`: extensões (".pdf"), MIME exato ou curinga ("image/*").
const matchesAccept = (file: File, accept?: string) => {
  if (!accept) return true;
  const tokens = accept
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith(".")) return name.endsWith(token);
    if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
};

/**
 * Põe `list` em `input.files` (via `DataTransfer`), para que o `<input>`
 * nativo envie no `<form>` e valide `required` com o que a lista mostra.
 * Devolve `false` quando o ambiente não permite (sem `DataTransfer`, ex.:
 * jsdom ou navegador antigo); aí o input fica com a seleção nativa.
 */
const syncInputFiles = (input: HTMLInputElement | null, list: File[]) => {
  if (!input || typeof DataTransfer === "undefined") return false;
  try {
    const transfer = new DataTransfer();
    for (const file of list) transfer.items.add(file);
    input.files = transfer.files;
    return true;
  } catch {
    return false;
  }
};

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      className,
      accept,
      maxSize,
      label,
      hint,
      error,
      invalid: invalidProp,
      onChange: _removedOnChange,
      onValueChange,
      name,
      required,
      disabled,
      value,
      multiple = true,
      id: idProp,
      inputProps,
      labels,
      ...props
    },
    ref
  ) => {
    // onChange saiu na 4.0 (AUD-35): descartado, com erro único em dev.
    if (_removedOnChange !== undefined) reportRemovedOnChange("FileUpload");
    const [internalFiles, setInternalFiles] = React.useState<File[]>([]);
    const files = value ?? internalFiles;
    const [drag, setDrag] = React.useState(false);
    const [localError, setLocalError] = React.useState<string | undefined>(undefined);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const text = { ...defaultLabels, ...labels };
    const generatedId = React.useId();
    // Dentro de um FormField, o input usa o id do campo (alvo do <label for>).
    const field = useFormField();
    const id = idProp ?? field?.controlId ?? generatedId;
    const registerControl = field?.registerControl;
    React.useEffect(() => {
      if (!registerControl) return;
      return registerControl({ id: idProp, labelable: true });
    }, [registerControl, idProp]);
    // Dentro de um FormField, `<id>-hint`/`<id>-error` já são do FormField:
    // a dica e o erro próprios usam outra base para não repetir ids.
    const idBase = field ? `${generatedId}-upload` : id;
    const hintId = `${idBase}-hint`;
    const errorId = `${idBase}-error`;
    const message = localError ?? error;

    // `input.files` acompanha a lista mostrada (seleção, soltar, `value` do
    // pai), para o envio nativo e o `required` funcionarem (D1).
    React.useEffect(() => {
      syncInputFiles(inputRef.current, files);
    }, [files]);

    // Cancelar o seletor depois do clique (que limpa o input, abaixo) devolve
    // ao input a lista atual.
    const filesRef = React.useRef(files);
    filesRef.current = files;
    React.useEffect(() => {
      const input = inputRef.current;
      if (!input) return;
      const restore = () => syncInputFiles(input, filesRef.current);
      input.addEventListener("cancel", restore);
      return () => input.removeEventListener("cancel", restore);
    }, []);

    /** Devolve os arquivos aceitos, ou `null` se nada mudou ou foi recusado. */
    const acceptFiles = (list: FileList | null): File[] | null => {
      if (!list || disabled) return null;
      let next = Array.from(list);
      if (next.length === 0) return null;
      if (!multiple) next = next.slice(0, 1);
      if (next.some((f) => !matchesAccept(f, accept))) {
        setLocalError(text.invalidType);
        return null;
      }
      if (maxSize) {
        const oversized = next.filter((f) => f.size > maxSize);
        if (oversized.length > 0) {
          setLocalError(text.tooLarge(formatBytes(maxSize)));
          return null;
        }
      }
      setLocalError(undefined);
      if (value === undefined) setInternalFiles(next);
      onValueChange?.(next);
      return next;
    };

    const describedBy =
      Array.from(
        new Set(
          [
            inputProps?.["aria-describedby"],
            hint ? hintId : null,
            message ? errorId : null,
            // `invalid={false}` explícito: o erro do FormField não descreve o campo.
            invalidProp === false ? field?.hintId : field?.describedBy,
          ]
            .filter(Boolean)
            .join(" ")
            .split(/\s+/)
            .filter(Boolean)
        )
      ).join(" ") || undefined;
    const invalid = message
      ? true
      : inputProps?.["aria-invalid"] ??
        (invalidProp !== undefined
          ? invalidProp || undefined
          : field?.invalid
            ? true
            : undefined);

    return (
      <div
        ref={ref}
        className={cn("grid gap-1.5", className)}
        {...props}
      >
        {label ? (
          <label htmlFor={id} className="text-sm font-medium text-foreground">
            {label}
          </label>
        ) : null}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            acceptFiles(e.dataTransfer.files);
          }}
          onClick={() => {
            if (!disabled) inputRef.current?.click();
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-surface px-6 py-8 text-center transition-colors duration-fast ease-standard has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background hover:border-border-strong",
            drag && "border-ring bg-tint",
            disabled && "cursor-not-allowed opacity-50",
            (message || invalid === true) && "border-destructive"
          )}
        >
          <input
            aria-label={label || field?.labelId ? undefined : text.chooseFile}
            {...inputProps}
            name={name ?? inputProps?.name}
            required={required ?? inputProps?.required}
            disabled={disabled ?? inputProps?.disabled}
            ref={inputRef}
            id={id}
            type="file"
            accept={accept}
            multiple={multiple}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className={cn("sr-only", inputProps?.className)}
            onClick={(e) => {
              // O clique na zona já abre o seletor; evita reabrir pela propagação.
              e.stopPropagation();
              // Limpa antes de abrir o seletor, para que escolher de novo o
              // mesmo arquivo dispare `change`. Só onde dá para restaurar a
              // lista depois (cancelar, recusa); sem DataTransfer, não mexe.
              if (typeof DataTransfer !== "undefined") e.currentTarget.value = "";
              inputProps?.onClick?.(e);
            }}
            onChange={(e) => {
              const input = e.currentTarget;
              const accepted = acceptFiles(input.files);
              // Recusa ou modo controlado: o input volta à lista mostrada (se o
              // pai aceitar o novo `value`, o efeito acima sincroniza de novo).
              const shown = accepted && value === undefined ? accepted : files;
              if (!syncInputFiles(input, shown) && !accepted) {
                // Sem DataTransfer: não deixa no input um arquivo recusado.
                input.value = "";
              }
            }}
          />
          <UploadCloud className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-foreground">
            {text.dropzone}{" "}
            <span className="font-medium text-primary">{text.dropzoneAction}</span>
          </p>
          {hint ? (
            <p id={hintId} className="text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        {files.length > 0 ? (
          <ul className="space-y-1">
            {files.map((file) => (
              <li
                key={`${file.name}-${file.size}`}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-alt px-3 py-2 text-sm text-foreground"
              >
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {/*
          Região polite sempre montada (sem role="alert"): o erro da validação
          local (tipo/tamanho) é anunciado sem interromper, e o texto também
          fica ligado ao input por aria-describedby (AUD-22).
        */}
        <p
          id={errorId}
          aria-live="polite"
          className={cn("text-xs text-destructive", !message && "sr-only")}
        >
          {message}
        </p>
      </div>
    );
  }
);
FileUpload.displayName = "FileUpload";

export { FileUpload };
