"use client";

import { useEffect, useId, useSyncExternalStore } from "react";
import { Toaster } from "semec-ds/react";

/**
 * <Toaster /> dos previews do site, com garantia de um só por página.
 *
 * Num app, o <Toaster /> vai UMA vez no layout raiz. Aqui cada preview roda
 * isolado (às vezes num iframe), então cada demo de toast monta o seu. Como o
 * estado do `useToast()` é global, dois Toasters na mesma página mostrariam
 * cada aviso duas vezes e duplicariam a região "Notificações (F8)". Só a
 * primeira instância montada renderiza; se ela desmontar, a próxima assume.
 */
const instances = [];
const listeners = new Set();
const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export default function PreviewToaster() {
  const id = useId();

  useEffect(() => {
    instances.push(id);
    emit();
    return () => {
      const index = instances.indexOf(id);
      if (index >= 0) instances.splice(index, 1);
      emit();
    };
  }, [id]);

  const isOwner = useSyncExternalStore(
    subscribe,
    () => instances[0] === id,
    () => false
  );

  return isOwner ? <Toaster /> : null;
}
