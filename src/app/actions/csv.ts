"use server";

// ============================================================================
// SERVER ACTION: IMPORTAÇÃO DE CSV
// ============================================================================
// Recebe as transações já parseadas no cliente (browser) e insere no banco
// em lote. Por que no cliente?
//   - Leitura de arquivo só funciona bem no navegador
//   - O parseamento é simples, não precisa de servidor
//   - Enviamos só os dados já normalizados (JSON) pra cá

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Empreendimento, FormaPagamento } from "@/lib/types/database";

export interface TransacaoParaImportar {
  data: string;
  descricao: string;
  valor: number;
  categoria?: string;
}

export async function importarTransacoesCSV(input: {
  empreendimento: Empreendimento;
  transacoes: TransacaoParaImportar[];
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Você precisa estar logado." };
  if (!input.transacoes.length)
    return { error: "Nenhuma transação para importar." };

  // Converte cada transação para o formato da tabela.
  // Sinal positivo = entrada, negativo = saída.
  const linhas = input.transacoes.map((t) => ({
    user_id: user.id,
    data: t.data,
    tipo: t.valor >= 0 ? ("entrada" as const) : ("saida" as const),
    empreendimento: input.empreendimento,
    categoria: t.categoria || "importado_csv",
    descricao: t.descricao,
    // Guarda valor sempre positivo (sinal fica no tipo)
    valor: Math.abs(t.valor),
    forma_pagamento: "pix" as FormaPagamento, // padrão; usuário pode editar depois
  }));

  // Insere em lote (supabase aceita array)
  const { data, error } = await supabase
    .from("transacoes")
    .insert(linhas)
    .select();

  if (error) {
    return { error: `Erro ao importar: ${error.message}` };
  }

  revalidatePath("/");
  revalidatePath("/caixa");

  return {
    sucesso: true,
    quantidade: data?.length || 0,
    mensagem: `${data?.length || 0} transações importadas!`,
  };
}
