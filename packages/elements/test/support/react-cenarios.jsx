/**
 * Os mesmos cenários da bancada (fixtures/bancada.html) com os componentes do
 * kit React, para comparar teclado, foco e estado (Radix) com os elementos.
 * Mesmos ids nos gatilhos para os testes usarem os mesmos seletores.
 */
import React from "react";
import { createRoot } from "react-dom/client";
import * as DS from "semec-kit";

const escolas = [
  { value: "rio-madeira", label: "EMEF Rio Madeira" },
  { value: "santa-marcelina", label: "EMEF Santa Marcelina" },
  { value: "pequeno-principe", label: "EMEI Pequeno Príncipe" },
  { value: "sao-sebastiao", label: "EMEF São Sebastião" },
  { value: "ulisses", label: "EMEIEF Ulisses Guimarães" },
];

function App() {
  return (
    <>
      <p><DS.Button variant="outline" id="antes">Antes</DS.Button></p>

      <DS.Dialog>
        <DS.DialogTrigger asChild><DS.Button id="abrir-dialogo">Editar contato</DS.Button></DS.DialogTrigger>
        <DS.DialogContent>
          <DS.DialogHeader>
            <DS.DialogTitle>Editar contato</DS.DialogTitle>
            <DS.DialogDescription>Altere o telefone do responsável.</DS.DialogDescription>
          </DS.DialogHeader>
          <div>
            <DS.Label htmlFor="telefone">Telefone</DS.Label>
            <DS.Input id="telefone" name="telefone" />
          </div>
          <DS.DialogFooter>
            <DS.DialogClose asChild><DS.Button variant="outline" id="dialogo-cancelar">Cancelar</DS.Button></DS.DialogClose>
            <DS.DialogClose asChild><DS.Button id="dialogo-salvar">Salvar</DS.Button></DS.DialogClose>
          </DS.DialogFooter>
        </DS.DialogContent>
      </DS.Dialog>

      <DS.AlertDialog>
        <DS.AlertDialogTrigger asChild><DS.Button variant="destructive" id="abrir-alerta">Excluir rascunho</DS.Button></DS.AlertDialogTrigger>
        <DS.AlertDialogContent>
          <DS.AlertDialogHeader>
            <DS.AlertDialogTitle>Excluir o rascunho?</DS.AlertDialogTitle>
            <DS.AlertDialogDescription>Esta ação não pode ser desfeita.</DS.AlertDialogDescription>
          </DS.AlertDialogHeader>
          <DS.AlertDialogFooter>
            <DS.AlertDialogCancel id="alerta-cancelar">Cancelar</DS.AlertDialogCancel>
            <DS.AlertDialogAction variant="destructive" id="alerta-excluir">Excluir</DS.AlertDialogAction>
          </DS.AlertDialogFooter>
        </DS.AlertDialogContent>
      </DS.AlertDialog>

      <DS.Tabs defaultValue="dados" id="abas">
        <DS.TabsList aria-label="Seções da matrícula">
          <DS.TabsTrigger value="dados" id="aba-1">Dados</DS.TabsTrigger>
          <DS.TabsTrigger value="documentos" id="aba-2">Documentos</DS.TabsTrigger>
          <DS.TabsTrigger value="historico" id="aba-3">Histórico</DS.TabsTrigger>
        </DS.TabsList>
        <DS.TabsContent value="dados"><p>Nome, data de nascimento e responsável.</p></DS.TabsContent>
        <DS.TabsContent value="documentos"><p>Certidão, comprovante de residência e cartão de vacina.</p></DS.TabsContent>
        <DS.TabsContent value="historico"><p>Matrículas e transferências anteriores.</p></DS.TabsContent>
      </DS.Tabs>

      <div>
        <DS.Label htmlFor="escola">Escola</DS.Label>
        <DS.Combobox id="escola" name="escola" options={escolas} placeholder="Selecione a escola" />
      </div>

      <DS.DropdownMenu>
        <DS.DropdownMenuTrigger asChild><DS.Button variant="outline" id="menu-gatilho">Ações do rascunho</DS.Button></DS.DropdownMenuTrigger>
        <DS.DropdownMenuContent>
          <DS.DropdownMenuItem>Editar</DS.DropdownMenuItem>
          <DS.DropdownMenuItem>Duplicar</DS.DropdownMenuItem>
          <DS.DropdownMenuSeparator />
          <DS.DropdownMenuItem asChild><a href="#arquivado">Arquivar</a></DS.DropdownMenuItem>
          <DS.DropdownMenuItem>Dividir</DS.DropdownMenuItem>
          <DS.DropdownMenuItem disabled>Excluir</DS.DropdownMenuItem>
        </DS.DropdownMenuContent>
      </DS.DropdownMenu>

      <DS.Accordion type="single" collapsible id="acordeao">
        <DS.AccordionItem value="1">
          <DS.AccordionTrigger id="ac-1">Quem pode pedir transferência?</DS.AccordionTrigger>
          <DS.AccordionContent><p>O responsável legal pelo estudante.</p></DS.AccordionContent>
        </DS.AccordionItem>
        <DS.AccordionItem value="2">
          <DS.AccordionTrigger id="ac-2">Quais documentos levar?</DS.AccordionTrigger>
          <DS.AccordionContent><p>Certidão de nascimento e comprovante de residência.</p></DS.AccordionContent>
        </DS.AccordionItem>
        <DS.AccordionItem value="3">
          <DS.AccordionTrigger id="ac-3">Qual é o prazo?</DS.AccordionTrigger>
          <DS.AccordionContent><p>Até 30 de novembro.</p></DS.AccordionContent>
        </DS.AccordionItem>
      </DS.Accordion>

      <p><DS.Button variant="outline" id="depois">Depois</DS.Button></p>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
requestAnimationFrame(() => {
  window.__ready = true;
});
