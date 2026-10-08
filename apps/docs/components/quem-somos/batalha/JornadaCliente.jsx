"use client";

import dynamic from "next/dynamic";

// A jornada lê o progresso salvo no navegador (localStorage): renderiza só
// no cliente para não divergir do HTML estático.
const Jornada = dynamic(() => import("./Jornada"), {
  ssr: false,
  loading: () => <p>Carregando a jornada…</p>,
});

export default function JornadaCliente() {
  return <Jornada />;
}
