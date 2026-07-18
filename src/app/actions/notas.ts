"use server";

// ============================================================================
// SERVER ACTIONS — NOTAS (polimórficas)
// ============================================================================
// Notas podem ser criadas em qualquer entidade. Validamos posse do usuário
// (user_id) mas não validamos se a entidade referenciada existe (trade-off
// da abordagem polimórfica).

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validarPosse } from "@/lib/auth/posse";
import type { EntidadeNota, TipoNota } from "@/lib/types/database";

// --------------------------------------------------------------------------
// LISTAR NOTAS DE UMA ENTIDADE
// --------------------------------------------------------------------------
export async function listarNotas(
  entidadeTipo: EntidadeNota,
  entidadeId: string,
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [] };

  const { data, error } = await supabase
    .from("notas")
    .select("*")
    .eq("user_id", user.id)
    .eq("entidade_tipo", entidadeTipo)
    .eq("entidade_id", entidadeId)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data || [] };
}

// --------------------------------------------------------------------------
// CRIAR NOTA
// --------------------------------------------------------------------------
export async function criarNota(input: {
  entidade_tipo: EntidadeNota;
  entidade_id: string;
  conteudo: string;
  tipo?: TipoNota;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };
  if (!input.conteudo?.trim()) return { error: "Conteúdo é obrigatório" };
  if (input.conteudo.length > 2000)
    return { error: "Nota muito longa (máx 2000 caracteres)" };

  const { data, error } = await supabase
    .from("notas")
    .insert({
      user_id: user.id,
      entidade_tipo: input.entidade_tipo,
      entidade_id: input.entidade_id,
      conteudo: input.conteudo.trim(),
      tipo: input.tipo || "nota",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Revalidar as páginas onde a entidade pode aparecer
  if (input.entidade_tipo === "cliente") {
    revalidatePath(`/clientes/${input.entidade_id}`);
    revalidatePath("/clientes");
  } else if (input.entidade_tipo === "emprestimo") {
    revalidatePath(`/emprestimos/${input.entidade_id}`);
    revalidatePath("/emprestimos");
  }
  return { data };
}

// --------------------------------------------------------------------------
// APAGAR NOTA
// --------------------------------------------------------------------------
export async function apagarNota(id: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };

  // ✅ FIX-01: valida posse (defesa em profundidade)
  const dono = await validarPosse(supabase, user.id, "notas", id);
  if (!dono) return { error: "Nota não encontrada" };

  // Busca entidade antes de apagar para revalidar path correto
  const { data: nota } = await supabase
    .from("notas")
    .select("entidade_tipo, entidade_id")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("notas").delete().eq("id", id);
  if (error) return { error: error.message };

  if (nota) {
    if (nota.entidade_tipo === "cliente")
      revalidatePath(`/clientes/${nota.entidade_id}`);
    else if (nota.entidade_tipo === "emprestimo")
      revalidatePath(`/emprestimos/${nota.entidade_id}`);
  }
  return { success: true };
}
