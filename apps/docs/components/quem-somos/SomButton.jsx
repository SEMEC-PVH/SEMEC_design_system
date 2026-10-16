"use client";

// Botão de som do HUD (ao lado da tela cheia): troca entre "Tudo", "Só
// efeitos" e "Desligado" (som/som.js, lembrado no navegador). Mesmo visual
// do FullscreenButton.
import { useSyncExternalStore } from "react";
import { Volume1, Volume2, VolumeX } from "lucide-react";
import { assinarSom, desbloquear, lerSom, proximaOpcaoSom, ROTULO_SOM, salvarSom } from "./som/som";
import { tocar } from "./som/sfx";
import styles from "./FullscreenButton.module.css";

const ICONE = { tudo: Volume2, efeitos: Volume1, desligado: VolumeX };

export default function SomButton({ className = "" }) {
  const som = useSyncExternalStore(assinarSom, lerSom, () => "tudo");
  const Icone = ICONE[som] ?? Volume2;
  const proxima = proximaOpcaoSom(som);
  const label = `Som: ${ROTULO_SOM[som]}. Trocar para ${ROTULO_SOM[proxima]}`;
  return (
    <button
      type="button"
      className={`${styles.btn} ${className}`}
      aria-label={label}
      title={label}
      onClick={() => {
        desbloquear();
        salvarSom(proxima);
        tocar("ui-ok");
      }}
    >
      <Icone aria-hidden="true" size={18} />
    </button>
  );
}
