"use server";

// ============================================================================
// SERVER ACTIONS — AGENDA
// ============================================================================
// CRUD de eventos manuais + função que retorna TODOS os eventos de um mês
// (combinando eventos manuais + vencimentos automáticos de parcelas).

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validarPosse } from "@/lib/auth/posse";
import type { TipoEvento } from "@/lib/types/database";

// --------------------------------------------------------------------------
// TIPO UNIFICADO de evento para a UI
// --------------------------------------------------------------------------
// "origem" identifica de onde o evento veio — útil para a UI saber o que
// mostrar e como reagir ao clicar (ex: ir para o detalhe do empréstimo).
export interface EventoCalendario {
  id: string;
  titulo: string;
  descricao?: string;
  data: string; // YYYY-MM-DD
  hora?: string | null;
  tipo: TipoEvento;
  concluido: boolean;
  origem:
    | "manual"
    | "vencimento"
    | "inicio_emprestimo"
    | "cobranca"
    | "pagamento";
  entidade_tipo?: string | null;
  entidade_id?: string | null;
}

// Helper: extrai YYYY-MM-DD de um timestamp ISO
function soData(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toISOString().slice(0, 10);
}

// Helper: formata valor em R$
function fmtBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

// --------------------------------------------------------------------------
// LISTAR EVENTOS DE UM MÊS
// --------------------------------------------------------------------------
// Combina 5 fontes de eventos:
//   1. eventos_agenda (manuais: follow-up, reunião, etc)
//   2. vencimentos de parcelas pendentes/atrasadas/parciais
//   3. início de empréstimos (data_inicio)
//   4. cobranças enviadas (tabela cobrancas)
//   5. pagamentos recebidos (parcelas com data_pagamento)
// --------------------------------------------------------------------------
export async function listarEventosMes(ano: number, mes: number) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [] as EventoCalendario[] };

  // Intervalo do mês VISÍVEL (1º a último dia)
  const inicio = new Date(ano, mes, 1).toISOString().slice(0, 10);
  const fim = new Date(ano, mes + 1, 0).toISOString().slice(0, 10);

  // Busca paralela de todas as fontes
  const [
    eventosManuais,
    parcelasTodas,
    emprestimos,
    cobrancas,
    clientes,
  ] = await Promise.all([
    // 1. Eventos manuais do mês
    supabase
      .from("eventos_agenda")
      .select("*")
      .eq("user_id", user.id)
      .gte("data", inicio)
      .lte("data", fim),

    // 2. TODAS as parcelas do usuário
    supabase
      .from("parcelas")
      .select(
        "id, numero, valor, valor_pago, vencimento, data_pagamento, status, emprestimos!inner(user_id, id, num_parcelas, data_inicio, cliente_id)",
      )
      .eq("emprestimos.user_id", user.id),

    // 3. Empréstimos com início no mês visível
    supabase
      .from("emprestimos")
      .select("id, data_inicio, num_parcelas, valor_principal, cliente_id")
      .eq("user_id", user.id)
      .gte("data_inicio", inicio)
      .lte("data_inicio", fim),

    // 4. Cobranças enviadas (timestamp → filtramos por mês no código)
    supabase
      .from("cobrancas")
      .select("id, data, canal, parcelas(id, numero, emprestimos!inner(user_id, cliente_id))")
      .eq("parcelas.emprestimos.user_id", user.id),

    // 5. Clientes (para mapear id → nome)
    supabase
      .from("clientes")
      .select("id, nome")
      .eq("user_id", user.id),
  ]);

  // Mapa de clientes: id → nome (para lookup rápido)
  const nomeCliente: Record<string, string> = {};
  for (const c of clientes.data || []) {
    nomeCliente[c.id] = c.nome;
  }

  const eventos: EventoCalendario[] = [];

  // ----- 1. MANUAIS -----
  for (const e of eventosManuais.data || []) {
    eventos.push({
      id: e.id,
      titulo: e.titulo,
      descricao: e.descricao,
      data: e.data,
      hora: e.hora,
      tipo: e.tipo as TipoEvento,
      concluido: e.concluido,
      origem: "manual",
    });
  }

  // ----- 2. VENCIMENTOS de parcelas pendentes/atrasadas/parciais -----
  for (const p of (parcelasTodas.data || []) as any[]) {
    if (!["pendente", "atrasada", "parcial"].includes(p.status)) continue;
    const data = soData(p.vencimento);
    if (!data || data < inicio || data > fim) continue;

    const emp = Array.isArray(p.emprestimos) ? p.emprestimos[0] : p.emprestimos;
    const nome = nomeCliente[emp?.cliente_id] || "—";
    const valorRestante = Number(p.valor) - (Number(p.valor_pago) || 0);
    const atrasada = new Date(p.vencimento + "T00:00:00") < new Date();
    eventos.push({
      id: `venc-${p.id}`,
      titulo: `${nome} — parcela ${p.numero}${atrasada ? " (atrasada)" : ""}`,
      descricao: fmtBRL(valorRestante),
      data,
      hora: null,
      tipo: "vencimento",
      concluido: false,
      origem: "vencimento",
      entidade_tipo: "parcela",
      entidade_id: p.id,
    });
  }

  // ----- 3. INÍCIO DE EMPRÉSTIMOS -----
  for (const emp of (emprestimos.data || []) as any[]) {
    const data = soData(emp.data_inicio);
    if (!data) continue;
    const nome = nomeCliente[emp.cliente_id] || "—";
    const valorParcela = emp.num_parcelas
      ? Number(emp.valor_principal) / emp.num_parcelas
      : 0;
    eventos.push({
      id: `emp-${emp.id}`,
      titulo: `💰 ${nome} — novo empréstimo`,
      descricao: `${emp.num_parcelas}x de ${fmtBRL(valorParcela)}`,
      data,
      hora: null,
      tipo: "outros",
      concluido: true,
      origem: "inicio_emprestimo",
      entidade_tipo: "emprestimo",
      entidade_id: emp.id,
    });
  }

  // ----- 4. COBRANÇAS ENVIADAS -----
  for (const c of (cobrancas.data || []) as any[]) {
    const data = soData(c.data);
    if (!data || data < inicio || data > fim) continue;
    const parc = Array.isArray(c.parcelas) ? c.parcelas[0] : c.parcelas;
    const emp = parc ? (Array.isArray(parc.emprestimos) ? parc.emprestimos[0] : parc.emprestimos) : null;
    const nome = nomeCliente[emp?.cliente_id] || "—";
    eventos.push({
      id: `cob-${c.id}`,
      titulo: `📲 Cobrança enviada — ${nome}`,
      descricao: c.canal === "whatsapp" ? "Via WhatsApp" : `Via ${c.canal}`,
      data,
      hora: null,
      tipo: "followup",
      concluido: true,
      origem: "cobranca",
      entidade_tipo: "parcela",
      entidade_id: parc?.id || null,
    });
  }

  // ----- 5. PAGAMENTOS RECEBIDOS (data_pagamento) -----
  for (const p of (parcelasTodas.data || []) as any[]) {
    if (p.status !== "paga" && p.status !== "parcial") continue;
    const data = soData(p.data_pagamento);
    if (!data || data < inicio || data > fim) continue;
    const emp = Array.isArray(p.emprestimos) ? p.emprestimos[0] : p.emprestimos;
    const nome = nomeCliente[emp?.cliente_id] || "—";
    const pago = Number(p.valor_pago) || 0;
    eventos.push({
      id: `pag-${p.id}-${data}`,
      titulo: `✅ Pagamento recebido — ${nome}`,
      descricao: `${fmtBRL(pago)} • parcela ${p.numero}`,
      data,
      hora: null,
      tipo: "pagamento",
      concluido: true,
      origem: "pagamento",
      entidade_tipo: "emprestimo",
      entidade_id: emp?.id || null,
    });
  }

  // Ordena por data
  eventos.sort((a, b) => a.data.localeCompare(b.data));

  return { data: eventos };
}

// --------------------------------------------------------------------------
// CRUD DE EVENTOS MANUAIS
// --------------------------------------------------------------------------
export async function criarEvento(input: {
  titulo: string;
  descricao?: string;
  data: string;
  hora?: string;
  tipo: TipoEvento;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };
  if (!input.titulo?.trim()) return { error: "Título é obrigatório" };
  if (!input.data) return { error: "Data é obrigatória" };

  const { data, error } = await supabase
    .from("eventos_agenda")
    .insert({
      user_id: user.id,
      titulo: input.titulo.trim(),
      descricao: input.descricao?.trim() || null,
      data: input.data,
      hora: input.hora || null,
      tipo: input.tipo,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/agenda");
  return { data };
}

export async function alternarConcluido(id: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };

  // Busca estado atual
  const { data: ev } = await supabase
    .from("eventos_agenda")
    .select("concluido")
    .eq("id", id)
    .single();

  if (!ev) return { error: "Evento não encontrado" };

  const { error } = await supabase
    .from("eventos_agenda")
    .update({ concluido: !ev.concluido })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/agenda");
  return { success: true };
}

export async function apagarEvento(id: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };

  // ✅ FIX-01: valida posse
  const dono = await validarPosse(supabase, user.id, "eventos_agenda", id);
  if (!dono) return { error: "Evento não encontrado" };

  const { error } = await supabase
    .from("eventos_agenda")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/agenda");
  return { success: true };
}

// --------------------------------------------------------------------------
// LISTAR TODOS OS EVENTOS (para exportação .ics — próximos 90 dias)
// --------------------------------------------------------------------------
export async function listarTodosEventesParaExport(): Promise<{
  data: EventoCalendario[];
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [] };

  // Próximos 90 dias para o .ics
  const hoje = new Date().toISOString().slice(0, 10);
  const limite = new Date();
  limite.setDate(limite.getDate() + 90);
  const limiteStr = limite.toISOString().slice(0, 10);

  const [manuais, parcelas] = await Promise.all([
    supabase
      .from("eventos_agenda")
      .select("*")
      .eq("user_id", user.id)
      .gte("data", hoje)
      .lte("data", limiteStr)
      .order("data"),
    supabase
      .from("parcelas")
      .select(
        "id, numero, valor, valor_pago, vencimento, emprestimos!inner(user_id, clientes(nome))",
      )
      .eq("emprestimos.user_id", user.id)
      .in("status", ["pendente", "atrasada", "parcial"])
      .gte("vencimento", hoje)
      .lte("vencimento", limiteStr),
  ]);

  const eventos: EventoCalendario[] = [
    ...(manuais.data || []).map((e: any) => ({
      id: e.id,
      titulo: e.titulo,
      descricao: e.descricao,
      data: e.data,
      hora: e.hora,
      tipo: e.tipo as TipoEvento,
      concluido: e.concluido,
      origem: "manual" as const,
    })),
    ...(parcelas.data || []).map((p: any) => ({
      id: `venc-${p.id}`,
      titulo: `${p.emprestimos?.clientes?.nome || "—"} — vencimento parcela ${p.numero}`,
      descricao: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Number(p.valor) - (Number(p.valor_pago) || 0)),
      data: p.vencimento,
      hora: null,
      tipo: "vencimento" as TipoEvento,
      concluido: false,
      origem: "vencimento" as const,
    })),
  ];

  return { data: eventos.sort((a, b) => a.data.localeCompare(b.data)) };
}
