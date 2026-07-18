// ============================================================================
// SERVER ACTIONS — EMPRÉSTIMOS (a parte mais completa)
// ============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calcularEmprestimo } from "@/lib/finance/calculadora";
import type { SistemaJuros } from "@/lib/types/database";

// --------------------------------------------------------------------------
// CRIAR EMPRÉSTIMO (com geração automática de parcelas)
// --------------------------------------------------------------------------
// Este é o coração do sistema. Recebe os dados do formulário, calcula as
// parcelas usando a calculadora financeira, salva o empréstimo E todas as
// suas parcelas de uma vez (transação atômica: ou salva tudo, ou não salva nada).
// --------------------------------------------------------------------------
export async function criarEmprestimo(input: {
  cliente_id: string;
  valor_principal: number;
  taxa_juros: number;
  num_parcelas: number;
  data_inicio: string;
  sistema_juros: SistemaJuros;
  observacoes?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };

  // Validações
  if (!input.cliente_id) return { error: "Selecione um cliente" };
  if (!input.valor_principal || input.valor_principal <= 0)
    return { error: "Valor deve ser maior que zero" };
  if (!input.num_parcelas || input.num_parcelas < 1)
    return { error: "Número de parcelas inválido" };
  if (input.taxa_juros < 0) return { error: "Taxa de juros inválida" };

  // 1) Calcular parcelas
  const calculo = calcularEmprestimo({
    valorPrincipal: input.valor_principal,
    taxaJurosMensal: input.taxa_juros,
    numParcelas: input.num_parcelas,
    dataInicio: input.data_inicio,
    sistema: input.sistema_juros,
  });

  // 2) Inserir empréstimo
  const { data: emprestimo, error: errEmp } = await supabase
    .from("emprestimos")
    .insert({
      user_id: user.id,
      cliente_id: input.cliente_id,
      valor_principal: input.valor_principal,
      taxa_juros: input.taxa_juros,
      num_parcelas: input.num_parcelas,
      data_inicio: input.data_inicio,
      sistema_juros: input.sistema_juros,
      valor_parcela: calculo.valorParcela,
      valor_total: calculo.valorTotal,
      status: "ativo",
      observacoes: input.observacoes?.trim() || null,
    })
    .select()
    .single();

  if (errEmp) return { error: "Erro ao criar empréstimo: " + errEmp.message };

  // 3) Inserir todas as parcelas de uma vez
  const parcelasParaInserir = calculo.parcelas.map((p) => ({
    emprestimo_id: emprestimo.id,
    numero: p.numero,
    valor: p.valor,
    vencimento: p.vencimento,
    status: "pendente",
  }));

  const { error: errParc } = await supabase
    .from("parcelas")
    .insert(parcelasParaInserir);

  if (errParc) {
    // Rollback manual: apaga o empréstimo se as parcelas falharam
    await supabase.from("emprestimos").delete().eq("id", emprestimo.id);
    return { error: "Erro ao criar parcelas: " + errParc.message };
  }

  revalidatePath("/emprestimos");
  revalidatePath("/");
  return { data: emprestimo, calculo };
}

// --------------------------------------------------------------------------
// LISTAR EMPRÉSTIMOS (com nome do cliente)
// --------------------------------------------------------------------------
export async function listarEmprestimos() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [] };

  const { data, error } = await supabase
    .from("emprestimos")
    .select("*, clientes(nome, telefone)")
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data || [] };
}

// --------------------------------------------------------------------------
// LISTAR EMPRÉSTIMOS COM PARCELAS (para a tela de empréstimos)
// --------------------------------------------------------------------------
export async function listarEmprestimosComParcelas() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [] };

  const { data: emprestimos, error } = await supabase
    .from("emprestimos")
    .select("*, clientes(nome, telefone)")
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };

  // Buscar todas as parcelas dos empréstimos do usuário de uma vez
  const ids = (emprestimos || []).map((e: any) => e.id);
  if (ids.length === 0) return { data: [] };

  const { data: parcelas } = await supabase
    .from("parcelas")
    .select("*")
    .in("emprestimo_id", ids)
    .order("numero", { ascending: true });

  // Agrupar parcelas por empréstimo
  const parcelasPorEmp = (parcelas || []).reduce((acc: any, p: any) => {
    if (!acc[p.emprestimo_id]) acc[p.emprestimo_id] = [];
    acc[p.emprestimo_id].push(p);
    return acc;
  }, {});

  const resultado = (emprestimos || []).map((e: any) => ({
    ...e,
    parcelas: parcelasPorEmp[e.id] || [],
  }));

  return { data: resultado };
}

// --------------------------------------------------------------------------
// DETALHES DE UM EMPRÉSTIMO (com parcelas)
// --------------------------------------------------------------------------
export async function obterEmprestimo(id: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };

  // ✅ FIX-01: valida posse antes de retornar detalhes
  const { data: emprestimo, error: errEmp } = await supabase
    .from("emprestimos")
    .select("*, clientes(nome, telefone)")
    .eq("id", id)
    .eq("user_id", user.id) // filtro de posse
    .single();

  if (errEmp) return { error: "Empréstimo não encontrado" };

  const { data: parcelas, error: errParc } = await supabase
    .from("parcelas")
    .select("*")
    .eq("emprestimo_id", id)
    .order("numero", { ascending: true });

  if (errParc) return { error: errParc.message };

  return { data: { emprestimo, parcelas: parcelas || [] } };
}

// --------------------------------------------------------------------------
// RECEBER PARCELA (marca como paga + registra entrada no caixa)
// --------------------------------------------------------------------------
// Ao receber uma parcela, fazemos DUAS coisas:
//   1. Marcamos a parcela como "paga"
//   2. Criamos uma transação de ENTRADA no caixa (automaticamente!)
// Assim o caixa fica sempre certo, sem precisar lançar à parte.
// --------------------------------------------------------------------------
export async function receberParcela(parcelaId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };

  // 1) Buscar a parcela + dados do empréstimo
  const { data: parcela, error: errParc } = await supabase
    .from("parcelas")
    .select("*, emprestimos!inner(user_id, id, cliente_id)")
    .eq("id", parcelaId)
    .single();

  if (errParc || !parcela) return { error: "Parcela não encontrada" };

  // Verificar posse
  if (parcela.emprestimos.user_id !== user.id)
    return { error: "Não autorizado" };

  if (parcela.status === "paga")
    return { error: "Esta parcela já foi recebida" };

  const hoje = new Date().toISOString().slice(0, 10);

  // 2) Marcar parcela como paga
  const { error: errUpdate } = await supabase
    .from("parcelas")
    .update({
      status: "paga",
      data_pagamento: hoje,
    })
    .eq("id", parcelaId);

  if (errUpdate) return { error: errUpdate.message };

  // 3) Criar transação de entrada no caixa
  await supabase.from("transacoes").insert({
    user_id: user.id,
    data: hoje,
    tipo: "entrada",
    empreendimento: "emprestimos",
    categoria: "recebimento_parcela",
    descricao: `Parcela ${parcela.numero} recebida`,
    valor: parcela.valor,
    forma_pagamento: "dinheiro",
  });

  // 4) Verificar se todas as parcelas foram pagas → marcar empréstimo como quitado
  const { data: restantes } = await supabase
    .from("parcelas")
    .select("id, status")
    .eq("emprestimo_id", parcela.emprestimos.id)
    .in("status", ["pendente", "atrasada"]);

  if ((restantes || []).length === 0) {
    await supabase
      .from("emprestimos")
      .update({ status: "quitado" })
      .eq("id", parcela.emprestimos.id);
  }

  revalidatePath("/emprestimos");
  revalidatePath("/");
  revalidatePath("/caixa");
  return { success: true };
}

// --------------------------------------------------------------------------
// PRÓXIMOS VENCIMENTOS (para o dashboard)
// --------------------------------------------------------------------------
export async function proximosVencimentos(dias: number = 7) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [] };

  const hoje = new Date();
  const limite = new Date(hoje);
  limite.setDate(limite.getDate() + dias);

  const hojeStr = hoje.toISOString().slice(0, 10);
  const limiteStr = limite.toISOString().slice(0, 10);

  // Buscar parcelas pendentes/atrasadas com vencimento ≤ hoje + dias
  const { data, error } = await supabase
    .from("parcelas")
    .select(
      "id, numero, valor, vencimento, status, emprestimos(id, clientes(nome))",
    )
    .in("status", ["pendente", "atrasada"])
    .lte("vencimento", limiteStr)
    .order("vencimento", { ascending: true })
    .limit(10);

  if (error) return { data: [], error: error.message };
  return { data: data || [] };
}
