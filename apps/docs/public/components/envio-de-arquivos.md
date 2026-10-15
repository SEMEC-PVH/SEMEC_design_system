---
title: "Envio de arquivos"
code: "file-upload"
slug: "envio-de-arquivos"
file: "src/components/file-upload.tsx"
category: "formularios"
variants: "props: accept · maxSize · label · hint · error · invalid · onValueChange(files) · value · multiple · id · name · required · disabled · inputProps · labels · deprecadas: onChange(files) (use onValueChange; sai na 4.0)"
---

# Envio de arquivos — `file-upload`

> Área de arrastar-e-soltar com lista de arquivos, limite por tamanho e erro. `error` (mensagem) equivale a `invalid` + mensagem; `invalid` sozinho marca o campo sem texto próprio.

**Arquivo:** `src/components/file-upload.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/envio-de-arquivos`

## Variantes

- **props**: accept · maxSize · label · hint · error · invalid · onValueChange(files) · value · multiple · id · name · required · disabled · inputProps · labels
- **deprecadas**: onChange(files) (use onValueChange; sai na 4.0)

## Instalação (@semec/ds)

```bash
npm install @semec/ds
```

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

## Uso

```tsx
import { FileUpload } from "@semec/ds/react";

// `label` é o rótulo do campo de arquivo — não omita
<FileUpload
  label="Documento de identidade"
  accept=".pdf,image/*"
  maxSize={5 * 1024 * 1024}
  hint="PDF ou imagem, até 5 MB"
  value={arquivos}
  onValueChange={setArquivos}
/>

// Textos fixos sobrescrevíveis (padrão PT-BR)
<FileUpload label="Anexo" labels={{ invalidType: "Envie só PDF.", tooLarge: (max) => `Máximo de ${max}.` }} />
```

## Prompt para IA

```text
Use o componente `FileUpload` (Envio de arquivos) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Área de arrastar-e-soltar com lista de arquivos, limite por tamanho e erro. `error` (mensagem) equivale a `invalid` + mensagem; `invalid` sozinho marca o campo sem texto próprio. API e variantes: props: accept · maxSize · label · hint · error · invalid · onValueChange(files) · value · multiple · id · name · required · disabled · inputProps · labels · deprecadas: onChange(files) (use onValueChange; sai na 4.0). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import { UploadCloud } from "lucide-react";

import { cn } from "../lib/utils";
import { warnDeprecated } from "../lib/deprecation";
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
  /** Erro de tamanho; recebe o limite já formatado (ex.: "5.0 MB"). */
  tooLarge: (maxSize: string) => string;
}

const defaultLabels: FileUploadLabels = {
  chooseFile: "Escolher arquivo",
  dropzone: "Arraste um arquivo ou",
  dropzoneAction: "clique para escolher",
  invalidType: "Tipo de arquivo não permitido.",
  tooLarge: (maxSize) => `Arquivo excede o limite de ${maxSize}.`,
};

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
  /** @deprecated Use `onValueChange` (mesma assinatura). Sai na 4.0 (AUD-35). */
  onChange?: (files: File[]) => void;
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

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      onChange,
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
    if (onChange) {
      warnDeprecated(
        "FileUpload.onChange",
        "FileUpload: `onChange(files)` está obsoleto e sai na 4.0. Use `onValueChange(files)`."
      );
    }

    const acceptFiles = (list: FileList | null) => {
      if (!list || disabled) return;
      let next = Array.from(list);
      if (next.length === 0) return;
      if (!multiple) next = next.slice(0, 1);
      if (next.some((f) => !matchesAccept(f, accept))) {
        setLocalError(text.invalidType);
        return;
      }
      if (maxSize) {
        const oversized = next.filter((f) => f.size > maxSize);
        if (oversized.length > 0) {
          setLocalError(text.tooLarge(formatBytes(maxSize)));
          return;
        }
      }
      setLocalError(undefined);
      if (value === undefined) setInternalFiles(next);
      onValueChange?.(next);
      onChange?.(next);
    };

    const describedBy =
      Array.from(
        new Set(
          [
            inputProps?.["aria-describedby"],
            hint ? hintId : null,
            message ? errorId : null,
            field?.describedBy,
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
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-background px-6 py-8 text-center transition-colors duration-fast ease-standard has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background hover:border-border-strong",
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
              inputProps?.onClick?.(e);
            }}
            onChange={(e) => {
              acceptFiles(e.target.files);
              e.currentTarget.value = "";
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

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
