"use client";

import * as React from "react";
import { setNonce } from "get-nonce";
import { NonceContext } from "../lib/nonce-context";

export interface SemecProviderProps {
  /** Nonce dos estilos de Select/ScrollArea e do scroll lock; não libera atributos style do SSR. */
  nonce?: string;
  children: React.ReactNode;
}

/**
 * Provedor raiz do design system SEMEC.
 *
 * Quando `nonce` é fornecido, distribui o valor para:
 * - `get-nonce` (utilizado por `react-style-singleton`): aplica nonce em
 *   todos os `<style>` injetados por Dialog, Drawer, Sheet, DropdownMenu,
 *   Popover e AlertDialog (scroll-locking via `react-remove-scroll`).
 * - Contexto React (inclusive no SSR): SelectContent e ScrollArea repassam
 *   o nonce ao Viewport Radix para esconder a scrollbar nativa.
 *   O nonce explícito do componente tem precedência sobre o contexto.
 * Atributos `style` no HTML do servidor não são autorizados por nonce.
 *
 * Uso:
 * ```tsx
 * <SemecProvider nonce={serverNonce}>
 *   <App />
 * </SemecProvider>
 * ```
 */
function SemecProvider({ nonce, children }: SemecProviderProps) {
  React.useEffect(() => {
    if (nonce) {
      setNonce(nonce);
    }
  }, [nonce]);

  return <NonceContext.Provider value={nonce}>{children}</NonceContext.Provider>;
}

SemecProvider.displayName = "SemecProvider";

export { SemecProvider };
