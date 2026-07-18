// ============================================================================
// SERVER ACTIONS — SUCATAS
// ============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validarPosse } from "@/lib/auth/posse";
import type { TipoSucata } from "@/lib/types/database";

// --------------------------------------------------------------------------
// CRIAR MOVIMENTAÇÃO DE SUCATA
// --------------------------------------------------------------------------
// Registra compra ou venda de sucata. Calcula o valor_total automaticamente.
export async function criarMovimentacaoSucata(input: {
  data: string;
  tipo: TipoSucata;
  material: string;
  peso_kg: number;
  preco_por_kg: number;
  observacoes?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };
  if (!input.material?.trim()) return { error: "Material é obrigatório" };
  if (!input.peso_kg || input.peso_kg <= 0)
    return { error: "Peso deve ser maior que zero" };
  if (input.preco_por_kg < 0) return { error: "Preço inválido" };

  const valorTotal = Math.round(input.peso_kg * input.preco_por_kg * 100) / 100;

  // 1) Inserir a movimentação
  const { data, error } = await supabase
    .from("movimentacao_sucatas")
    .insert({
      user_id: user.id,
      data: input.data,
      tipo: input.tipo,
      material: input.material.trim(),
      peso_kg: input.peso_kg,
      preco_por_kg: input.preco_por_kg,
      valor_total: valorTotal,
      observacoes: input.observacoes?.trim() || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // 2) Criar transação no caixa (saída se compra, entrada se venda)
  await supabase.from("transacoes").insert({
    user_id: user.id,
    data: input.data,
    tipo: input.tipo === "venda" ? "entrada" : "saida",
    empreendimento: "sucatas",
    categoria: input.tipo === "venda" ? "venda_sucata" : "compra_sucata",
    descricao: `${input.tipo === "venda" ? "Venda" : "Compra"} de ${input.material} (${input.peso_kg}kg)`,
    valor: valorTotal,
    forma_pagamento: "dinheiro",
  });

  revalidatePath("/sucatas");
  revalidatePath("/");
  revalidatePath("/caixa");
  return { data };
}

// --------------------------------------------------------------------------
// LISTAR MOVIMENTAÇÕES DE SUCATA
// --------------------------------------------------------------------------
export async function listarSucatas() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [] };

  const { data, error } = await supabase
    .from("movimentacao_sucatas")
    .select("*")
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data || [] };
}

// --------------------------------------------------------------------------
// APAGAR MOVIMENTAÇÃO DE SUCATA
// --------------------------------------------------------------------------
export async function apagarSucata(id: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };

  // ✅ FIX-01: valida posse antes de apagar
  const dono = await validarPosse(supabase, user.id, "movimentacao_sucatas", id);
  if (!dono) return { error: "Movimentação não encontrada" };

  const { error } = await supabase
    .from("movimentacao_sucatas")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/sucatas");
  revalidatePath("/");
  return { success: true };
}
