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
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({ className, accept, maxSize, label, hint, error, onChange, ...props }, ref) => {
    const [files, setFiles] = React.useState<File[]>([]);
    const [drag, setDrag] = React.useState(false);
    const [localError, setLocalError] = React.useState<string | undefined>(undefined);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const id = React.useId();

    const acceptFiles = (list: FileList | null) => {
      if (!list) return;
      const next = Array.from(list);
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
      setFiles(next);
      onChange?.(next);
    };

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
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-background px-6 py-8 text-center transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:border-border-strong",
            drag && "border-ring bg-tint",
            (localError ?? error) && "border-destructive",
            className
          )}
        >
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept={accept}
            multiple
            className="sr-only"
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
            <p className="text-xs text-muted-foreground">{hint}</p>
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
        {localError ?? error ? (
          <p role="alert" className="text-xs text-destructive">
            {localError ?? error}
          </p>
        ) : null}
      </div>
    );
  }
);
FileUpload.displayName = "FileUpload";

export { FileUpload };