import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import {
  Checkbox, HeaderBrand, HeaderNav, HeaderNavLink, Progress, RadioGroup,
  RadioGroupItem, ScrollArea, Select, SelectContent, SelectItem, SelectTrigger,
  SelectValue, Slider, Switch, ToastAction, Toaster, useToast,
} from "@semec/ds/react";
// Misturar subpath e barrel deve compartilhar o mesmo contexto.
import { SemecProvider } from "@semec/ds/react/semec-provider";

export function App() {
  const [clicked, setClicked] = React.useState(false);
  const [action, setAction] = React.useState(false);
  const { toast } = useToast();
  React.useEffect(() => { document.documentElement.dataset.hydrated = "true"; }, []);
  return (
    <SemecProvider nonce="semec-integracao">
      <header className="flex justify-between">
        <HeaderBrand logo={<span aria-hidden="true">S</span>} serviceName="Integração" />
        <HeaderNav>
          <HeaderNavLink href="#destino" onClick={() => setClicked(true)}>Destino</HeaderNavLink>
        </HeaderNav>
      </header>
      <main className="p-8 space-y-8">
        <p id="destino">{clicked ? "Link acionado" : "Aguardando clique"}</p>
        <form className="space-y-8">
          <label className="flex min-h-11 items-center gap-2"><Checkbox name="aceite" />Aceite</label>
          <label className="flex min-h-11 items-center gap-2"><Switch name="avisos" />Avisos</label>
          <RadioGroup name="turno" aria-label="Turno" defaultValue="manha">
            <label className="flex min-h-11 items-center gap-2"><RadioGroupItem value="manha" />Manhã</label>
            <label className="flex min-h-11 items-center gap-2"><RadioGroupItem value="tarde" />Tarde</label>
          </RadioGroup>
          <Slider name="volume" aria-label="Volume" defaultValue={[40]} className="w-80" />
          <Progress value={3} max={4} aria-label="Etapas" className="w-80" />
          <Select name="escola">
            <SelectTrigger aria-label="Escola"><SelectValue placeholder="Escolha" /></SelectTrigger>
            <SelectContent><SelectItem value="a">Escola A</SelectItem></SelectContent>
          </Select>
        </form>
        <ScrollArea className="h-20" viewportProps={{ "aria-label": "Conteúdo rolável" }}>
          {Array.from({ length: 10 }, (_, index) => <p key={index}>Linha {index + 1}</p>)}
        </ScrollArea>
        <button onClick={() => toast({ title: "Aviso de teste", duration: Infinity,
          action: <ToastAction altText="Confirmar aviso" onClick={() => setAction(true)}>Confirmar</ToastAction>,
        })}>Notificar</button>
        <p>{action ? "Ação acionada" : "Aguardando ação"}</p>
        <Toaster />
      </main>
    </SemecProvider>
  );
}

export function hydrate() {
  hydrateRoot(document.getElementById("root")!, <App />);
}
