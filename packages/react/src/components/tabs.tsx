"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "../lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // TST-29: sem quebra nem rolagem própria, a lista vazava 5px em 320px e
      // rolava a página. Agora não passa da largura do pai (`max-w-full`) e
      // rola na horizontal dentro de si (`overflow-x-auto`). `justify-center-safe`
      // centraliza só quando cabe: com overflow, a primeira aba não fica cortada
      // à esquerda. O `p-1` acomoda o anel de foco (2px + offset 2px).
      "inline-flex min-h-11 max-w-full items-center justify-center-safe overflow-x-auto rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // AUD-38: a aba ativa não depende só de cor. Além do fundo, ganha peso
      // semibold e uma barra de 3px em `primary` na base (4,97:1 contra a
      // lista `muted` e 5,00:1 contra o fundo da aba ativa; mínimo 3:1).
      // AUD-10: alvo mínimo de 44px (`min-h-11`).
      "relative inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-fast ease-standard after:pointer-events-none after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-full after:bg-transparent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-elevation-1 data-[state=active]:after:bg-primary forced-colors:after:forced-color-adjust-none forced-colors:data-[state=active]:after:bg-[Highlight]",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };