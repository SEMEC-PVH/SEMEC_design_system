import * as React from "react";
import { UploadCloud } from "lucide-react";

import { cn } from "../lib/utils";

export interface FileUploadProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  accept?: string;
  maxSize?: number;
  label?: string;
  hint?: string;
  error?: string;
  onChange?: (files: File[]) => void;
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
      onChange,
      value,
      multiple = true,
      id: idProp,
      inputProps,
      ...props
    },
    ref
  ) => {
    const [internalFiles, setInternalFiles] = React.useState<File[]>([]);
    const files = value ?? internalFiles;
    const [drag, setDrag] = React.useState(false);
    const [localError, setLocalError] = React.useState<string | undefined>(undefined);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const generatedId = React.useId();
    const id = idProp ?? generatedId;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const message = localError ?? error;

    const acceptFiles = (list: FileList | null) => {
      if (!list) return;
      let next = Array.from(list);
      if (next.length === 0) return;
      if (!multiple) next = next.slice(0, 1);
      if (next.some((f) => !matchesAccept(f, accept))) {
        setLocalError("Tipo de arquivo não permitido.");
        return;
      }
      if (maxSize) {
        const oversized = next.filter((f) => f.size > maxSize);
        if (oversized.length > 0) {
          setLocalError(
            `Arquivo excede o limite de ${formatBytes(maxSize)}.`
          );
          return;
        }
      }
      setLocalError(undefined);
      if (value === undefined) setInternalFiles(next);
      onChange?.(next);
    };

    const describedBy =
      [inputProps?.["aria-describedby"], hint ? hintId : null, message ? errorId : null]
        .filter(Boolean)
        .join(" ") || undefined;

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
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-background px-6 py-8 text-center transition-colors duration-fast ease-standard has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background hover:border-border-strong",
            drag && "border-ring bg-tint",
            message && "border-destructive"
          )}
        >
          <input
            aria-label={label ? undefined : "Escolher arquivo"}
            {...inputProps}
            ref={inputRef}
            id={id}
            type="file"
            accept={accept}
            multiple={multiple}
            aria-describedby={describedBy}
            aria-invalid={message ? true : inputProps?.["aria-invalid"]}
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
            Arraste um arquivo ou <span className="font-medium text-primary">clique para escolher</span>
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
        {message ? (
          <p id={errorId} role="alert" className="text-xs text-destructive">
            {message}
          </p>
        ) : null}
      </div>
    );
  }
);
FileUpload.displayName = "FileUpload";

export { FileUpload };
