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
// TIPO UNIFICADO de evento para a UI (manual OU vencimento automático)
// --------------------------------------------------------------------------
export interface EventoCalendario {
  id: string;
  titulo: string;
  descricao?: string;
  data: string; // YYYY-MM-DD
  hora?: string | null;
  tipo: TipoEvento;
  concluido: boolean;
  origem: "manual" | "vencimento";
  entidade_tipo?: string | null;
  entidade_id?: string | null;
}

// --------------------------------------------------------------------------
// LISTAR EVENTOS DE UM MÊS (manuais + vencimentos automáticos)
// --------------------------------------------------------------------------
export async function listarEventosMes(ano: number, mes: number) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [] as EventoCalendario[] };

  // Intervalo do mês (1º a último dia)
  const inicio = new Date(ano, mes, 1).toISOString().slice(0, 10);
  const fim = new Date(ano, mes + 1, 0).toISOString().slice(0, 10);

  // Busca paralela: eventos manuais + vencimentos de parcelas
  const [eventosManuais, parcelas] = await Promise.all([
    supabase
      .from("eventos_agenda")
      .select("*")
      .eq("user_id", user.id)
      .gte("data", inicio)
      .lte("data", fim)
      .order("data", { ascending: true }),
    supabase
      .from("parcelas")
      .select(
        "id, numero, valor, valor_pago, vencimento, status, emprestimos!inner(user_id, num_parcelas, clientes(nome))",
      )
      .eq("emprestimos.user_id", user.id)
      .in("status", ["pendente", "atrasada", "parcial"])
      .gte("vencimento", inicio)
      .lte("vencimento", fim),
  ]);

  // Normaliza eventos manuais
  const manuais: EventoCalendario[] = (eventosManuais.data || []).map(
    (e: any) => ({
      id: e.id,
      titulo: e.titulo,
      descricao: e.descricao,
      data: e.data,
      hora: e.hora,
      tipo: e.tipo as TipoEvento,
      concluido: e.concluido,
      origem: "manual" as const,
      entidade_tipo: e.entidade_tipo,
      entidade_id: e.entidade_id,
    }),
  );

  // Normaliza vencimentos de parcelas (eventos automáticos)
  const vencimentos: EventoCalendario[] = (parcelas.data || []).map((p: any) => {
    const nome = p.emprestimos?.clientes?.nome || "—";
    const valorRestante = Number(p.valor) - (Number(p.valor_pago) || 0);
    const atrasada = new Date(p.vencimento + "T00:00:00") < new Date();
    return {
      id: `venc-${p.id}`,
      titulo: `${nome} — parcela ${p.numero}`,
      descricao: `${new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(valorRestante)}${atrasada ? " (atrasada)" : ""}`,
      data: p.vencimento,
      hora: null,
      tipo: "vencimento" as TipoEvento,
      concluido: false,
      origem: "vencimento" as const,
      entidade_tipo: "parcela",
      entidade_id: p.id,
    };
  });

  // Combina e ordena por data
  const todos = [...manuais, ...vencimentos].sort((a, b) =>
    a.data.localeCompare(b.data),
  );

  return { data: todos };
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
