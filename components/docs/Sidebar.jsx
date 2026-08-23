"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navigation } from "@/lib/navigation";
import { safeGet, safeSet } from "@/lib/storage";

const isActive = (pathname, href) => {
  const [path, hash] = href.split("#");
  if (hash) return pathname === path;
  return pathname === href || pathname.startsWith(href + "/");
};

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    const saved = {};
    navigation.forEach((item) => {
      if (item.items) {
        saved[item.key] = safeGet("ds-group-" + item.key) === "0";
      }
    });
    setCollapsed(saved);
  }, []);

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  const toggleGroup = (key) => {
    const next = { ...collapsed, [key]: !collapsed[key] };
    setCollapsed(next);
    safeSet("ds-group-" + key, next[key] ? "0" : "1");
  };

  return (
    <aside className={"sidebar" + (open ? " open" : "")} id="sidebar">
      {navigation.map((item) =>
        item.items ? (
          <div key={item.key}>
            <button
              type="button"
              className={"side-title" + (collapsed[item.key] ? "" : " open")}
              onClick={() => toggleGroup(item.key)}
              aria-expanded={!collapsed[item.key]}
              aria-controls={"group-" + item.key}
            >
              {item.label} <span className="caret" aria-hidden="true">▶</span>
            </button>
            <div
              id={"group-" + item.key}
              className={
                "side-group" + (collapsed[item.key] ? " collapsed" : "")
              }
            >
              {item.items.map((sub) => (
                <Link
                  key={sub.href + sub.label}
                  href={sub.href}
                  className={
                    (sub.sub ? "sub " : "") +
                    (isActive(pathname, sub.href) ? "active" : "")
                  }
                >
                  {sub.label}
                </Link>
              ))}
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
    </aside>
  );
}