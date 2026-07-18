// ============================================================================
// PARSER DE PLANILHAS CSV — PADRÃO "MEU CAIXA"
// ============================================================================
// Diferente da versão anterior (que tentava adivinhar o banco), esta versão
// usa UM padrão fixo e limpo, definido por nós. O usuário baixa o template,
// preenche no Excel/Google Sheets, e importa.
//
// Vantagens:
//   - Sem ambiguidade: cabeçalhos em português, claros
//   - Detecção automática do TIPO de planilha (clientes, caixa, etc.)
//   - Validação linha a linha com mensagens em português
//   - Funciona em desktop e celular
//
// Os 4 tipos suportados:
//   1. clientes    → cadastro de clientes
//   2. caixa       → movimentações financeiras (vendas/despesas)
//   3. sucatas     → compra/venda de sucata por peso
//   4. emprestimos → cria cliente (se preciso) + empréstimo + parcelas

// --------------------------------------------------------------------------
// TIPOS
// --------------------------------------------------------------------------

export type TipoPlanilha = "clientes" | "caixa" | "sucatas" | "emprestimos";

// Campos possíveis de cada linha (união — o que não se aplica fica undefined)
export interface LinhaImportada {
  // Comuns
  data?: string; // ISO YYYY-MM-DD
  tipo?: string; // entrada/saida (caixa) | compra/venda (sucatas)
  descricao?: string;
  observacoes?: string;
  valor?: number;

  // Clientes
  nome?: string;
  telefone?: string;

  // Caixa
  empreendimento?: string;
  categoria?: string;
  forma_pagamento?: string;

  // Sucatas
  material?: string;
  peso_kg?: number;
  preco_por_kg?: number;

  // Empréstimos
  valor_principal?: number;
  taxa_juros?: number;
  num_parcelas?: number;
  data_inicio?: string;
  sistema_juros?: string;
  cliente_nome?: string;
  cliente_telefone?: string;
}

export interface ResultadoParse {
  tipo: TipoPlanilha;
  linhas: LinhaImportada[];
  totalLinhas: number;
  linhasIgnoradas: number;
  erros: Array<{ linha: number; mensagem: string }>;
}

// --------------------------------------------------------------------------
// DETECÇÃO AUTOMÁTICA DO TIPO DE PLANILHA
// --------------------------------------------------------------------------
// Olha o cabeçalho (primeira linha) e decide qual é o tipo.
export function detectarTipo(conteudo: string): TipoPlanilha | null {
  const primeiraLinha = (conteudo.split("\n")[0] || "")
    .toLowerCase()
    .trim();

  // Empréstimos: tem campos característicos
  if (
    primeiraLinha.includes("valor_principal") ||
    primeiraLinha.includes("num_parcelas") ||
    primeiraLinha.includes("taxa_juros")
  ) {
    return "emprestimos";
  }

  // Sucatas: tem peso_kg ou material
  if (
    primeiraLinha.includes("peso_kg") ||
    primeiraLinha.includes("material")
  ) {
    return "sucatas";
  }

  // Clientes: só nome (e opcional telefone/observacoes), sem valor
  if (
    primeiraLinha.includes("nome") &&
    !primeiraLinha.includes("valor") &&
    !primeiraLinha.includes("empreendimento")
  ) {
    return "clientes";
  }

  // Caixa: tem valor + tipo ou empreendimento
  if (
    (primeiraLinha.includes("valor") && primeiraLinha.includes("tipo")) ||
    primeiraLinha.includes("empreendimento")
  ) {
    return "caixa";
  }

  return null;
}

// --------------------------------------------------------------------------
// PARSER PRINCIPAL
// --------------------------------------------------------------------------
export function parseCSV(conteudo: string): ResultadoParse {
  const erros: Array<{ linha: number; mensagem: string }> = [];
  const linhas: LinhaImportada[] = [];

  const tipo = detectarTipo(conteudo);

  if (!tipo) {
    return {
      tipo: "caixa", // fallback
      linhas: [],
      totalLinhas: 0,
      linhasIgnoradas: 0,
      erros: [
        {
          linha: 0,
          mensagem:
            "Não reconheci o tipo de planilha. Baixe o template correto e tente de novo.",
        },
      ],
    };
  }

  // Quebra em linhas e detecta separador
  const linhasBrutas = conteudo
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim());

  if (linhasBrutas.length < 2) {
    return {
      tipo,
      linhas: [],
      totalLinhas: 0,
      linhasIgnoradas: 0,
      erros: [
        {
          linha: 0,
          mensagem: "Arquivo vazio ou só com cabeçalho.",
        },
      ],
    };
  }

  const separador = detectarSeparador(linhasBrutas[0]);
  const cabecalho = parsearLinhaCSV(linhasBrutas[0], separador).map((c) =>
    c.toLowerCase().trim(),
  );

  // Processa cada linha de dados
  for (let i = 1; i < linhasBrutas.length; i++) {
    const linhaNum = i + 1;
    const colunas = parsearLinhaCSV(linhasBrutas[i], separador);

    // Constrói objeto da linha mapeando coluna → valor
    const obj: Record<string, string> = {};
    cabecalho.forEach((col, idx) => {
      obj[col] = (colunas[idx] || "").trim();
    });

    // Pula linhas completamente vazias
    if (Object.values(obj).every((v) => !v)) continue;

    try {
      const linha = processarLinha(obj, tipo, linhaNum);
      if (linha) linhas.push(linha);
    } catch (e) {
      erros.push({
        linha: linhaNum,
        mensagem: e instanceof Error ? e.message : "Erro ao processar linha",
      });
    }
  }

  return {
    tipo,
    linhas,
    totalLinhas: linhas.length,
    linhasIgnoradas: erros.length,
    erros,
  };
}

// --------------------------------------------------------------------------
// PROCESSAMENTO POR TIPO — valida e normaliza cada linha
// --------------------------------------------------------------------------
function processarLinha(
  obj: Record<string, string>,
  tipo: TipoPlanilha,
  linhaNum: number,
): LinhaImportada | null {
  switch (tipo) {
    case "clientes":
      return processarCliente(obj, linhaNum);
    case "caixa":
      return processarCaixa(obj, linhaNum);
    case "sucatas":
      return processarSucata(obj, linhaNum);
    case "emprestimos":
      return processarEmprestimo(obj, linhaNum);
  }
}

// --- CLIENTES ---
function processarCliente(
  obj: Record<string, string>,
  linhaNum: number,
): LinhaImportada {
  const nome = obj.nome || "";
  if (!nome) throw new Error(`Linha ${linhaNum}: nome é obrigatório`);

  return {
    nome,
    telefone: obj.telefone || undefined,
    observacoes: obj.observacoes || undefined,
  };
}

// --- CAIXA ---
function processarCaixa(
  obj: Record<string, string>,
  linhaNum: number,
): LinhaImportada {
  // Validações
  if (!obj.data) throw new Error(`Linha ${linhaNum}: data é obrigatória`);
  if (!obj.tipo) throw new Error(`Linha ${linhaNum}: tipo é obrigatório`);
  if (!obj.empreendimento)
    throw new Error(`Linha ${linhaNum}: empreendimento é obrigatório`);
  if (!obj.valor) throw new Error(`Linha ${linhaNum}: valor é obrigatório`);

  const data = normalizarData(obj.data);
  if (!data)
    throw new Error(
      `Linha ${linhaNum}: data inválida (use DD/MM/AAAA ou AAAA-MM-DD)`,
    );

  const valor = normalizarValor(obj.valor);
  if (isNaN(valor) || valor <= 0)
    throw new Error(`Linha ${linhaNum}: valor inválido`);

  const tipoNormalizado = obj.tipo.toLowerCase().trim();
  if (!["entrada", "saida"].includes(tipoNormalizado))
    throw new Error(
      `Linha ${linhaNum}: tipo deve ser "entrada" ou "saida"`,
    );

  const empNormalizado = obj.empreendimento.toLowerCase().trim();
  if (!["adega", "emprestimos", "sucatas"].includes(empNormalizado))
    throw new Error(
      `Linha ${linhaNum}: empreendimento deve ser adega, emprestimos ou sucatas`,
    );

  return {
    data,
    tipo: tipoNormalizado,
    empreendimento: empNormalizado,
    categoria: obj.categoria || "outros",
    descricao: obj.descricao || undefined,
    valor,
    forma_pagamento: obj.forma_pagamento || "dinheiro",
  };
}

// --- SUCATAS ---
function processarSucata(
  obj: Record<string, string>,
  linhaNum: number,
): LinhaImportada {
  if (!obj.data) throw new Error(`Linha ${linhaNum}: data é obrigatória`);
  if (!obj.tipo) throw new Error(`Linha ${linhaNum}: tipo é obrigatório`);
  if (!obj.material)
    throw new Error(`Linha ${linhaNum}: material é obrigatório`);
  if (!obj.peso_kg) throw new Error(`Linha ${linhaNum}: peso_kg é obrigatório`);
  if (!obj.preco_por_kg)
    throw new Error(`Linha ${linhaNum}: preco_por_kg é obrigatório`);

  const data = normalizarData(obj.data);
  if (!data)
    throw new Error(`Linha ${linhaNum}: data inválida`);

  const tipoNorm = obj.tipo.toLowerCase().trim();
  if (!["compra", "venda"].includes(tipoNorm))
    throw new Error(`Linha ${linhaNum}: tipo deve ser "compra" ou "venda"`);

  const peso = parseFloat(obj.peso_kg.replace(",", "."));
  if (isNaN(peso) || peso <= 0)
    throw new Error(`Linha ${linhaNum}: peso inválido`);

  const preco = normalizarValor(obj.preco_por_kg);
  if (isNaN(preco) || preco < 0)
    throw new Error(`Linha ${linhaNum}: preço/kg inválido`);

  return {
    data,
    tipo: tipoNorm,
    material: obj.material,
    peso_kg: peso,
    preco_por_kg: preco,
    observacoes: obj.observacoes || undefined,
  };
}

// --- EMPRÉSTIMOS ---
function processarEmprestimo(
  obj: Record<string, string>,
  linhaNum: number,
): LinhaImportada {
  if (!obj.cliente_nome)
    throw new Error(`Linha ${linhaNum}: cliente_nome é obrigatório`);
  if (!obj.valor_principal)
    throw new Error(`Linha ${linhaNum}: valor_principal é obrigatório`);
  if (!obj.num_parcelas)
    throw new Error(`Linha ${linhaNum}: num_parcelas é obrigatório`);
  if (!obj.data_inicio)
    throw new Error(`Linha ${linhaNum}: data_inicio é obrigatório`);

  const valorPrincipal = normalizarValor(obj.valor_principal);
  if (isNaN(valorPrincipal) || valorPrincipal <= 0)
    throw new Error(`Linha ${linhaNum}: valor_principal inválido`);

  const numParcelas = parseInt(obj.num_parcelas);
  if (isNaN(numParcelas) || numParcelas <= 0)
    throw new Error(`Linha ${linhaNum}: num_parcelas inválido`);

  const taxaJuros = obj.taxa_juros ? normalizarValor(obj.taxa_juros) : 0;
  if (isNaN(taxaJuros) || taxaJuros < 0)
    throw new Error(`Linha ${linhaNum}: taxa_juros inválido`);

  const dataInicio = normalizarData(obj.data_inicio);
  if (!dataInicio)
    throw new Error(`Linha ${linhaNum}: data_inicio inválida`);

  const sistema = (obj.sistema_juros || "price").toLowerCase().trim();
  if (!["price", "simples"].includes(sistema))
    throw new Error(`Linha ${linhaNum}: sistema_juros deve ser "price" ou "simples"`);

  return {
    cliente_nome: obj.cliente_nome,
    cliente_telefone: obj.cliente_telefone || undefined,
    valor_principal: valorPrincipal,
    taxa_juros: taxaJuros,
    num_parcelas: numParcelas,
    data_inicio: dataInicio,
    sistema_juros: sistema,
    observacoes: obj.observacoes || undefined,
  };
}

// --------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------

function detectarSeparador(linha: string): string {
  if (linha.includes(";")) return ";";
  if (linha.includes("\t")) return "\t";
  return ",";
}

function parsearLinhaCSV(linha: string, separador: string): string[] {
  const resultado: string[] = [];
  let atual = "";
  let dentroAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const char = linha[i];

    if (char === '"') {
      dentroAspas = !dentroAspas;
    } else if (char === separador && !dentroAspas) {
      resultado.push(atual.trim().replace(/^"|"$/g, ""));
      atual = "";
    } else {
      atual += char;
    }
  }
  resultado.push(atual.trim().replace(/^"|"$/g, ""));
  return resultado;
}

// Normaliza data para ISO (YYYY-MM-DD) aceitando:
//   DD/MM/AAAA, DD/MM/AA, AAAA-MM-DD, DD-MM-AAAA
function normalizarData(raw: string): string | null {
  if (!raw) return null;
  const limpo = raw.trim().replace(/['"]/g, "");

  const br = limpo.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (br) {
    const [_, dia, mes, ano] = br;
    const anoFull = ano.length === 2 ? `20${ano}` : ano;
    return `${anoFull}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }

  const iso = limpo.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return limpo;

  const traco = limpo.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (traco) {
    const [_, dia, mes, ano] = traco;
    const anoFull = ano.length === 2 ? `20${ano}` : ano;
    return `${anoFull}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }

  return null;
}

// Normaliza valor monetário brasileiro:
//   "1.234,56"  → 1234.56
//   "1234.56"   → 1234.56
//   "R$ 1.234"  → 1234
function normalizarValor(raw: string): number {
  if (!raw) return NaN;
  let limpo = raw
    .trim()
    .replace(/R\$/g, "")
    .replace(/\s/g, "")
    .replace(/['"]/g, "");

  if (limpo.includes(".") && limpo.includes(",")) {
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  } else if (limpo.includes(",") && !limpo.includes(".")) {
    limpo = limpo.replace(",", ".");
  }

  return parseFloat(limpo);
}
