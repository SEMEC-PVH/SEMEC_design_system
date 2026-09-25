"use client";

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
  Button,
} from "semec-ds/react";

export default function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Abrir filtros</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription>Refine sua busca.</SheetDescription>
        </SheetHeader>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Status</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked /> Pendente
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Em andamento
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked /> Concluído
            </label>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Período</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="periodo" defaultChecked /> Últimos 7
              dias
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="periodo" /> Últimos 30 dias
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="periodo" /> Todos
            </label>
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button>Aplicar</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
