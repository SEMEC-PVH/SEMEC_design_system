"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "../lib/utils";

/**
 * TST-26: guarda o `alt` da AvatarImage para o AvatarFallback. Com a foto
 * quebrada, o Radix desmonta a imagem e o leitor de tela lia só as iniciais
 * ("JS"), perdendo o nome da pessoa.
 */
const AvatarAltContext = React.createContext<{
  alt: string | undefined;
  setAlt: (alt: string | undefined) => void;
} | null>(null);

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => {
  const [alt, setAlt] = React.useState<string | undefined>(undefined);
  const value = React.useMemo(() => ({ alt, setAlt }), [alt]);
  return (
    <AvatarAltContext.Provider value={value}>
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      />
    </AvatarAltContext.Provider>
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, alt, ...props }, ref) => {
  const setAlt = React.useContext(AvatarAltContext)?.setAlt;
  React.useEffect(() => {
    if (!setAlt) return;
    setAlt(alt);
    return () => setAlt(undefined);
  }, [alt, setAlt]);
  return (
    <AvatarPrimitive.Image
      ref={ref}
      alt={alt}
      className={cn("aspect-square h-full w-full", className)}
      {...props}
    />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, children, ...props }, ref) => {
  const alt = React.useContext(AvatarAltContext)?.alt;
  // Quando a foto tem `alt` e quem usa não deu nome ao fallback, o fallback
  // anuncia o mesmo nome da foto (texto `sr-only`) e esconde as iniciais do
  // leitor de tela. `alt=""` (foto decorativa) não muda nada.
  const named = Boolean(alt && !props["aria-label"] && !props["aria-labelledby"]);
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground",
        className
      )}
      {...props}
    >
      {named ? (
        <>
          <span aria-hidden="true">{children}</span>
          <span className="sr-only">{alt}</span>
        </>
      ) : (
        children
      )}
    </AvatarPrimitive.Fallback>
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
