"use client";

// Botão de tela cheia da Vila SEMEC: coloca a <section class="vila"> inteira
// (mapa + HUD + diálogos) em tela cheia. Some nos navegadores sem a
// Fullscreen API (ex.: iPhone). Esc sai da tela cheia (comportamento do
// navegador).
import { useRef, useSyncExternalStore } from "react";
import { Maximize, Minimize } from "lucide-react";
import styles from "./FullscreenButton.module.css";

const fsElement = () => document.fullscreenElement ?? document.webkitFullscreenElement ?? null;

// Estado da tela cheia como "store" externo: no prerender estático não há
// API (servidor = sem botão); no cliente, acompanha fullscreenchange.
function subscribe(onChange) {
  document.addEventListener("fullscreenchange", onChange);
  document.addEventListener("webkitfullscreenchange", onChange);
  return () => {
    document.removeEventListener("fullscreenchange", onChange);
    document.removeEventListener("webkitfullscreenchange", onChange);
  };
}
const getSupported = () => {
  const el = document.documentElement;
  return Boolean(el.requestFullscreen || el.webkitRequestFullscreen);
};
const getActive = () => Boolean(fsElement());
const serverFalse = () => false;

export default function FullscreenButton({ className = "" }) {
  const ref = useRef(null);
  const supported = useSyncExternalStore(subscribe, getSupported, serverFalse);
  const active = useSyncExternalStore(subscribe, getActive, serverFalse);

  if (!supported) return null;

  const toggle = () => {
    if (fsElement()) {
      (document.exitFullscreen ?? document.webkitExitFullscreen)?.call(document);
      return;
    }
    const target = ref.current?.closest(".vila");
    if (!target) return;
    const req = target.requestFullscreen ?? target.webkitRequestFullscreen;
    Promise.resolve(req?.call(target)).catch(() => {});
  };

  const label = active ? "Sair da tela cheia" : "Jogar em tela cheia";
  return (
    <button ref={ref} type="button" className={`${styles.btn} ${className}`} onClick={toggle} aria-label={label} title={label}>
      {active ? <Minimize aria-hidden="true" size={18} /> : <Maximize aria-hidden="true" size={18} />}
    </button>
  );
}
