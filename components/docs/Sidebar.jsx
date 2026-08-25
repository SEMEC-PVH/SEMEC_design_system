"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { navigation } from "@/lib/navigation";
import { safeGet, safeSet } from "@/lib/storage";

const isActive = (pathname, href) => {
  const [path, hash] = href.split("#");
  if (hash) return pathname === path;
  return pathname === href || pathname.startsWith(href + "/");
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
const groupHasActive = (pathname, item) =>
  buildSections(item.items).some(
    (s) =>
      isActive(pathname, s.item.href) ||
      s.children.some((c) => isActive(pathname, c.href))
  );

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
        if (!item.items) return;
        collapsedCache[groupCacheKey(item.key)] =
          safeGet("ds-group-" + item.key) === "0";
        buildSections(item.items).forEach((s) => {
          if (s.children.length > 0) {
            collapsedCache[nestedCacheKey(item.key, s.item.href)] =
              safeGet(nestedStorageKey(item.key, s.item.href)) === "0";
          }
        });
      });
    }
  }
  return collapsedCache;
};

const EMPTY_COLLAPSED = {};
const serverCollapsed = () => EMPTY_COLLAPSED;

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
    updateCollapsed(
      "ds-group-" + key,
      groupCacheKey(key),
      !collapsedCache[groupCacheKey(key)]
    );
  };

  const toggleNested = (groupKey, href) => {
    updateCollapsed(
      nestedStorageKey(groupKey, href),
      nestedCacheKey(groupKey, href),
      !collapsedCache[nestedCacheKey(groupKey, href)]
    );
  };

  // Rota ativa dentro do grupo: exibe o grupo expandido (sem gravar no storage).
  const collapsedGroup = (item) =>
    !!collapsed[groupCacheKey(item.key)] && !groupHasActive(pathname, item);

  const renderSections = (item) =>
    buildSections(item.items).map((section) => {
      if (section.children.length === 0) {
        return (
          <Link
            key={section.item.href + section.item.label}
            href={section.item.href}
            className={
              (section.item.sub ? "sub " : "") +
              (isActive(pathname, section.item.href) ? "active" : "")
            }
          >
            {section.item.label}
          </Link>
        );
      }
      const storedCollapsed = !!collapsed[
        nestedCacheKey(item.key, section.item.href)
      ];
      const hasActiveChild = section.children.some((c) =>
        isActive(pathname, c.href)
      );
      // Rota ativa dentro da categoria: exibe expandida (sem gravar).
      const collapsedNested = storedCollapsed && !hasActiveChild;
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
            {section.item.label}{" "}
            <Caret />
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
                  "sub " + (isActive(pathname, sub.href) ? "active" : "")
                }
              >
                {sub.label}
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
                className={"side-title" + (collapsedGroup(item) ? "" : " open")}
                onClick={() => toggleGroup(item.key)}
                aria-expanded={!collapsedGroup(item)}
                aria-controls={"side-group-" + item.key}
              >
                {item.label}{" "}
                <Caret />
              </button>
              <div
                id={"side-group-" + item.key}
                className={
                  "side-group" + (collapsedGroup(item) ? " collapsed" : "")
                }
              >
                {renderSections(item)}
              </div>
            </div>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(pathname, item.href) ? "active" : ""}
            >
              {item.label}
            </Link>
          )
        )}
      </nav>
    </aside>
  );
}