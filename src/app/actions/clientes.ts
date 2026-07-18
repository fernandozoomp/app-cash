// ============================================================================
// SERVER ACTIONS — CLIENTES
// ============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validarPosse } from "@/lib/auth/posse";

// --------------------------------------------------------------------------
// CRIAR CLIENTE
// --------------------------------------------------------------------------
export async function criarCliente(input: {
  nome: string;
  telefone?: string;
  observacoes?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };
  if (!input.nome?.trim()) return { error: "Nome é obrigatório" };

  const { data, error } = await supabase
    .from("clientes")
    .insert({
      user_id: user.id,
      nome: input.nome.trim(),
      telefone: input.telefone?.trim() || null,
      observacoes: input.observacoes?.trim() || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/clientes");
  revalidatePath("/emprestimos");
  return { data };
}

// --------------------------------------------------------------------------
// LISTAR CLIENTES
// --------------------------------------------------------------------------
export async function listarClientes() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [] };

  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("nome", { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: data || [] };
}

// --------------------------------------------------------------------------
// ATUALIZAR CLIENTE
// --------------------------------------------------------------------------
export async function atualizarCliente(
  id: string,
  input: { nome?: string; telefone?: string; observacoes?: string },
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };

  // ✅ FIX-01: valida posse antes de atualizar (defesa em profundidade contra IDOR)
  const dono = await validarPosse(supabase, user.id, "clientes", id);
  if (!dono) return { error: "Cliente não encontrado" };

  const update: Record<string, string | null> = {};
  if (input.nome !== undefined) update.nome = input.nome.trim();
  if (input.telefone !== undefined)
    update.telefone = input.telefone.trim() || null;
  if (input.observacoes !== undefined)
    update.observacoes = input.observacoes.trim() || null;

  const { data, error } = await supabase
    .from("clientes")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/clientes");
  revalidatePath("/emprestimos");
  return { data };
}

// --------------------------------------------------------------------------
// APAGAR CLIENTE
// --------------------------------------------------------------------------
export async function apagarCliente(id: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };

  // ✅ FIX-01: valida posse antes de apagar
  const dono = await validarPosse(supabase, user.id, "clientes", id);
  if (!dono) return { error: "Cliente não encontrado" };

  const { error } = await supabase.from("clientes").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/clientes");
  revalidatePath("/emprestimos");
  return { success: true };
}
