import { Poppins, Press_Start_2P, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
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
    <html lang="pt-BR" className={`${poppins.variable} ${pressStart.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}