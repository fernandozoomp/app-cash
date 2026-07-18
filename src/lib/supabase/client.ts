// ============================================================================
// CLIENT SUPABASE (NAVEGADOR) — para Client Components
// ============================================================================
// Este cliente roda no NAVEGADOR do usuário (interações de tela: botões,
// formulários, etc.). É seguro porque todas as tabelas têm RLS habilitado.

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
