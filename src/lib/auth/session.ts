// ============================================================================
// SESSÃO DO USUÁRIO (Server-side)
// ============================================================================
// Função reutilizável para obter o usuário atual em Server Components.
// Retorna o usuário ou null se não estiver logado.

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    // Em Server Components, lançar esse erro faz o Next.js redirecionar
    // (quando capturado por um try/catch na rota ou pelo middleware de auth).
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
