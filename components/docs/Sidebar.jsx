"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { navigation, navState } from "@/lib/navigation";
import { safeGet, safeSet } from "@/lib/storage";

const MOBILE_QUERY = "(max-width: 900px)";

let collapsedCache = null;
const listeners = new Set();
const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const readCollapsed = () => {
  if (collapsedCache === null) {
    collapsedCache = {};
    if (typeof window !== "undefined") {
      navigation.forEach((item) => {
        if (item.items) {
          collapsedCache[item.key] = safeGet("ds-group-" + item.key) === "0";
        }
      });
    }
  }
  return collapsedCache;
};

const EMPTY_COLLAPSED = {};
const serverCollapsed = () => EMPTY_COLLAPSED;

function updateCollapsed(key, value) {
  const next = { ...collapsedCache, [key]: value };
  collapsedCache = next;
  safeSet("ds-group-" + key, next[key] ? "0" : "1");
  listeners.forEach((l) => l());
}

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    subscribe,
    readCollapsed,
    serverCollapsed
  );
  // Começa em `false` para que o primeiro render (servidor e cliente) nunca
  // marque a sidebar como inerte — o valor real chega no efeito abaixo.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(MOBILE_QUERY);
    const sync = (e) => setIsMobile(e.matches);
    sync(mql);
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  const toggleGroup = (key) => {
    updateCollapsed(key, !collapsedCache[key]);
  };

  // Fora da tela em mobile: retira do foco e do leitor de tela.
  // No desktop a sidebar está sempre visível, então nunca fica inerte.
  const inert = isMobile && !open;

  return (
    <aside
      className={"sidebar" + (open ? " open" : "")}
      id="sidebar"
      inert={inert}
    >
      <nav aria-label="Seções do guia">
        {navigation.map((item) =>
          item.items ? (
            <div key={item.key}>
              <button
                type="button"
                className={"side-title" + (collapsed[item.key] ? "" : " open")}
                onClick={() => toggleGroup(item.key)}
                aria-expanded={!collapsed[item.key]}
                aria-controls={"side-group-" + item.key}
              >
                {item.label}{" "}
                <span className="caret" aria-hidden="true">
                  ▶
                </span>
              </button>
              <div
                id={"side-group-" + item.key}
                className={
                  "side-group" + (collapsed[item.key] ? " collapsed" : "")
                }
              >
                {item.items.map((sub) => {
                  const estado = navState(pathname, sub.href);
                  return (
                    <Link
                      key={sub.href + sub.label}
                      href={sub.href}
                      className={
                        (sub.sub ? "sub " : "") + (estado ? "active" : "")
                      }
                      // Só a página aberta se anuncia como atual. A
                      // categoria que a contém fica destacada, mas
                      // anunciá-la também diria que há duas páginas atuais.
                      aria-current={estado === "current" ? "page" : undefined}
                    >
                      {sub.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={navState(pathname, item.href) ? "active" : ""}
              aria-current={
                navState(pathname, item.href) === "current" ? "page" : undefined
              }
            >
              {item.label}
            </Link>
          )
        )}
      </nav>
    </aside>
  );
}