"use client";

/* eslint-disable react-hooks/set-state-in-effect -- TOC sincroniza DOM externo (rehype-slug ids) com estado React */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/-+/g, "-");
}

export default function TableOfContents() {
  const pathname = usePathname();
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const root = document.querySelector(".content .container");
    if (!root) return;

    const nodes = [...root.querySelectorAll("h2, h3")].filter(
      (h) => !h.closest(".no-toc") && !h.closest(".demo-frame") && !h.closest(".preview")
    );

    // rehype-slug já gerou id para .mdx; fallback slugify para .jsx legado
    const seen = new Map();
    const list = nodes.map((h) => {
      if (!h.id) {
        let base = slugify(h.textContent || "");
        if (!base) base = "secao";
        let id = base;
        let n = 2;
        while (seen.has(id) || document.getElementById(id)) {
          id = `${base}-${n++}`;
        }
        h.id = id;
      }
      // dedup map para fallback futuro (mesmo texto)
      seen.set(h.id, true);
      return {
        id: h.id,
        text: (h.textContent || "").trim(),
        level: h.tagName.toLowerCase(),
      };
    });

    setHeadings(list);

    if (list.length < 2) {
      setActiveId("");
      return;
    }

    // scroll spy
    const observer = new IntersectionObserver(
      (entries) => {
        // pega o mais visível no topo
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    nodes.forEach((h) => observer.observe(h));

    // hash inicial (link direto #id)
    if (window.location.hash) {
      setActiveId(window.location.hash.slice(1));
    }

    const onHashChange = () => setActiveId(window.location.hash.slice(1));
    window.addEventListener("hashchange", onHashChange);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [pathname]);

  if (headings.length < 2) return null;

  return (
    <aside className="toc" aria-label="Nesta página">
      <div className="toc-title">Nesta página</div>
      <nav>
        <ol>
          {headings.map((h) => (
            <li key={h.id} className={`toc-item toc-${h.level}`}>
              <a
                href={`#${h.id}`}
                aria-current={activeId === h.id ? "true" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  history.pushState(null, "", `#${h.id}`);
                  setActiveId(h.id);
                }}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  );
}
