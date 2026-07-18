"use server";

// ============================================================================
// SERVER ACTIONS — TEMPLATES DE MENSAGEM
// ============================================================================
// CRUD completo. Os templates do sistema (user_id=null) são somente leitura.
// Os do usuário podem ser criados, editados e apagados livremente.

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validarPosseTemplate } from "@/lib/auth/posse";
import type { CategoriaTemplate } from "@/lib/types/database";

// --------------------------------------------------------------------------
// LISTAR — retorna os do sistema + os do usuário logado
// --------------------------------------------------------------------------
export async function listarTemplates() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [] };

  // Busca: (user_id = eu) OR (user_id is null)
  const { data, error } = await supabase
    .from("templates_mensagem")
    .select("*")
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .eq("ativo", true)
    .order("criado_pelo_sistema", { ascending: false }) // sistema primeiro
    .order("nome", { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: data || [] };
}

// --------------------------------------------------------------------------
// CRIAR — cria um template próprio
// --------------------------------------------------------------------------
export async function criarTemplate(input: {
  nome: string;
  categoria: CategoriaTemplate;
  conteudo: string;
  icone?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };
  if (!input.nome?.trim()) return { error: "Nome é obrigatório" };
  if (!input.conteudo?.trim()) return { error: "Conteúdo é obrigatório" };

  const { data, error } = await supabase
    .from("templates_mensagem")
    .insert({
      user_id: user.id,
      nome: input.nome.trim(),
      categoria: input.categoria,
      conteudo: input.conteudo.trim(),
      icone: input.icone || "💬",
      ativo: true,
      criado_pelo_sistema: false,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/cobrancas");
  revalidatePath("/cobrancas/templates");
  return { data };
}

// --------------------------------------------------------------------------
// ATUALIZAR — só pode editar templates próprios (RLS protege os do sistema)
// --------------------------------------------------------------------------
export async function atualizarTemplate(
  id: string,
  input: {
    nome?: string;
    categoria?: CategoriaTemplate;
    conteudo?: string;
    icone?: string;
  },
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };

  // ✅ FIX-01: valida posse (só dono pode editar; sistema é read-only)
  const { podeEditar, existe } = await validarPosseTemplate(supabase, user.id, id);
  if (!existe) return { error: "Template não encontrado" };
  if (!podeEditar)
    return { error: "Templates do sistema não podem ser editados. Duplique para personalizar." };

  const update: Record<string, string> = {};
  if (input.nome !== undefined) update.nome = input.nome.trim();
  if (input.categoria !== undefined) update.categoria = input.categoria;
  if (input.conteudo !== undefined) update.conteudo = input.conteudo.trim();
  if (input.icone !== undefined) update.icone = input.icone;

  const { data, error } = await supabase
    .from("templates_mensagem")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/cobrancas");
  revalidatePath("/cobrancas/templates");
  return { data };
}

// --------------------------------------------------------------------------
// APAGAR — só pode apagar templates próprios (RLS protege os do sistema)
// --------------------------------------------------------------------------
export async function apagarTemplate(id: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };

  // ✅ FIX-01: valida posse antes de apagar
  const { podeEditar, existe } = await validarPosseTemplate(supabase, user.id, id);
  if (!existe) return { error: "Template não encontrado" };
  if (!podeEditar)
    return { error: "Templates do sistema não podem ser apagados." };

  const { error } = await supabase
    .from("templates_mensagem")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/cobrancas");
  revalidatePath("/cobrancas/templates");
  return { success: true };
}

// --------------------------------------------------------------------------
// DUPLICAR — cria uma cópia editável de qualquer template (inclusive sistema)
// --------------------------------------------------------------------------
// Útil quando o usuário quer personalizar um template padrão: duplica,
// edita a cópia. O original do sistema permanece intocado.
export async function duplicarTemplate(id: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };

  // Busca o original
  const { data: original, error: errBusca } = await supabase
    .from("templates_mensagem")
    .select("*")
    .eq("id", id)
    .single();

  if (errBusca || !original) return { error: "Template não encontrado" };

  // Cria a cópia
  const { data, error } = await supabase
    .from("templates_mensagem")
    .insert({
      user_id: user.id,
      nome: `${original.nome} (cópia)`,
      categoria: original.categoria,
      conteudo: original.conteudo,
      icone: original.icone,
      ativo: true,
      criado_pelo_sistema: false,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/cobrancas");
  revalidatePath("/cobrancas/templates");
  return { data };
}
