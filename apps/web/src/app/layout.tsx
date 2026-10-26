import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Mono, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const bodyFont = Manrope({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const displayFont = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const monoFont = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "AccessPath Finance | Financial journeys people can finish",
  description: "A guided, accessible sample personal-loan journey with clear terms and customer review at every step.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable}`}><body>{children}</body></html>;
}
