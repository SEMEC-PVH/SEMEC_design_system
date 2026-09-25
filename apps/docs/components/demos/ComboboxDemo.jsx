"use client";

import { useState } from "react";
import { Combobox } from "semec-ds/react";

const DOCUMENTOS = [
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "rg", label: "RG" },
  { value: "certidao", label: "Certidão" },
];

export default function ComboboxDemo() {
  const [valor, setValor] = useState("");

  return (
    <Combobox
      options={DOCUMENTOS}
      value={valor}
      onChange={setValor}
      placeholder="Selecione o documento"
    />
  );
}
