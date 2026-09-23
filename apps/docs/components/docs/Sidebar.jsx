"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { SidebarToggleButton } from "semec-ds/react";
import { navigation } from "@/lib/navigation";
import { safeGet, safeSet } from "@/lib/storage";

// Normaliza o pathname que o Next entrega com trailing slash (trailingSlash:
// true) para comparar com os hrefs do navigation, que não o têm.
const stripTrailingSlash = (p) => (p.length > 1 ? p.replace(/\/+$/, "") : p);

// Links com hash (ex.: /fundamentos/cores#cor-blue) só ficam ativos quando o
// hash da URL atual coincide com o do link. Itens folha ativam apenas por
// igualdade exata; `hasChildren` libera o prefixo (item é ancestral de uma
// seção com subitens).
const isActive = (pathname, href, currentHash = "", hasChildren = false) => {
  const [path, hash] = href.split("#");
  const cleanPath = stripTrailingSlash(pathname);
  if (hash) return stripTrailingSlash(path) === cleanPath && currentHash === hash;
  const cleanHref = stripTrailingSlash(href);
  if (hasChildren)
    return cleanPath === cleanHref || cleanPath.startsWith(cleanHref + "/");
  return cleanPath === cleanHref;
};

const MOBILE_QUERY = "(max-width: 900px)";

const GROUP_PREFIX = "group:";
const NESTED_PREFIX = "nested:";
const groupCacheKey = (key) => GROUP_PREFIX + key;
const nestedCacheKey = (key, href) => NESTED_PREFIX + key + href;
const nestedStorageKey = (key, href) => "ds-nested-" + key + href;
const groupId = (key, href) =>
  "side-subgroup-" + key + href.replace(/[^a-z0-9]/gi, "-");

const buildSections = (items) => {
  const sections = [];
  let current = null;
  for (const it of items) {
    if (!it.sub) {
      current = { item: it, children: [] };
      sections.push(current);
    } else if (current) {
      current.children.push(it);
    } else {
      sections.push({ item: it, children: [] });
    }
  }
  return sections;
};

// true se o grupo contém a rota ativa (item direto ou dentro de um subgrupo).
const groupHasActive = (pathname, item, currentHash = "") =>
  buildSections(item.items).some(
    (s) =>
      isActive(pathname, s.item.href, currentHash, s.children.length > 0) ||
      s.children.some((c) => isActive(pathname, c.href, currentHash))
  );

let collapsedCache = null;
const listeners = new Set();
const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

// Subgrupos que nascem colapsados quando o usuário ainda não escolheu nada.
const NESTED_DEFAULT_COLLAPSED = new Set();

const readCollapsed = () => {
  if (collapsedCache === null) {
    collapsedCache = {};
    if (typeof window !== "undefined") {
      navigation.forEach((item) => {
        if (!item.items) return;
        const stored = safeGet("ds-group-" + item.key);
        // Grupos grandes nascem colapsados quando o usuário ainda não
        // escolheu nada; a preferência manual continua valendo.
        const defaultCollapsed =
          item.key === "componentes" || item.key === "padroes";
        collapsedCache[groupCacheKey(item.key)] =
          stored === null ? defaultCollapsed : stored === "0";
        buildSections(item.items).forEach((s) => {
          if (s.children.length > 0) {
            const nestedKey = item.key + ":" + s.item.href;
            const storedNested = safeGet(
              nestedStorageKey(item.key, s.item.href)
            );
            collapsedCache[nestedCacheKey(item.key, s.item.href)] =
              storedNested === null
                ? NESTED_DEFAULT_COLLAPSED.has(nestedKey)
                : storedNested === "0";
          }
        });
      });
    }
  }
  return collapsedCache;
};

const EMPTY_COLLAPSED = {};
const serverCollapsed = () => EMPTY_COLLAPSED;

// Hash atual da URL, observado via `hashchange` (o `usePathname` não o expõe).
let currentHash = "";
let hashLoaded = false;
const hashListeners = new Set();
const subscribeHash = (cb) => {
  hashListeners.add(cb);
  return () => hashListeners.delete(cb);
};
const readHash = () => {
  if (!hashLoaded && typeof window !== "undefined") {
    hashLoaded = true;
    currentHash = window.location.hash.replace(/^#/, "");
  }
  return currentHash;
};
const serverHash = () => "";
const useHash = () => useSyncExternalStore(subscribeHash, readHash, serverHash);

function Caret() {
  return (
    <span className="caret" aria-hidden="true">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 -960 960 960"
        width="24"
        height="24"
        fill="currentColor"
        focusable="false"
      >
        <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
      </svg>
    </span>
  );
}

function updateCollapsed(storageKey, cacheKey, value) {
  const next = { ...collapsedCache, [cacheKey]: value };
  collapsedCache = next;
  safeSet(storageKey, next[cacheKey] ? "0" : "1");
  listeners.forEach((l) => l());
}

export default function Sidebar({ open, onClose, collapsed, onCollapse }) {
  const pathname = usePathname();
  const hash = useHash();
  const groupCollapsed = useSyncExternalStore(
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
    const onHash = () => {
      currentHash = window.location.hash.replace(/^#/, "");
      hashListeners.forEach((l) => l());
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Ao navegar para dentro de um grupo/subgrupo colapsado, expande-o — a rota
  // atual nunca fica oculta, mas o colapso manual continua valendo até a rota
  // sair da categoria (ou o usuário voltar a colapsar nesta página).
  useEffect(() => {
    if (typeof window === "undefined") return;
    let expandedOne = false;
    navigation.forEach((item) => {
      if (!item.items) return;
      const gKey = groupCacheKey(item.key);
      if (groupHasActive(pathname, item, hash) && collapsedCache[gKey]) {
        if (!expandedOne) {
          navigation.forEach((other) => {
            if (!other.items) return;
            const oKey = groupCacheKey(other.key);
            if (other.key !== item.key && !collapsedCache[oKey]) {
              updateCollapsed("ds-group-" + other.key, oKey, true);
            }
          });
          expandedOne = true;
        }
        updateCollapsed("ds-group-" + item.key, gKey, false);
      }
      buildSections(item.items).forEach((s) => {
        if (s.children.length === 0) return;
        const nKey = nestedCacheKey(item.key, s.item.href);
        if (
          s.children.some((c) => isActive(pathname, c.href, hash)) &&
          collapsedCache[nKey]
        ) {
          updateCollapsed(nestedStorageKey(item.key, s.item.href), nKey, false);
        }
      });
    });
  }, [pathname, hash]);

  const toggleGroup = (key) => {
    const willExpand = collapsedCache[groupCacheKey(key)];
    if (willExpand) {
      navigation.forEach((item) => {
        if (!item.items) return;
        if (item.key !== key && !collapsedCache[groupCacheKey(item.key)]) {
          updateCollapsed("ds-group-" + item.key, groupCacheKey(item.key), true);
        }
      });
    }
    updateCollapsed(
      "ds-group-" + key,
      groupCacheKey(key),
      !collapsedCache[groupCacheKey(key)]
    );
  };

  const toggleNested = (groupKey, href) => {
    const willExpand = collapsedCache[nestedCacheKey(groupKey, href)];
    if (willExpand) {
      buildSections(
        navigation.find((n) => n.key === groupKey)?.items ?? []
      ).forEach((s) => {
        if (s.children.length === 0) return;
        if (s.item.href !== href && !collapsedCache[nestedCacheKey(groupKey, s.item.href)]) {
          updateCollapsed(
            nestedStorageKey(groupKey, s.item.href),
            nestedCacheKey(groupKey, s.item.href),
            true
          );
        }
      });
    }
    updateCollapsed(
      nestedStorageKey(groupKey, href),
      nestedCacheKey(groupKey, href),
      !collapsedCache[nestedCacheKey(groupKey, href)]
    );
  };

  // O colapso é sempre o que o usuário escolheu — a rota ativa não o anula.
  const collapsedGroup = (item) => !!groupCollapsed[groupCacheKey(item.key)];

  const renderSections = (item) =>
    buildSections(item.items).map((section) => {
      if (section.children.length === 0) {
        return (
          <Link
            key={section.item.href + section.item.label}
            href={section.item.href}
            className={
              (section.item.sub ? "sub " : "") +
              (isActive(pathname, section.item.href, hash) ? "active" : "")
            }
          >
            <span className="nav-label">{section.item.label}</span>
          </Link>
        );
      }
      const storedCollapsed = !!groupCollapsed[
        nestedCacheKey(item.key, section.item.href)
      ];
      const collapsedNested = storedCollapsed;
      const gid = groupId(item.key, section.item.href);
      return (
        <div key={section.item.href}>
          <button
            type="button"
            className={"side-subtitle" + (collapsedNested ? "" : " open")}
            onClick={() => toggleNested(item.key, section.item.href)}
            aria-expanded={!collapsedNested}
            aria-controls={gid}
          >
            <Caret />
            <span className="nav-label">{section.item.label}</span>
          </button>
          <div
            id={gid}
            className={"side-subgroup" + (collapsedNested ? " collapsed" : "")}
          >
            {section.children.map((sub) => (
              <Link
                key={sub.href + sub.label}
                href={sub.href}
                className={
                  "sub " + (isActive(pathname, sub.href, hash) ? "active" : "")
                }
              >
                <span className="nav-label">{sub.label}</span>
              </Link>
            ))}
          </div>
        </div>
      );
    });

  // Fora da tela em mobile: retira do foco e do leitor de tela.
  // No desktop a sidebar está sempre visível, então nunca fica inerte.
  const inert = isMobile && !open;

  return (
    <aside
      className={"sidebar" + (open ? " open" : "") + (collapsed ? " collapsed" : "")}
      id="sidebar"
      inert={inert}
    >
      <div className="sidebar-scroll">
        <nav aria-label="Seções do guia">
          {navigation.map((item) => (
            <div key={item.key} className={"sidebar-section" + (item.section === "reference" ? " sidebar-section--reference" : "")}>
              {item.items ? (
                <>
                  <button
                    type="button"
                    className={"side-title" + (collapsedGroup(item) ? "" : " open")}
                    onClick={() => toggleGroup(item.key)}
                    aria-expanded={!collapsedGroup(item)}
                    aria-controls={"side-group-" + item.key}
                  >
                    <Caret />
                    <span className="nav-label">{item.label}</span>
                  </button>
                  <div
                    id={"side-group-" + item.key}
                    className={
                      "side-group" + (collapsedGroup(item) ? " collapsed" : "")
                    }
                  >
                    {renderSections(item)}
                  </div>
                </>
              ) : (
                <Link
                  href={item.href}
                  className={
                    "side-title" +
                    (isActive(pathname, item.href, hash) ? " active" : "")
                  }
                >
                  <span className="nav-label">{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
      <div className="sidebar-footer">
        <SidebarToggleButton
          open={collapsed}
          onToggle={onCollapse}
          variant="outline"
          className="sidebar-collapse-btn"
        />
      </div>
    </aside>
  );
}