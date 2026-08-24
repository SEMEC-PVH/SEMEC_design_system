import { Poppins, Press_Start_2P, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import localFont from "next/font/local";

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

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    <html
      lang="pt-BR"
      className={`${poppins.variable} ${pressStart.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=d?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}})();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
