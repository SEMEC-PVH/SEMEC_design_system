"use client";

import * as React from "react";

import { Spinner } from "./spinner";

/**
 * Indicador do `Button` durante o `loading` (uso interno; prefira
 * `<Button loading>`): o Spinner decorativo e o bloqueio da ativação.
 *
 * O bloqueio exige um listener de evento, e um Server Component não pode
 * passar função a elemento algum. Por isso ele mora neste módulo
 * `"use client"`, como filho do botão: o `Button` (e `buttonVariants`)
 * continua código de servidor, e o elemento `<button>`/`<a>` é o mesmo com e
 * sem `loading`, então quem estava com o foco nele não o perde.
 *
 * O listener fica no próprio elemento (pai do spinner) e só chama
 * `preventDefault`, que cancela o envio do formulário e a navegação do link.
 * O clique continua subindo: handlers de ancestrais (onClick de um container,
 * analytics no `document`) recebem o evento. Os handlers de quem usa o botão
 * não disparam porque o `Button` não os repassa durante o `loading`.
 */
const ButtonLoadingIndicator = () => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;
    const block = (event: Event) => {
      event.preventDefault();
    };
    host.addEventListener("click", block);
    return () => host.removeEventListener("click", block);
  }, []);

  return <Spinner ref={ref} decorative />;
};
ButtonLoadingIndicator.displayName = "ButtonLoadingIndicator";

export { ButtonLoadingIndicator };
