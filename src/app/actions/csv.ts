"use server";

// ============================================================================
// SERVER ACTION: IMPORTAÇÃO DE CSV (4 tipos)
// ============================================================================
// Recebe as linhas já parseadas no cliente e salva no banco conforme o tipo:
//   - clientes    → insere em "clientes"
//   - caixa       → insere em "transacoes"
//   - sucatas     → insere em "movimentacao_sucatas" + transacao no caixa
//   - emprestimos → cria cliente (se preciso) + empréstimo + parcelas
//
// Tudo é feito de forma transacional por tipo: se uma linha falha, as outras
// continuam. Erros são reportados no retorno.

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calcularEmprestimo } from "@/lib/finance/calculadora";
import type {
  Empreendimento,
  FormaPagamento,
  SistemaJuros,
} from "@/lib/types/database";
import type { LinhaImportada } from "@/lib/csv/parser";

// --------------------------------------------------------------------------
// TIPO DE RETORNO UNIFICADO (todas as funções abaixo retornam este formato)
// --------------------------------------------------------------------------
export type ResultadoImportacao = {
  sucesso: boolean;
  error?: string;
  quantidade: number;
  falhas?: number;
  mensagem: string;
};

// --------------------------------------------------------------------------
// FUNÇÃO PRINCIPAL — roteia para o handler certo conforme o tipo
// --------------------------------------------------------------------------
export async function importarCSV(input: {
  tipo: "clientes" | "caixa" | "sucatas" | "emprestimos";
  linhas: LinhaImportada[];
}): Promise<ResultadoImportacao> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return {
      sucesso: false,
      error: "Você precisa estar logado.",
      quantidade: 0,
      mensagem: "Erro",
    };
  if (!input.linhas.length)
    return {
      sucesso: false,
      error: "Nenhuma linha válida para importar.",
      quantidade: 0,
      mensagem: "Erro",
    };

  switch (input.tipo) {
    case "clientes":
      return importarClientes(user.id, input.linhas, supabase);
    case "caixa":
      return importarCaixa(user.id, input.linhas, supabase);
    case "sucatas":
      return importarSucatas(user.id, input.linhas, supabase);
    case "emprestimos":
      return importarEmprestimos(user.id, input.linhas, supabase);
  }
}

// --------------------------------------------------------------------------
// 1) CLIENTES
// --------------------------------------------------------------------------
async function importarClientes(
  userId: string,
  linhas: LinhaImportada[],
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<ResultadoImportacao> {
  const dados = linhas.map((l) => ({
    user_id: userId,
    nome: l.nome!,
    telefone: l.telefone || null,
    observacoes: l.observacoes || null,
  }));

  const { data, error } = await supabase
    .from("clientes")
    .insert(dados)
    .select();

  if (error)
    return {
      sucesso: false,
      error: `Erro ao importar: ${error.message}`,
      quantidade: 0,
      mensagem: "Erro",
    };

  revalidatePath("/clientes");
  return {
    sucesso: true,
    quantidade: data?.length || 0,
    mensagem: `${data?.length || 0} cliente(s) importado(s)!`,
  };
}

// --------------------------------------------------------------------------
// 2) CAIXA
// --------------------------------------------------------------------------
async function importarCaixa(
  userId: string,
  linhas: LinhaImportada[],
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<ResultadoImportacao> {
  const dados = linhas.map((l) => ({
    user_id: userId,
    data: l.data!,
    tipo: l.tipo as "entrada" | "saida",
    empreendimento: l.empreendimento as Empreendimento,
    categoria: l.categoria || "outros",
    descricao: l.descricao || null,
    valor: l.valor!,
    forma_pagamento: (l.forma_pagamento || "dinheiro") as FormaPagamento,
  }));

  const { data, error } = await supabase
    .from("transacoes")
    .insert(dados)
    .select();

  if (error)
    return {
      sucesso: false,
      error: `Erro ao importar: ${error.message}`,
      quantidade: 0,
      mensagem: "Erro",
    };

  revalidatePath("/");
  revalidatePath("/caixa");
  return {
    sucesso: true,
    quantidade: data?.length || 0,
    mensagem: `${data?.length || 0} movimentação(ões) importada(s)!`,
  };
}

// --------------------------------------------------------------------------
// 3) SUCATAS (cria a movimentação + uma transação no caixa)
// --------------------------------------------------------------------------
async function importarSucatas(
  userId: string,
  linhas: LinhaImportada[],
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<ResultadoImportacao> {
  let sucesso = 0;
  let falhas = 0;

  for (const l of linhas) {
    const valorTotal = Math.round(l.peso_kg! * l.preco_por_kg! * 100) / 100;

    const { error: err1 } = await supabase
      .from("movimentacao_sucatas")
      .insert({
        user_id: userId,
        data: l.data!,
        tipo: l.tipo as "compra" | "venda",
        material: l.material!,
        peso_kg: l.peso_kg!,
        preco_por_kg: l.preco_por_kg!,
        valor_total: valorTotal,
        observacoes: l.observacoes || null,
      });

    if (err1) {
      falhas++;
      continue;
    }

    await supabase.from("transacoes").insert({
      user_id: userId,
      data: l.data!,
      tipo: l.tipo === "venda" ? "entrada" : "saida",
      empreendimento: "sucatas",
      categoria: l.tipo === "venda" ? "venda_sucata" : "compra_sucata",
      descricao: `${l.tipo === "venda" ? "Venda" : "Compra"} de ${l.material} (${l.peso_kg}kg)`,
      valor: valorTotal,
      forma_pagamento: "dinheiro",
    });

    sucesso++;
  }

  revalidatePath("/sucatas");
  revalidatePath("/");
  revalidatePath("/caixa");
  return {
    sucesso: true,
    quantidade: sucesso,
    falhas,
    mensagem: `${sucesso} sucata(s) importada(s)!${falhas ? ` (${falhas} falharam)` : ""}`,
  };
}

// --------------------------------------------------------------------------
// 4) EMPRÉSTIMOS (cria cliente se preciso + empréstimo + parcelas)
// --------------------------------------------------------------------------
async function importarEmprestimos(
  userId: string,
  linhas: LinhaImportada[],
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<ResultadoImportacao> {
  let sucesso = 0;
  let falhas = 0;

  for (const l of linhas) {
    try {
      // 1) Busca ou cria o cliente
      const { data: clienteExistente } = await supabase
        .from("clientes")
        .select("id")
        .eq("user_id", userId)
        .eq("nome", l.cliente_nome!)
        .maybeSingle();

      let clienteId = clienteExistente?.id;

      if (!clienteId) {
        const { data: novoCliente, error: errCliente } = await supabase
          .from("clientes")
          .insert({
            user_id: userId,
            nome: l.cliente_nome!,
            telefone: l.cliente_telefone || null,
          })
          .select()
          .single();

        if (errCliente) {
          falhas++;
          continue;
        }
        clienteId = novoCliente.id;
      }

      // 2) Calcula parcelas
      const calculo = calcularEmprestimo({
        valorPrincipal: l.valor_principal!,
        taxaJurosMensal: l.taxa_juros || 0,
        numParcelas: l.num_parcelas!,
        dataInicio: l.data_inicio!,
        sistema: (l.sistema_juros || "price") as SistemaJuros,
      });

      // 3) Cria empréstimo
      const { data: emprestimo, error: errEmp } = await supabase
        .from("emprestimos")
        .insert({
          user_id: userId,
          cliente_id: clienteId,
          valor_principal: l.valor_principal!,
          taxa_juros: l.taxa_juros || 0,
          num_parcelas: l.num_parcelas!,
          data_inicio: l.data_inicio!,
          sistema_juros: (l.sistema_juros || "price") as SistemaJuros,
          valor_parcela: calculo.valorParcela,
          valor_total: calculo.valorTotal,
          status: "ativo",
          observacoes: l.observacoes || null,
        })
        .select()
        .single();

      if (errEmp) {
        falhas++;
        continue;
      }

      // 4) Cria parcelas
      const parcelasParaInserir = calculo.parcelas.map((p) => ({
        emprestimo_id: emprestimo.id,
        numero: p.numero,
        valor: p.valor,
        vencimento: p.vencimento,
        status: "pendente",
      }));

      await supabase.from("parcelas").insert(parcelasParaInserir);

      sucesso++;
    } catch {
      falhas++;
    }
  }

  revalidatePath("/emprestimos");
  revalidatePath("/clientes");
  revalidatePath("/");
  return {
    sucesso: true,
    quantidade: sucesso,
    falhas,
    mensagem: `${sucesso} empréstimo(s) importado(s)!${falhas ? ` (${falhas} falharam)` : ""}`,
  };
}
