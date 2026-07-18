// ============================================================================
// PARSER DE EXTRATOS BANCÁRIOS EM CSV
// ============================================================================
// Detecta automaticamente o formato do banco (Nubank, Itaú, Bradesco, genérico)
// e converte cada linha em uma transação normalizada.
//
// Por que detecção automática?
//   Cada banco exporta o CSV de um jeito. Em vez de exigir que o usuário
//   selecione o banco, detectamos pelo padrão das colunas.
//
// Bancos suportados:
//   - Nubank (formato mais comum no Brasil)
//   - Itaú
//   - Bradesco
//   - Genérico (qualquer CSV com data, descrição, valor)

export type BancoDetectado =
  | "nubank"
  | "itau"
  | "bradesco"
  | "inter"
  | "generico";

export interface TransacaoCSV {
  data: string; // ISO: YYYY-MM-DD
  descricao: string;
  valor: number; // positivo = entrada, negativo = saída
  categoria?: string;
  // Campo técnico para auditoria: marca que veio de importação
  origem: "csv";
  banco: BancoDetectado;
}

export interface ResultadoParse {
  banco: BancoDetectado;
  transacoes: TransacaoCSV[];
  totalLinhas: number;
  linhasIgnoradas: number;
  erros: string[];
}

// --------------------------------------------------------------------------
// 1) DETECÇÃO AUTOMÁTICA DO BANCO
// --------------------------------------------------------------------------
// Analisa o cabeçalho (primeiras linhas) e identifica o banco pelo padrão.
export function detectarBanco(conteudo: string): BancoDetectado {
  const amostra = conteudo.slice(0, 2000).toLowerCase();

  // Nubank: cabeçalho clássico com "category" em inglês
  if (
    amostra.includes('"date"') &&
    amostra.includes('"title"') &&
    amostra.includes('"amount"')
  ) {
    return "nubank";
  }

  // Banco Inter: costuma ter "Data de Vencimento" e "Tipo de Operação"
  if (
    amostra.includes("data de vencimento") ||
    amostra.includes("tipo de operação")
  ) {
    return "inter";
  }

  // Itaú: tem cabeçalho longo com "EXTRATO" e datas em DD/MM/YYYY
  if (amostra.includes("extrato") && amostra.includes("agência")) {
    return "itau";
  }

  // Bradesco: "C/C," ou "Data Mov." com valores entre vírgulas
  if (
    amostra.includes("data mov") ||
    amostra.includes("histórico") ||
    amostra.includes("c/c")
  ) {
    return "bradesco";
  }

  // Padrão não reconhecido: tenta genérico
  return "generico";
}

// --------------------------------------------------------------------------
// 2) PARSER PRINCIPAL — escolhe o parser certo e processa
// --------------------------------------------------------------------------
export function parseCSV(conteudo: string): ResultadoParse {
  const banco = detectarBanco(conteudo);
  const erros: string[] = [];
  let transacoes: TransacaoCSV[] = [];

  try {
    switch (banco) {
      case "nubank":
        transacoes = parseNubank(conteudo, erros);
        break;
      case "itau":
        transacoes = parseItau(conteudo, erros);
        break;
      case "bradesco":
        transacoes = parseBradesco(conteudo, erros);
        break;
      case "inter":
        transacoes = parseGenerico(conteudo, erros); // Inter é tratado como genérico
        break;
      default:
        transacoes = parseGenerico(conteudo, erros);
    }
  } catch (e) {
    erros.push(
      `Erro ao processar CSV: ${e instanceof Error ? e.message : "desconhecido"}`,
    );
  }

  return {
    banco,
    transacoes,
    totalLinhas: transacoes.length,
    linhasIgnoradas: erros.length,
    erros,
  };
}

// --------------------------------------------------------------------------
// 3) PARSERS ESPECÍFICOS POR BANCO
// --------------------------------------------------------------------------

// Nubank: date,title,description,amount,category (formato simples em aspas)
function parseNubank(conteudo: string, erros: string[]): TransacaoCSV[] {
  const linhas = quebrarLinhas(conteudo);
  const resultado: TransacaoCSV[] = [];

  // Pula o cabeçalho (linha 0)
  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;

    try {
      const colunas = parsearLinhaCSV(linha);
      if (colunas.length < 3) {
        erros.push(`Linha ${i + 1}: colunas insuficientes`);
        continue;
      }

      const dataRaw = colunas[0];
      const descricao = colunas[1];
      const valorRaw = colunas[2];
      const categoria = colunas[3] || "";

      const data = normalizarData(dataRaw);
      const valor = normalizarValor(valorRaw);

      if (!data || isNaN(valor)) {
        erros.push(`Linha ${i + 1}: data ou valor inválido`);
        continue;
      }

      resultado.push({
        data,
        descricao: descricao.trim(),
        valor,
        categoria: categoria.trim() || undefined,
        origem: "csv",
        banco: "nubank",
      });
    } catch {
      erros.push(`Linha ${i + 1}: formato inválido`);
    }
  }

  return resultado;
}

// Itaú: pula linhas de cabeçalho até achar "Data Lançamento"
function parseItau(conteudo: string, erros: string[]): TransacaoCSV[] {
  const linhas = quebrarLinhas(conteudo);
  const resultado: TransacaoCSV[] = [];

  // Acha a linha de cabeçalho
  let indiceCabecalho = -1;
  for (let i = 0; i < Math.min(linhas.length, 30); i++) {
    if (
      linhas[i].toLowerCase().includes("data") &&
      linhas[i].toLowerCase().includes("lançamento")
    ) {
      indiceCabecalho = i;
      break;
    }
  }

  if (indiceCabecalho === -1) {
    // Sem cabeçalho identificado, cai pra genérico
    return parseGenerico(conteudo, erros);
  }

  // Processa a partir do cabeçalho + 1
  for (let i = indiceCabecalho + 1; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;

    try {
      const colunas = parsearLinhaCSV(linha);
      if (colunas.length < 3) continue;

      // Heurística: data na coluna 0, descrição em colunas do meio,
      // valor na última coluna
      const data = normalizarData(colunas[0]);
      const valor = normalizarValor(colunas[colunas.length - 1]);

      // Descrição = tudo entre a data e o valor
      const descricao = colunas.slice(1, -1).join(" ").trim();

      if (!data || isNaN(valor)) {
        erros.push(`Linha ${i + 1}: formato inválido`);
        continue;
      }

      // No Itaú, a coluna valor costuma ter sinal: -1234,56 ou 1234,56
      resultado.push({
        data,
        descricao: descricao || "Lançamento importado",
        valor,
        origem: "csv",
        banco: "itau",
      });
    } catch {
      erros.push(`Linha ${i + 1}: erro ao processar`);
    }
  }

  return resultado;
}

// Bradesco: linhas com vários campos, valores nas últimas colunas
function parseBradesco(conteudo: string, erros: string[]): TransacaoCSV[] {
  const linhas = quebrarLinhas(conteudo);
  const resultado: TransacaoCSV[] = [];

  // Pula cabeçalho até achar a primeira data válida
  let comecarDe = 0;
  for (let i = 0; i < linhas.length; i++) {
    if (normalizarData(linhas[i].split(/[;,\t]/)[0])) {
      comecarDe = i;
      break;
    }
  }

  for (let i = comecarDe; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;

    try {
      const colunas = parsearLinhaCSV(linha);
      if (colunas.length < 3) continue;

      const data = normalizarData(colunas[0]);
      const descricao = colunas.slice(1, -2).join(" ").trim();
      const valorRaw = colunas[colunas.length - 1];
      const valor = normalizarValor(valorRaw);

      if (!data || isNaN(valor)) continue;

      resultado.push({
        data,
        descricao: descricao || "Lançamento",
        valor,
        origem: "csv",
        banco: "bradesco",
      });
    } catch {
      erros.push(`Linha ${i + 1}: erro`);
    }
  }

  return resultado;
}

// Genérico: tenta achar data, descrição e valor em qualquer ordem
function parseGenerico(conteudo: string, erros: string[]): TransacaoCSV[] {
  const linhas = quebrarLinhas(conteudo);
  const resultado: TransacaoCSV[] = [];

  // Detecta separador: vírgula, ponto-e-vírgula ou tab
  const separador = detectarSeparador(conteudo);

  // Primeira linha = cabeçalho (presumido)
  const inicio = linhas[0]?.includes("data") ? 1 : 0;

  for (let i = inicio; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;

    try {
      const colunas = parsearLinhaCSV(linha, separador);
      if (colunas.length < 3) continue;

      // Heurística simples: coluna 0 = data, coluna 1 = descrição,
      // coluna 2 = valor (formato mais comum)
      const data = normalizarData(colunas[0]);
      const valor = normalizarValor(colunas[2]);
      const descricao = colunas[1].trim();

      if (!data || isNaN(valor)) continue;

      resultado.push({
        data,
        descricao: descricao || "Lançamento importado",
        valor,
        origem: "csv",
        banco: "generico",
      });
    } catch {
      erros.push(`Linha ${i + 1}: erro`);
    }
  }

  return resultado;
}

// --------------------------------------------------------------------------
// HELPERS DE PARSEAMENTO
// --------------------------------------------------------------------------

// Quebra o conteúdo em linhas, lidando com \r\n, \n, \r
function quebrarLinhas(conteudo: string): string[] {
  return conteudo.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

// Detecta o separador (vírgula, ponto-e-vírgula ou tab)
function detectarSeparador(conteudo: string): string {
  const primeiraLinha = conteudo.split("\n")[0] || "";
  if (primeiraLinha.includes(";")) return ";";
  if (primeiraLinha.includes("\t")) return "\t";
  return ",";
}

// Parseia uma linha CSV respeitando aspas (para textos com vírgula dentro)
function parsearLinhaCSV(linha: string, separadorForcado?: string): string[] {
  const sep = separadorForcado || detectarSeparador(linha);
  const resultado: string[] = [];
  let atual = "";
  let dentroAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const char = linha[i];

    if (char === '"') {
      dentroAspas = !dentroAspas;
    } else if (char === sep && !dententroAspas(dentroAspas)) {
      resultado.push(atual.trim().replace(/^"|"$/g, ""));
      atual = "";
    } else {
      atual += char;
    }
  }
  resultado.push(atual.trim().replace(/^"|"$/g, ""));
  return resultado;
}

// Helper idiota só pra evitar warning do TS sobre `!dentroAspas`
function dententroAspas(dentro: boolean): boolean {
  return dentro;
}

// Normaliza data para ISO (YYYY-MM-DD) aceitando vários formatos
function normalizarData(raw: string): string | null {
  if (!raw) return null;
  const limpo = raw.trim().replace(/['"]/g, "");

  // Tenta DD/MM/YYYY (mais comum no Brasil)
  const br = limpo.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (br) {
    const [_, dia, mes, ano] = br;
    const anoFull = ano.length === 2 ? `20${ano}` : ano;
    return `${anoFull}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }

  // Tenta YYYY-MM-DD (formato ISO/Nubank)
  const iso = limpo.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return limpo;

  // Tenta DD-MM-YYYY
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
//   "-1234,56"  → -1234.56 (saída)
//   "R$ 1.234"  → 1234
function normalizarValor(raw: string): number {
  if (!raw) return NaN;
  let limpo = raw
    .trim()
    .replace(/R\$/g, "")
    .replace(/\s/g, "")
    .replace(/['"]/g, "");

  // Se tem ponto E vírgula: formato brasileiro (1.234,56)
  if (limpo.includes(".") && limpo.includes(",")) {
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  }
  // Se só tem vírgula: formato brasileiro sem milhar (1234,56)
  else if (limpo.includes(",") && !limpo.includes(".")) {
    limpo = limpo.replace(",", ".");
  }

  const valor = parseFloat(limpo);
  return isNaN(valor) ? NaN : valor;
}
