// ============================================================================
// CONFIGURAÇÃO DO NEXT.JS — com headers de segurança (FIX-02)
// ============================================================================
// Estes headers protegem contra ataques comuns:
//   X-Frame-Options: impede clickjacking (ninguém embute o app em iframe)
//   X-Content-Type-Options: impede MIME sniffing
//   Referrer-Policy: controla o que vaza no header Referer
//   Permissions-Policy: desativa APIs desnecessárias (câmera, microfone, geo)
//   Strict-Transport-Security: força HTTPS por 2 anos (HSTS)
//   Content-Security-Policy: define de onde pode carregar recursos

import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY", // não permite ser embutido em iframe de jeito nenhum
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff", // navegador não adivinha MIME type
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    // Desativa tudo que não usamos. Se um dia precisar de algo (ex: câmera
    // para QR code), basta ajustar aqui.
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    // HSTS: força HTTPS por 2 anos, inclui subdomínios, permite preload
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    // CSP: permite só recursos de fontes confiáveis.
    // - 'self': próprio domínio
    // - Supabase (banco e auth)
    // - Google Fonts (Inter, Geist)
    // - Vercel (analytics se ativar no futuro)
    // unsafe-inline/unsafe-eval são necessários para o Next.js dev. Em
    // produção poderíamos usar nonces, mas para este app o ganho é pequeno.
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Aplica a TODAS as rotas
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
