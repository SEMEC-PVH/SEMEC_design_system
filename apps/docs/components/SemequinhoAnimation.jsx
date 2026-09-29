"use client";

import { useId } from "react";

export default function SemequinhoAnimation({ className }) {
  const id = useId();

  return (
    <div className={className} style={{ width: "100%", maxWidth: 640 }}>
      <iframe
        src={`${process.env.NEXT_PUBLIC_BASE_PATH}/semequinho-hero.html`}
        title="Mascote Semequinho animado"
        loading="lazy"
        sandbox="allow-scripts"
        style={{
          width: "100%",
          aspectRatio: "30201 / 20485",
          border: "none",
          borderRadius: 14,
          background: "transparent",
          display: "block",
        }}
      />
    </div>
  );
}
