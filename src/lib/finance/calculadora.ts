// ============================================================================
// CALCULADORA FINANCEIRA
// ============================================================================
// Toda a lógica de cálculo de empréstimos fica aqui. Separada das telas,
// fica fácil testar e reutilizar. Implementamos dois sistemas:
//
// 1. TABELA PRICE (parcelas iguais)
//    A mesma fórmula usada em financiamentos de banco. Todas as parcelas
//    têm o mesmo valor. Nos primeiros meses você paga mais juros, no fim
//    paga mais principal.
//
// 2. JUROS SIMPLES (parcelas iguais com juros linear)
//    Juros = principal × taxa × tempo. Total dividido igualmente nas
//    parcelas. Mais simples de entender para o cliente.
//
// Tudo arredondado para 2 casas (centavos) para evitar erros de centavo.

import type { Parcela, SistemaJuros } from "@/lib/types/database";

export interface DadosEmprestimo {
  valorPrincipal: number;
  taxaJurosMensal: number; // ex: 5 para 5% ao mês
  numParcelas: number;
  dataInicio: string; // ISO date
  sistema: SistemaJuros;
}

export interface ResultadoCalculo {
  valorParcela: number;
  valorTotal: number;
  totalJuros: number;
  parcelas: Omit<Parcela, "id" | "emprestimo_id" | "created_at" | "updated_at">[];
}

// --------------------------------------------------------------------------
// Soma de meses a uma data (tratando fim de mês: 31/01 + 1 mês = 28/02)
// --------------------------------------------------------------------------
function adicionarMeses(data: Date, meses: number): Date {
  const resultado = new Date(data);
  const diaOriginal = resultado.getDate();
  resultado.setMonth(resultado.getMonth() + meses);
  // Se o dia "estourou" (ex: 31/01 + 1 = 03/03), voltar para o último dia
  if (resultado.getDate() < diaOriginal) {
    resultado.setDate(0); // último dia do mês anterior
  }
  return resultado;
}

// --------------------------------------------------------------------------
// Cálculo pela TABELA PRICE
// --------------------------------------------------------------------------
// Fórmula:   PMT = PV × i / (1 - (1 + i)^-n)
// Onde:      PMT = parcela, PV = principal, i = taxa, n = nº parcelas
// --------------------------------------------------------------------------
function calcularPrice(dados: DadosEmprestimo): ResultadoCalculo {
  const { valorPrincipal, taxaJurosMensal, numParcelas, dataInicio } = dados;
  const i = taxaJurosMensal / 100;

  let valorParcela: number;
  if (i === 0) {
    // Sem juros: divide igualmente
    valorParcela = valorPrincipal / numParcelas;
  } else {
    valorParcela =
      (valorPrincipal * i) / (1 - Math.pow(1 + i, -numParcelas));
  }

  // Arredondar para 2 casas (centavos)
  valorParcela = Math.round(valorParcela * 100) / 100;
  const valorTotal = Math.round(valorParcela * numParcelas * 100) / 100;
  const totalJuros = Math.round((valorTotal - valorPrincipal) * 100) / 100;

  const dataBase = new Date(dataInicio + "T00:00:00");
  const parcelas = Array.from({ length: numParcelas }, (_, index) => {
    const vencimento = adicionarMeses(dataBase, index + 1);
    return {
      numero: index + 1,
      valor: valorParcela,
      vencimento: vencimento.toISOString().slice(0, 10),
      status: "pendente" as const,
      data_pagamento: null,
    };
  });

  return { valorParcela, valorTotal, totalJuros, parcelas };
}

// --------------------------------------------------------------------------
// Cálculo por JUROS SIMPLES
// --------------------------------------------------------------------------
// Total = Principal + (Principal × Taxa × N)
// Cada parcela = Total / N
// --------------------------------------------------------------------------
function calcularSimples(dados: DadosEmprestimo): ResultadoCalculo {
  const { valorPrincipal, taxaJurosMensal, numParcelas, dataInicio } = dados;
  const i = taxaJurosMensal / 100;

  const totalJuros = valorPrincipal * i * numParcelas;
  const valorTotal = valorPrincipal + totalJuros;
  const valorParcela = valorTotal / numParcelas;

  const valorParcelaArredondado = Math.round(valorParcela * 100) / 100;
  const valorTotalArredondado =
    Math.round(valorParcelaArredondado * numParcelas * 100) / 100;
  const totalJurosArredondado =
    Math.round((valorTotalArredondado - valorPrincipal) * 100) / 100;

  const dataBase = new Date(dataInicio + "T00:00:00");
  const parcelas = Array.from({ length: numParcelas }, (_, index) => {
    const vencimento = adicionarMeses(dataBase, index + 1);
    return {
      numero: index + 1,
      valor: valorParcelaArredondado,
      vencimento: vencimento.toISOString().slice(0, 10),
      status: "pendente" as const,
      data_pagamento: null,
    };
  });

  return {
    valorParcela: valorParcelaArredondado,
    valorTotal: valorTotalArredondado,
    totalJuros: totalJurosArredondado,
    parcelas,
  };
}

// --------------------------------------------------------------------------
// FUNÇÃO PRINCIPAL (ponto de entrada)
// --------------------------------------------------------------------------
export function calcularEmprestimo(dados: DadosEmprestimo): ResultadoCalculo {
  // Validações defensivas
  if (dados.valorPrincipal <= 0) {
    throw new Error("Valor principal deve ser maior que zero");
  }
  if (dados.numParcelas <= 0) {
    throw new Error("Número de parcelas deve ser maior que zero");
  }
  if (dados.taxaJurosMensal < 0) {
    throw new Error("Taxa de juros não pode ser negativa");
  }

  return dados.sistema === "price"
    ? calcularPrice(dados)
    : calcularSimples(dados);
}

// --------------------------------------------------------------------------
// UTILITÁRIOS para exibição
// --------------------------------------------------------------------------
export function statusParcelaVencida(
  parcela: { status: string; vencimento: string; data_pagamento: string | null },
  hoje: Date = new Date(),
): "pendente" | "atrasada" | "paga" {
  if (parcela.status === "paga") return "paga";
  const vencimento = new Date(parcela.vencimento + "T00:00:00");
  const hojeSemHora = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate(),
  );
  return vencimento < hojeSemHora ? "atrasada" : "pendente";
}
