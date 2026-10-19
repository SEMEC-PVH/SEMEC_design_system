"use client";

import * as React from "react";

// Contexto por árvore: o nonce dos viewports também está disponível no SSR.
export const NonceContext = React.createContext<string | undefined>(undefined);

export function useNonce(nonce?: string) {
  const inheritedNonce = React.useContext(NonceContext);
  return nonce ?? inheritedNonce;
}
