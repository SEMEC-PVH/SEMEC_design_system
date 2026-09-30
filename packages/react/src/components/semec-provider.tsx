"use client";

import * as React from "react";
import { setNonce } from "get-nonce";

interface SemecProviderProps {
  /** CSP nonce aplicado a todos os <style> injetados pelo React (Radix, remove-scroll). */
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
 * - Componentes que aceitam `nonce` diretamente: Select e ScrollArea
 *   (esconder scrollbar nativa).
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

  return <>{children}</>;
}

SemecProvider.displayName = "SemecProvider";

export { SemecProvider, type SemecProviderProps };
