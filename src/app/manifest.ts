// ============================================================================
// MANIFEST DO PWA (Progressive Web App)
// ============================================================================
// Este arquivo faz o app poder ser INSTALADO no celular (Android e iPhone)
// como se fosse um app nativo, com ícone na tela inicial.
//
// Como instalar (depois de publicar):
//   - Android (Chrome): menu ⋮ → "Instalar app"
//   - iPhone (Safari): botão Compartilhar → "Adicionar à Tela de Início"

import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — Controle Financeiro`,
    short_name: APP_NAME,
    description:
      "Controle de caixa dos empreendimentos: Adega, Empréstimos e Sucatas",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#059669", // verde esmeralda
    orientation: "portrait",
    lang: "pt-BR",
    categories: ["finance", "business", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
