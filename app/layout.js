import localFont from "next/font/local";
import "./globals.css";

const poppins = localFont({
  src: [
    { path: "./fonts/Poppins-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Poppins-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Poppins-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Poppins-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/Poppins-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

const pressStart = localFont({
  src: [
    { path: "./fonts/PressStart2P-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-press-start",
  display: "swap",
});

const mono = localFont({
  src: [
    {
      path: "./fonts/JetBrainsMono-Variable.woff2",
      weight: "100 800",
      style: "normal",
    },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: {
    default: "SEMEC Design System",
    template: "%s · SEMEC Design System",
  },
  description:
    "Guia visual de referência do design system SEMEC Digital — Prefeitura de Porto Velho.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} ${pressStart.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
