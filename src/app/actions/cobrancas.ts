"use server";

// ============================================================================
// SERVER ACTIONS — COBRANÇAS
// ============================================================================
// Toda a lógica de cobrança:
//   1. registrarCobranca → registra que enviou um lembrete
//   2. registrarPagamento → suporta pagamento PARCIAL ou TOTAL
//   3. listarCobrancasPendentes → tabelão da página de cobranças
//   4. listarHistoricoCobrancas → histórico de uma parcela

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { statusParcelaVencida } from "@/lib/finance/calculadora";
import type { CanalCobranca } from "@/lib/types/database";

// --------------------------------------------------------------------------
// 1) REGISTRAR UMA COBRANÇA (depois de clicar no botão WhatsApp)
// --------------------------------------------------------------------------
export async function registrarCobranca(input: {
  parcela_id: string;
  canal?: CanalCobranca;
  mensagem?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };

  // 1) Insere na tabela cobrancas
  const { error: errInsert } = await supabase.from("cobrancas").insert({
    user_id: user.id,
    parcela_id: input.parcela_id,
    canal: input.canal || "whatsapp",
    mensagem: input.mensagem || null,
  });

  if (errInsert) return { error: errInsert.message };

  // 2) Atualiza ultima_cobranca e cobrancas_count na parcela
  //    (buscamos o count atual primeiro para incrementar com segurança)
  const { data: parcela } = await supabase
    .from("parcelas")
    .select("cobrancas_count")
    .eq("id", input.parcela_id)
    .single();

  const novoCount = (parcela?.cobrancas_count || 0) + 1;

  await supabase
    .from("parcelas")
    .update({
      ultima_cobranca: new Date().toISOString(),
      cobrancas_count: novoCount,
    })
    .eq("id", input.parcela_id);

  revalidatePath("/cobrancas");
  revalidatePath("/emprestimos");
  revalidatePath("/");
  return { sucesso: true };
}

// --------------------------------------------------------------------------
// 2) REGISTRAR PAGAMENTO (PARCIAL ou TOTAL)
// --------------------------------------------------------------------------
// Suporta 3 cenários:
//   - valor_pago >= valor da parcela → PAGA (status=paga)
//   - valor_pago > 0 mas < valor → PARCIAL (status=parcial)
//   - sempre cria transação de entrada no caixa
// --------------------------------------------------------------------------
export async function registrarPagamento(input: {
  parcela_id: string;
  valor_pago: number;
  data_pagamento?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };
  if (!input.valor_pago || input.valor_pago <= 0)
    return { error: "Valor deve ser maior que zero" };

  // 1) Busca a parcela + dados do empréstimo
  const { data: parcela, error: errBusca } = await supabase
    .from("parcelas")
    .select("*, emprestimos!inner(user_id, id)")
    .eq("id", input.parcela_id)
    .single();

  if (errBusca || !parcela) return { error: "Parcela não encontrada" };
  if (parcela.emprestimos.user_id !== user.id)
    return { error: "Não autorizado" };
  if (parcela.status === "paga")
    return { error: "Esta parcela já está paga" };

  const valorTotal = Number(parcela.valor);
  const valorJaPago = Number(parcela.valor_pago) || 0;
  const valorAposNovoPagamento = valorJaPago + input.valor_pago;
  const quitada = valorAposNovoPagamento >= valorTotal;
  const dataPagamento = input.data_pagamento || new Date().toISOString().slice(0, 10);

  // 2) Atualiza a parcela
  const novoValorPago = Math.min(valorAposNovoPagamento, valorTotal);

  await supabase
    .from("parcelas")
    .update({
      status: quitada ? "paga" : "parcial",
      valor_pago: novoValorPago,
      data_pagamento: quitada ? dataPagamento : parcela.data_pagamento,
    })
    .eq("id", input.parcela_id);

  // 3) Cria transação de entrada no caixa (com o valor pago, não o total)
  await supabase.from("transacoes").insert({
    user_id: user.id,
    data: dataPagamento,
    tipo: "entrada",
    empreendimento: "emprestimos",
    categoria: "recebimento_parcela",
    descricao: `Pagamento ${quitada ? "total" : "parcial"} — parcela ${parcela.numero}${
      !quitada ? ` (${formatarMoedaBR(input.valor_pago)})` : ""
    }`,
    valor: input.valor_pago,
    forma_pagamento: "dinheiro",
  });

  // 4) Se quitada e era a última pendente → marca empréstimo como quitado
  if (quitada) {
    const { data: restantes } = await supabase
      .from("parcelas")
      .select("id, status")
      .eq("emprestimo_id", parcela.emprestimos.id)
      .in("status", ["pendente", "atrasada", "parcial"]);

    if ((restantes || []).length === 0) {
      await supabase
        .from("emprestimos")
        .update({ status: "quitado" })
        .eq("id", parcela.emprestimos.id);
    }
  }

  revalidatePath("/cobrancas");
  revalidatePath("/emprestimos");
  revalidatePath("/");
  revalidatePath("/caixa");

  return {
    sucesso: true,
    quitada,
    mensagem: quitada
      ? "Parcela quitada! 🎉"
      : `Pagamento parcial registrado. Faltam ${formatarMoedaBR(
          valorTotal - novoValorPago,
        )}.`,
  };
}

// Helper interno de formatação (não importamos da constants para evitar
// dependência circular — é só para mensagens)
function formatarMoedaBR(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

// --------------------------------------------------------------------------
// 3) LISTAR COBRANÇAS PENDENTES (para a página de cobranças)
// --------------------------------------------------------------------------
export interface ParcelaParaCobranca {
  id: string;
  numero: number;
  valor: number;
  valor_pago: number;
  vencimento: string;
  status: string;
  data_pagamento: string | null;
  ultima_cobranca: string | null;
  cobrancas_count: number;
  emprestimo_id: string;
  cliente_nome: string;
  cliente_telefone: string | null;
  total_parcelas: number;
}

export async function listarCobrancasPendentes(): Promise<{
  data: ParcelaParaCobranca[];
  error?: string;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [] };

  // Busca parcelas pendentes/atrasadas/parciais com JOIN até o cliente
  const { data, error } = await supabase
    .from("parcelas")
    .select(
      `id, numero, valor, valor_pago, vencimento, status, data_pagamento,
       ultima_cobranca, cobrancas_count,
       emprestimo_id,
       emprestimos!inner(
         id, user_id, num_parcelas,
         clientes(nome, telefone)
       )`,
    )
    .eq("emprestimos.user_id", user.id)
    .in("status", ["pendente", "atrasada", "parcial"])
    .order("vencimento", { ascending: true });

  if (error) return { data: [], error: error.message };

  // Achata a estrutura (Supabase retorna aninhado)
  const resultado: ParcelaParaCobranca[] = (data || []).map((p: any) => ({
    id: p.id,
    numero: p.numero,
    valor: Number(p.valor),
    valor_pago: Number(p.valor_pago) || 0,
    vencimento: p.vencimento,
    status: p.status,
    data_pagamento: p.data_pagamento,
    ultima_cobranca: p.ultima_cobranca,
    cobrancas_count: p.cobrancas_count || 0,
    emprestimo_id: p.emprestimo_id,
    cliente_nome: p.emprestimos?.clientes?.nome || "—",
    cliente_telefone: p.emprestimos?.clientes?.telefone || null,
    total_parcelas: p.emprestimos?.num_parcelas || 0,
  }));

  // Ordena por urgência: atrasadas primeiro, depois por vencimento
  resultado.sort((a, b) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const va = new Date(a.vencimento + "T00:00:00");
    const vb = new Date(b.vencimento + "T00:00:00");
    const atrasadaA = va < hoje;
    const atrasadaB = vb < hoje;
    if (atrasadaA && !atrasadaB) return -1;
    if (!atrasadaA && atrasadaB) return 1;
    return va.getTime() - vb.getTime();
  });

  return { data: resultado };
}

// --------------------------------------------------------------------------
// 4) HISTÓRICO DE COBRANÇAS DE UMA PARCELA
// --------------------------------------------------------------------------
export async function listarHistoricoCobrancas(parcelaId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("cobrancas")
    .select("*")
    .eq("parcela_id", parcelaId)
    .order("data", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data || [] };
}
