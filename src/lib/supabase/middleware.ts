// ============================================================================
// MIDDLEWARE — renova a sessão do usuário a cada requisição
// ============================================================================
// Roda ANTES de cada página carregar. Atualiza o cookie de sessão para
// que o usuário continue logado. Sem isso, a sessão "expira" do nada.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: não use getUser() aqui dentro — dispara rede a cada request.
  // Apenas atualiza a sessão. A checagem do usuário fica nos layouts/páginas.
  await supabase.auth.getSession();

  return response;
}
