// ============================================================================
// CLIENT SUPABASE (SERVIDOR) — para Server Components e Server Actions
// ============================================================================
// Este cliente roda no SERVIDOR (nunca no navegador do usuário).
// Usado para buscar dados sensíveis, validar sessão, etc.
// Cookies HTTP-only garantem que tokens de auth não sejam acessíveis via JS.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Ignorado: pode acontecer em Server Components
            // (não é possível definir cookies ali). O middleware renova.
          }
        },
      },
    },
  );
}
