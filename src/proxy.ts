// ============================================================================
// PROXY DO NEXT.JS 16 (antigo "middleware")
// ============================================================================
// O Next.js executa este arquivo automaticamente antes de TODA rota.
// (No Next.js 16, o nome convencionado mudou de "middleware" para "proxy",
// e a função exportada também mudou de "middleware" para "proxy".)
//
// Usamos para renovar a sessão do usuário a cada requisição. Assim o
// usuário continua logado mesmo se ficar horas usando o app.

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Aplica a todas as rotas EXCETO arquivos estáticos e imagens.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
