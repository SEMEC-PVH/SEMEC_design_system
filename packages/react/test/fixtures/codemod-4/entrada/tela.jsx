import { Calendar } from "@semec/ds/react";
import { Button } from "@semec/ds/dist/react/index.js";

export function Tela({ onPick }) {
  return (
    <section className="bg-pv-blue-hero text-pv-white p-space-6">
      <h2 className="text-pv-blue-900 md:hover:text-pv-gray-600">Agenda</h2>
      <Calendar onChange={onPick} />
      <Button className="bg-pv-blue-600 hover:bg-pv-blue-700 focus-visible:ring-pv-blue-hero">Salvar</Button>
      <p className="border-pv-gray-200 bg-pv-black/50">Rodapé</p>
    </section>
  );
}
