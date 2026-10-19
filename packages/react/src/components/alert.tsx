import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { cn } from "../lib/utils";
import type { HeadingTag } from "./heading";

const alertVariants = cva(
  "relative w-full rounded-lg border border-border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:h-4 [&>svg]:w-4",
  {
    variants: {
      variant: {
        default: "border-info/40 bg-info-surface text-foreground [&>svg]:text-info",
        success:
          "border-success/40 bg-success-surface text-foreground [&>svg]:text-success",
        warning:
          "border-warning/40 bg-warning-surface text-foreground [&>svg]:text-warning",
        destructive:
          "border-destructive/40 bg-destructive-surface text-foreground [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>["variant"]>;

const iconMap: Record<AlertVariant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: AlertCircle,
};

/**
 * Como o aviso é anunciado por leitor de tela:
 * - `assertive`: `role="alert"` (interrompe a leitura; só para erro que pede ação imediata);
 * - `polite`: `role="status"` (lido na próxima pausa);
 * - `off`: sem região viva (aviso estático, já presente ao carregar a página).
 */
export type AlertAnnounce = "assertive" | "polite" | "off";

/**
 * Padrão por variante: só `destructive` interrompe. `warning` é `polite` porque
 * avisos (indisponibilidade, prazo) raramente exigem ação imediata e vários
 * `role="alert"` na mesma tela geram anúncios assertivos em excesso (AUD-22).
 */
const announceByVariant: Record<AlertVariant, AlertAnnounce> = {
  default: "polite",
  success: "polite",
  warning: "polite",
  destructive: "assertive",
};

const roleByAnnounce: Record<AlertAnnounce, "alert" | "status" | undefined> = {
  assertive: "alert",
  polite: "status",
  off: undefined,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /**
   * Sobrescreve o anúncio padrão da variante (`destructive` → `assertive`;
   * demais → `polite`). Uma prop `role` explícita tem precedência.
   */
  announce?: AlertAnnounce;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", announce, role, children, ...props }, ref) => {
    const resolvedVariant: AlertVariant = variant ?? "default";
    const Icon = iconMap[resolvedVariant];
    const resolvedRole =
      role ?? roleByAnnounce[announce ?? announceByVariant[resolvedVariant]];
    return (
      <div
        ref={ref}
        role={resolvedRole}
        className={cn(alertVariants({ variant }), "pl-10", className)}
        {...props}
      >
        <Icon className="absolute left-4 top-4" aria-hidden="true" />
        {children}
      </div>
    );
  }
);
Alert.displayName = "Alert";

export interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * Elemento do título. Padrão: `div` — o título do aviso é um rótulo, não
   * uma seção da página, e o antigo `<h5>` fixo quebrava a ordem dos títulos
   * (`heading-order`). Passe `h2`–`h6` quando o aviso abrir uma seção.
   */
  as?: HeadingTag;
}

const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className, as: Tag = "div", ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn("mb-1 font-semibold leading-tight tracking-tight", className)}
      {...props}
    />
  )
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-sm [&_p]:leading-relaxed [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-1.5 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:space-y-1.5",
      className
    )}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };