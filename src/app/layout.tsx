// ============================================================================
// LAYOUT RAIZ — A MOLDURA DE TODO O APP
// ============================================================================
// O Next.js usa este arquivo como a "moldura mais externa".
// Tudo que está aqui aparece em TODAS as páginas (incluindo login).
// Por isso colocamos aqui só o essencial: idioma, fonte, título da aba,
// configuração de PWA e o Toaster (notificações).

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { ConfirmProvider } from "@/components/confirm-dialog";
import { APP_NAME } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata = informações que aparecem na aba do navegador e quando
// alguém compartilha o link. Inclui configuração de PWA (manifest, ícones).
export const metadata: Metadata = {
  title: `${APP_NAME} — Controle Financeiro`,
  description:
    "Controle de caixa dos empreendimentos: Adega, Empréstimos e Sucatas",
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: {
    telephone: false,
  },
};

// Viewport separado (Next.js 16 exige export separado)
export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ConfirmProvider>{children}</ConfirmProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
