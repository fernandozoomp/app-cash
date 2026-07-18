"use server";

// ============================================================================
// SERVER ACTIONS — CONTAS BANCÁRIAS + EXTRATOS + CONCILIAÇÃO
// ============================================================================

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validarPosse } from "@/lib/auth/posse";
import type { BancoCodigo } from "@/lib/types/database";

// --------------------------------------------------------------------------
// CONTAS BANCÁRIAS — CRUD
// --------------------------------------------------------------------------
export async function listarContas() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  const { data, error } = await supabase
    .from("contas_bancarias")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: data || [] };
}

export async function obterConta(id: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autorizado" };

  const { data, error } = await supabase
    .from("contas_bancarias")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) return { error: "Conta não encontrada" };
  return { data };
}

export async function criarConta(input: {
  nome: string;
  banco?: BancoCodigo;
  agencia?: string;
  conta?: string;
  saldo_inicial?: number;
  cor?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autorizado" };
  if (!input.nome?.trim()) return { error: "Nome é obrigatório" };

  const { data, error } = await supabase
    .from("contas_bancarias")
    .insert({
      user_id: user.id,
      nome: input.nome.trim(),
      banco: input.banco || "outros",
      agencia: input.agencia || null,
      conta: input.conta || null,
      saldo_inicial: input.saldo_inicial || 0,
      cor: input.cor || "#10b981",
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/contas");
  return { data };
}

export async function apagarConta(id: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autorizado" };

  const dono = await validarPosse(supabase, user.id, "contas_bancarias", id);
  if (!dono) return { error: "Conta não encontrada" };

  const { error } = await supabase.from("contas_bancarias").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/contas");
  return { success: true };
}

// --------------------------------------------------------------------------
// EXTRATOS — importar itens (com anti-duplicação por hash)
// --------------------------------------------------------------------------
// Recebe os lançamentos já parseados no cliente. Para cada um, calcula o hash
// e insere (ignorando duplicatas pelo UNIQUE constraint).
export async function importarExtrato(input: {
  conta_id: string;
  origem: "ofx" | "csv" | "json" | "manual";
  itens: Array<{
    data: string;
    descricao: string;
    valor: number;
    hash_unico: string;
  }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autorizado" };

  const dono = await validarPosse(supabase, user.id, "contas_bancarias", input.conta_id);
  if (!dono) return { error: "Conta não encontrada" };

  // Insere com upsert (onConflict no hash_unico ignora duplicatas)
  const linhas = input.itens.map((i) => ({
    user_id: user.id,
    conta_id: input.conta_id,
    data: i.data,
    descricao: i.descricao,
    valor: i.valor,
    origem: input.origem,
    hash_unico: i.hash_unico,
  }));

  const { data, error } = await supabase
    .from("extrato_itens")
    .upsert(linhas, { onConflict: "conta_id,hash_unico", ignoreDuplicates: true })
    .select();

  if (error) return { error: error.message };

  revalidatePath(`/contas/${input.conta_id}`);
  return {
    sucesso: true,
    quantidade: data?.length || 0,
    mensagem: `${data?.length || 0} lançamento(s) importado(s) (duplicatas ignoradas)`,
  };
}

// --------------------------------------------------------------------------
// LISTAR ITENS DO EXTRATO (com sugestões de conciliação)
// --------------------------------------------------------------------------
export async function listarExtrato(contaId: string, soNaoConciliados = true) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  let query = supabase
    .from("extrato_itens")
    .select("*")
    .eq("conta_id", contaId)
    .order("data", { ascending: false });

  if (soNaoConciliados) {
    query = query.eq("conciliado", false);
  }

  const { data, error } = await query;
  if (error) return { data: [], error: error.message };
  return { data: data || [] };
}

// --------------------------------------------------------------------------
// SUGESTÕES DE CONCILIAÇÃO (algoritmo semi-automático)
// --------------------------------------------------------------------------
// Para cada item do extrato, busca transações com:
//   - Mesmo valor absoluto (±R$ 0,05)
//   - Data próxima (±3 dias)
//   - Mesmo tipo (entrada/saída)
export async function sugerirConciliacao(extratoItemId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sugestoes: [] };

  // Busca o item do extrato
  const { data: item } = await supabase
    .from("extrato_itens")
    .select("*")
    .eq("id", extratoItemId)
    .single();

  if (!item) return { sugestoes: [] };

  const valorAbs = Math.abs(Number(item.valor));
  const tipo = Number(item.valor) >= 0 ? "entrada" : "saida";

  // Janela de datas (±3 dias)
  const dataBase = new Date(item.data + "T00:00:00");
  const inicio = new Date(dataBase);
  inicio.setDate(inicio.getDate() - 3);
  const fim = new Date(dataBase);
  fim.setDate(fim.getDate() + 3);

  // Busca transações não vinculadas com valor aproximado
  const { data: candidatos } = await supabase
    .from("transacoes")
    .select("*")
    .eq("user_id", user.id)
    .eq("tipo", tipo)
    .gte("data", inicio.toISOString().slice(0, 10))
    .lte("data", fim.toISOString().slice(0, 10))
    .gte("valor", valorAbs - 0.05)
    .lte("valor", valorAbs + 0.05)
    .order("data", { ascending: true })
    .limit(5);

  return { sugestoes: candidatos || [] };
}

// --------------------------------------------------------------------------
// VINCULAR item do extrato a uma transação existente (conciliação)
// --------------------------------------------------------------------------
export async function vincularExtrato(extratoItemId: string, transacaoId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autorizado" };

  const { error } = await supabase
    .from("extrato_itens")
    .update({
      conciliado: true,
      transacao_id: transacaoId,
    })
    .eq("id", extratoItemId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/contas");
  return { success: true };
}

// --------------------------------------------------------------------------
// CRIAR NOVA TRANSAÇÃO a partir de item do extrato (quando não tem match)
// --------------------------------------------------------------------------
export async function criarTransacaoDeExtrato(
  extratoItemId: string,
  input: { empreendimento: "adega" | "emprestimos" | "sucatas"; categoria: string },
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autorizado" };

  // Busca o item
  const { data: item } = await supabase
    .from("extrato_itens")
    .select("*")
    .eq("id", extratoItemId)
    .single();

  if (!item) return { error: "Item não encontrado" };

  // Cria a transação
  const { data: transacao, error: errTrans } = await supabase
    .from("transacoes")
    .insert({
      user_id: user.id,
      data: item.data,
      tipo: Number(item.valor) >= 0 ? "entrada" : "saida",
      empreendimento: input.empreendimento,
      categoria: input.categoria,
      descricao: item.descricao || "Importado do extrato",
      valor: Math.abs(Number(item.valor)),
      forma_pagamento: "pix",
    })
    .select()
    .single();

  if (errTrans) return { error: errTrans.message };

  // Vincula ao extrato
  await supabase
    .from("extrato_itens")
    .update({ conciliado: true, transacao_id: transacao.id })
    .eq("id", extratoItemId);

  revalidatePath("/contas");
  revalidatePath("/caixa");
  return { success: true };
}
