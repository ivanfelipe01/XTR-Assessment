import type { Metadata } from "next";
import "./globals.css";
import "./logo-overrides.css";
import "./typography.css";
import "./journey.css";

export const metadata: Metadata = {
  title: "XTR Assessment | Resiliência de Dados",
  description: "Assessment executivo de maturidade em resiliência de dados.",
  openGraph: {
    title: "XTR Assessment",
    description: "Maturidade em Resiliência de Dados",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "XTR Assessment — Maturidade em Resiliência de Dados" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "XTR Assessment",
    description: "Maturidade em Resiliência de Dados",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
