// ============================================================================
// HELPERS DE VALIDAÇÃO DE POSSE (defesa em profundidade contra IDOR)
// ============================================================================
// Verificam se um registro pertence ao usuário ANTES de atualizar/apagar.
// Defesa em profundidade: mesmo que o RLS esteja ativo, validamos também aqui.
//
// Como usar:
//   const dono = await validarPosse(supabase, user.id, "clientes", id);
//   if (!dono) return { error: "Cliente não encontrado" };

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Verifica se um registro pertence ao usuário logado.
 * @returns true se pertence, false se não (ou não existe)
 */
export async function validarPosse(
  supabase: SupabaseClient,
  userId: string,
  tabela: string,
  id: string,
): Promise<boolean> {
  const { data } = await supabase
    .from(tabela)
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  return !!data;
}

/**
 * Valida posse indireta: parcela → emprestimo → user_id.
 * Usado para parcelas e cobranças, que não têm user_id direto.
 */
export async function validarPosseParcela(
  supabase: SupabaseClient,
  userId: string,
  parcelaId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("parcelas")
    .select("id, emprestimos!inner(user_id)")
    .eq("id", parcelaId)
    .eq("emprestimos.user_id", userId)
    .maybeSingle();

  return !!data;
}

/**
 * Valida posse de template: pode ser do usuário OU do sistema (user_id null).
 * Usado antes de editar/apagar.
 */
export async function validarPosseTemplate(
  supabase: SupabaseClient,
  userId: string,
  templateId: string,
): Promise<{ podeEditar: boolean; existe: boolean }> {
  const { data } = await supabase
    .from("templates_mensagem")
    .select("id, user_id")
    .eq("id", templateId)
    .maybeSingle();

  if (!data) return { podeEditar: false, existe: false };
  // Pode editar só se user_id = userId (templates do sistema têm user_id null)
  return { podeEditar: data.user_id === userId, existe: true };
}
