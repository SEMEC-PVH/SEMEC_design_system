"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { safeGet, safeSet } from "@/lib/storage";

const KEY = "cookie-consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!safeGet(KEY)) setVisible(true);
  }, []);

  const decide = (value) => {
    safeSet(KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="region" aria-label="Aviso de cookies">
      <div className="cookie-banner-content">
        <h2 className="cookie-banner-title">
          Cookies no Design System da SEMEC Porto Velho
        </h2>
        <p>
          Gostaríamos de usar cookies analíticos para entender como você
          utiliza o Design System e fazer melhorias.
        </p>
        <p>
          Também usamos cookies essenciais para lembrar se você aceitou os
          cookies analíticos.
        </p>
      </div>
      <div className="cookie-banner-actions">
        <button onClick={() => decide("accepted")}>
          Aceitar cookies analíticos
        </button>
        <button onClick={() => decide("declined")}>
          Recusar cookies analíticos
        </button>
        <Link href="/cookies" className="cookie-banner-view">
          Ver cookies
        </Link>
      </div>
    </div>
  );
}
