import * as React from "react";
import { Combobox, DatePicker as Data, InputOTP, InputOTPGroup, InputOTPSlot } from "@semec/ds/react";
import { FileUpload } from "@semec/ds/react/file-upload";
import * as DS from "@semec/ds/react";
import { Combobox as Outro } from "outra-lib";

export function Formulario({ salvar }: { salvar: (v: string) => void }) {
  const [municipio, setMunicipio] = React.useState("");
  const [data, setData] = React.useState("");
  return (
    <form>
      <Combobox
        options={[{ value: "pvh", label: "Porto Velho" }]}
        value={municipio}
        onValueChange={setMunicipio}
      />
      <Data value={data} onValueChange={(v: string) => setData(v)} />
      <Data value={data} onValueChange={(valor) => setData(valor.trim())} />
      <Data value={data} onChange={(e) => setData(e.target.value)} />
      <Data value={data} onChange={salvar} />
      <InputOTP maxLength={6} onValueChange={(codigo) => console.log(codigo)}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
        </InputOTPGroup>
      </InputOTP>
      <FileUpload label="Anexo" onValueChange={(files) => console.log(files.length)} />
      <DS.Calendar onValueChange={(d) => console.log(d)} />
      <DS.Combobox options={[]} onChange={setMunicipio} onValueChange={setMunicipio} />
      <Outro onChange={setMunicipio} />
      <input onChange={(e) => setData(e.target.value)} />
    </form>
  );
}
