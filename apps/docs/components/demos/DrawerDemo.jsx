"use client";

import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
  Button,
} from "semec-ds/react";

export default function DrawerDemo() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Abrir painel</Button>
      </DrawerTrigger>
      <DrawerContent side="right">
        <DrawerHeader>
          <DrawerTitle>Detalhes</DrawerTitle>
          <DrawerDescription>
            Informações do protocolo.
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-6">
          <p>
            Este é o conteúdo do painel. Aqui podem ser exibidos detalhes,
            configurações ou qualquer informação complementar.
          </p>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Fechar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
