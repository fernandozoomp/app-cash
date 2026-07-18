// ============================================================================
// SERVER ACTIONS — FLUXO DE CAIXA
// ============================================================================
// Server Actions são funções que rodam no SERVIDOR mas podem ser chamadas
// diretamente de formulários no navegador. O Next.js cuida da comunicação.
// Vantagem: o código sensível nunca vai para o navegador.

"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Empreendimento, FormaPagamento, TipoTransacao } from "@/lib/types/database";

// --------------------------------------------------------------------------
// CRIAR TRANSAÇÃO
// --------------------------------------------------------------------------
export async function criarTransacao(input: {
  data: string;
  tipo: TipoTransacao;
  empreendimento: Empreendimento;
  categoria: string;
  descricao?: string;
  valor: number;
  forma_pagamento: FormaPagamento;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Você precisa estar logado" };
  }

  if (!input.valor || input.valor <= 0) {
    return { error: "Valor deve ser maior que zero" };
  }

  const { data, error } = await supabase
    .from("transacoes")
    .insert({
      user_id: user.id,
      data: input.data,
      tipo: input.tipo,
      empreendimento: input.empreendimento,
      categoria: input.categoria,
      descricao: input.descricao || null,
      valor: input.valor,
      forma_pagamento: input.forma_pagamento,
    })
    .select()
    .single();

  if (error) {
    return { error: "Erro ao salvar: " + error.message };
  }

  // revalidatePath faz o Next.js recarregar os dados das páginas afetadas
  revalidatePath("/");
  revalidatePath("/caixa");
  return { data };
}

// --------------------------------------------------------------------------
// LISTAR TRANSAÇÕES (com filtros opcionais)
// --------------------------------------------------------------------------
export async function listarTransacoes(filtros?: {
  empreendimento?: Empreendimento;
  tipo?: TipoTransacao;
  dataInicio?: string;
  dataFim?: string;
  limite?: number;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [] };

  let query = supabase
    .from("transacoes")
    .select("*")
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  if (filtros?.empreendimento) {
    query = query.eq("empreendimento", filtros.empreendimento);
  }
  if (filtros?.tipo) {
    query = query.eq("tipo", filtros.tipo);
  }
  if (filtros?.dataInicio) {
    query = query.gte("data", filtros.dataInicio);
  }
  if (filtros?.dataFim) {
    query = query.lte("data", filtros.dataFim);
  }
  if (filtros?.limite) {
    query = query.limit(filtros.limite);
  }

  const { data, error } = await query;
  if (error) return { data: [], error: error.message };
  return { data: data || [] };
}

// --------------------------------------------------------------------------
// APAGAR TRANSAÇÃO
// --------------------------------------------------------------------------
export async function apagarTransacao(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("transacoes").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/caixa");
  return { success: true };
}

// --------------------------------------------------------------------------
// RESUMO DO CAIXA (para o dashboard)
// --------------------------------------------------------------------------
export async function obterResumoCaixa() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      saldo: 0,
      entradasMes: 0,
      saidasMes: 0,
      aReceber: 0,
      porEmpreendimento: { adega: 0, emprestimos: 0, sucatas: 0 },
    };
  }

  // Início e fim do mês atual
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  // Total de transações
  const { data: todas } = await supabase
    .from("transacoes")
    .select("tipo, valor, empreendimento, data");

  let saldo = 0;
  let entradasMes = 0;
  let saidasMes = 0;
  const porEmpreendimento = { adega: 0, emprestimos: 0, sucatas: 0 };

  for (const t of todas || []) {
    const valor = Number(t.valor);
    const sinal = t.tipo === "entrada" ? 1 : -1;
    saldo += valor * sinal;

    if (t.data >= inicioMes && t.data <= fimMes) {
      if (t.tipo === "entrada") entradasMes += valor;
      else saidasMes += valor;
    }

    // Saldo por empreendimento (líquido)
    if (t.empreendimento === "adega") porEmpreendimento.adega += valor * sinal;
    if (t.empreendimento === "emprestimos")
      porEmpreendimento.emprestimos += valor * sinal;
    if (t.empreendimento === "sucatas")
      porEmpreendimento.sucatas += valor * sinal;
  }

  // Total a receber (parcelas pendentes + atrasadas)
  const { data: parcelasPendentes } = await supabase
    .from("parcelas")
    .select("valor, emprestimos!inner(user_id)")
    .eq("emprestimos.user_id", user.id)
    .in("status", ["pendente", "atrasada"]);

  let aReceber = 0;
  for (const p of parcelasPendentes || []) {
    aReceber += Number(p.valor);
  }

  return {
    saldo: Math.round(saldo * 100) / 100,
    entradasMes: Math.round(entradasMes * 100) / 100,
    saidasMes: Math.round(saidasMes * 100) / 100,
    aReceber: Math.round(aReceber * 100) / 100,
    porEmpreendimento: {
      adega: Math.round(porEmpreendimento.adega * 100) / 100,
      emprestimos: Math.round(porEmpreendimento.emprestimos * 100) / 100,
      sucatas: Math.round(porEmpreendimento.sucatas * 100) / 100,
    },
  };
}
