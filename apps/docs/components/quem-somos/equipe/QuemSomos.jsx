"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import EquipePagina from "./EquipePagina";
import FichaMembro from "./FichaMembro";
import { membrosDaVila } from "./dados";
import styles from "./QuemSomos.module.css";

const HASH_VILA = "#vila";

// Aviso enquanto o código do jogo (three.js) baixa. Ocupa o lugar do mapa.
function CarregandoVila() {
  return (
    <div className={styles.carregando} role="status" aria-live="polite">
      <span className={styles.giro} aria-hidden="true" />
      Carregando a Vila SEMEC…
    </div>
  );
}

// A Vila é pesada: só baixa quando a pessoa pede para jogar.
const VilaSemec = dynamic(() => import("../VilaSemec"), { ssr: false, loading: CarregandoVila });

// Modo atual, derivado do hash da URL (#vila = jogo). O export estático não
// tem servidor: tudo acontece no cliente, com history.pushState + popstate.
// pushState não dispara evento, então quem muda o hash avisa os assinantes.
const assinantes = new Set();
const avisar = () => assinantes.forEach((fn) => fn());
function assinarHash(fn) {
  assinantes.add(fn);
  window.addEventListener("popstate", fn);
  window.addEventListener("hashchange", fn);
  return () => {
    assinantes.delete(fn);
    window.removeEventListener("popstate", fn);
    window.removeEventListener("hashchange", fn);
  };
}
const lerModo = () => (window.location.hash === HASH_VILA ? "vila" : "equipe");
const modoServidor = () => "equipe";

// Elemento que recebe foco por programa (título): tabIndex -1 se preciso.
function focar(el) {
  if (!el) return false;
  if (!el.hasAttribute("tabindex") && el.tabIndex < 0) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
  return document.activeElement === el;
}

// Página "Quem Somos": primeiro a equipe; a Vila SEMEC 3D só monta (e só
// baixa) quando a pessoa clica em "Jogar na Vila SEMEC" ou abre /quem-somos#vila.
// - "Jogar" empilha #vila no histórico; "Voltar para a equipe" (e o voltar do
//   navegador) tira; os links "#equipe" do jogo também voltam para a equipe.
// - A cada troca feita pela pessoa: rola para o topo e o foco vai para o
//   título do modo novo (ou para "Jogar na Vila SEMEC", ao voltar pelo botão).
export default function QuemSomos() {
  // Destino do foco depois da próxima troca de modo: "titulo" | "jogar".
  // Nulo na carga da página (não rouba o foco de quem acabou de chegar).
  const focoRef = useRef(null);
  // Voltar/avançar do navegador também é troca pedida pela pessoa. Marcado
  // antes de avisar o React: no popstate ele pode renderizar na hora.
  const assinar = useCallback(
    (fn) =>
      assinarHash(() => {
        focoRef.current ??= "titulo";
        fn();
      }),
    [],
  );
  const modo = useSyncExternalStore(assinar, lerModo, modoServidor);
  const [aberto, setAberto] = useState(null);
  const equipeRef = useRef(null);
  const vilaRef = useRef(null);
  const origemRef = useRef(null);
  // A entrada #vila no histórico foi empilhada por nós (dá para voltar).
  const empilhouRef = useRef(false);

  // Troca de modo: topo da página e foco no título do modo novo.
  useEffect(() => {
    const destino = focoRef.current;
    focoRef.current = null;
    if (!destino) return undefined;
    window.scrollTo({ top: 0, left: 0 });

    if (modo === "equipe") {
      const raiz = equipeRef.current;
      if (!raiz) return undefined;
      const jogar = destino === "jogar"
        ? raiz.querySelector("[data-jogar-vila]")
        : null;
      if (jogar) jogar.focus({ preventScroll: true });
      else focar(raiz.querySelector("h1"));
      return undefined;
    }

    // Vila: o título só existe depois que o código do jogo baixa. Até lá, o
    // foco fica no aviso de carregamento (palco), e passa ao título quando ele
    // aparece.
    const raiz = vilaRef.current;
    if (!raiz) return undefined;
    const tentar = () => focar(raiz.querySelector("#vila-titulo"));
    if (tentar()) return undefined;
    focar(raiz);
    const observador = new MutationObserver(() => {
      // Se a pessoa já levou o foco a outro lugar (ex.: "Voltar"), não rouba.
      const ativo = document.activeElement;
      if (ativo !== raiz && ativo !== document.body) observador.disconnect();
      else if (tentar()) observador.disconnect();
    });
    observador.observe(raiz, { childList: true, subtree: true });
    const limite = window.setTimeout(() => observador.disconnect(), 20000);
    return () => {
      observador.disconnect();
      window.clearTimeout(limite);
    };
  }, [modo]);

  const jogar = useCallback(() => {
    focoRef.current = "titulo";
    empilhouRef.current = true;
    window.history.pushState(window.history.state, "", HASH_VILA);
    avisar();
  }, []);

  const voltar = useCallback(() => {
    focoRef.current = "jogar";
    if (empilhouRef.current) {
      empilhouRef.current = false;
      window.history.back();
      return;
    }
    // Chegou direto em /quem-somos#vila: troca a entrada, sem sair da página.
    const { pathname, search } = window.location;
    window.history.replaceState(window.history.state, "", `${pathname}${search}`);
    avisar();
  }, []);

  const abrir = useCallback((membro, elemento) => {
    origemRef.current = elemento ?? document.activeElement;
    setAberto(membro);
  }, []);

  const fechar = useCallback(() => {
    setAberto(null);
    const origem = origemRef.current;
    origemRef.current = null;
    // Depois que o diálogo sai da tela (e a página deixa de ser inerte).
    requestAnimationFrame(() => origem?.focus?.({ preventScroll: false }));
  }, []);

  if (modo === "vila") {
    return (
      <div className="quem-somos-wrapper">
        <div className={styles.barra}>
          <button type="button" className={styles.voltar} onClick={voltar}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
            Voltar para a equipe
          </button>
          <p className={styles.barraTexto}>Vila SEMEC: a equipe em 3D</p>
        </div>
        <div ref={vilaRef} className={styles.palco}>
          <VilaSemec members={membrosDaVila} />
        </div>
      </div>
    );
  }

  return (
    <div ref={equipeRef}>
      <EquipePagina onAbrir={abrir} onJogar={jogar} />
      {aberto && <FichaMembro key={aberto.ficha} membro={aberto} onFechar={fechar} />}
    </div>
  );
}
