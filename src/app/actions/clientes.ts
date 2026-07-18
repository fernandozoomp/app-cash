// ============================================================================
// SERVER ACTIONS — CLIENTES
// ============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validarPosse } from "@/lib/auth/posse";
import type { EntidadeNota } from "@/lib/types/database";

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

// --------------------------------------------------------------------------
// OBTER CLIENTE POR ID (com validação de posse)
// --------------------------------------------------------------------------
export async function obterCliente(id: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };

  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) return { error: "Cliente não encontrado" };
  return { data };
}

// --------------------------------------------------------------------------
// HISTÓRICO COMPLETO DO CLIENTE (para a página de detalhes)
// --------------------------------------------------------------------------
// Retorna: empréstimos, pagamentos recebidos, cobranças enviadas e totais.
export async function obterHistoricoCliente(id: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };

  const dono = await validarPosse(supabase, user.id, "clientes", id);
  if (!dono) return { error: "Cliente não encontrado" };

  // Busca paralela: empréstimos + parcelas pagas + cobranças
  const [emp, parcelasPagas, cobrancas] = await Promise.all([
    // Empréstimos do cliente
    supabase
      .from("emprestimos")
      .select("*")
      .eq("user_id", user.id)
      .eq("cliente_id", id)
      .order("created_at", { ascending: false }),

    // Parcelas pagas deste cliente (via JOIN)
    supabase
      .from("parcelas")
      .select(
        "id, numero, valor, valor_pago, data_pagamento, vencimento, emprestimos!inner(id, cliente_id)",
      )
      .eq("emprestimos.cliente_id", id)
      .eq("status", "paga")
      .order("data_pagamento", { ascending: false }),

    // Cobranças enviadas a este cliente (via JOIN parcela → emprestimo)
    supabase
      .from("cobrancas")
      .select("id, data, canal, mensagem, parcelas!inner(emprestimos!inner(cliente_id))")
      .eq("parcelas.emprestimos.cliente_id", id)
      .order("data", { ascending: false })
      .limit(50),
  ]);

  // Totais financeiros
  const emprestimos = emp.data || [];
  const totalEmprestado = emprestimos.reduce(
    (s, e: any) => s + Number(e.valor_principal),
    0,
  );
  const totalRecebido = (parcelasPagas.data || []).reduce(
    (s, p: any) => s + (Number(p.valor_pago) || Number(p.valor)),
    0,
  );
  const totalAReceber =
    totalEmprestado +
    emprestimos.reduce(
      (s, e: any) => s + (Number(e.valor_total) - Number(e.valor_principal)),
      0,
    ) -
    totalRecebido;

  return {
    emprestimos: emprestimos as any[],
    pagamentos: (parcelasPagas.data || []) as any[],
    cobrancas: (cobrancas.data || []) as any[],
    totais: {
      totalEmprestado,
      totalRecebido,
      totalAReceber: Math.max(0, totalAReceber),
      numEmprestimos: emprestimos.length,
      numAtivos: emprestimos.filter((e: any) => e.status === "ativo").length,
      numQuitados: emprestimos.filter((e: any) => e.status === "quitado")
        .length,
    },
  };
}
