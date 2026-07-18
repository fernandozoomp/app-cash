// ============================================================================
// PARSERS DE EXTRATO BANCÁRIO (OFX + CSV + JSON)
// ============================================================================
// Converte qualquer formato para uma lista normalizada de lançamentos.
// Cada lançamento vira um "ExtratoLancamento" que pode ser importado.

export interface ExtratoLancamento {
  data: string; // YYYY-MM-DD
  descricao: string;
  valor: number; // positivo = entrada, negativo = saída
}

export type FormatoExtrato = "ofx" | "csv" | "json";

// --------------------------------------------------------------------------
// Detecta o formato pela extensão do arquivo ou pelo conteúdo
// --------------------------------------------------------------------------
export function detectarFormato(nomeArquivo: string, conteudo: string): FormatoExtrato {
  const nome = nomeArquivo.toLowerCase();
  if (nome.endsWith(".ofx")) return "ofx";
  if (nome.endsWith(".json")) return "json";
  if (nome.endsWith(".csv") || nome.endsWith(".txt")) return "csv";

  // Pelo conteúdo
  const amostra = conteudo.slice(0, 500).toUpperCase();
  if (amostra.includes("<OFX>")) return "ofx";
  if (amostra.trim().startsWith("[") || amostra.trim().startsWith("{")) return "json";
  return "csv";
}

// --------------------------------------------------------------------------
// PARSER OFX (formato SGML bancário)
// --------------------------------------------------------------------------
// Estrutura típica:
//   <STMTTRN>
//     <TRNTYPE>DEBIT
//     <DTPOSTED>20260717000000[-3:BRT]
//     <TRNAMT>-150.50
//     <MEMO>PAGAMENTO REALIZADO
//   </STMTTRN>
export function parseOFX(conteudo: string): {
  lancamentos: ExtratoLancamento[];
  erros: string[];
} {
  const erros: string[] = [];
  const lancamentos: ExtratoLancamento[] = [];

  // Extrai todos os blocos <STMTTRN>...</STMTTRN>
  const regexBloco = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  const blocos = conteudo.match(regexBloco) || [];

  blocos.forEach((bloco, idx) => {
    try {
      const valorMatch = bloco.match(/<TRNAMT>\s*(-?[\d.,]+)/i);
      const dataMatch = bloco.match(/<DTPOSTED>\s*(\d{8})/i);
      const memoMatch = bloco.match(/<MEMO>\s*([^\n<]+)/i);
      const tipoMatch = bloco.match(/<TRNTYPE>\s*(\w+)/i);

      if (!valorMatch || !dataMatch) {
        erros.push(`Lançamento ${idx + 1}: dados incompletos`);
        return;
      }

      const valor = parseFloat(valorMatch[1].replace(",", "."));
      const data = `${dataMatch[1].slice(0, 4)}-${dataMatch[1].slice(4, 6)}-${dataMatch[1].slice(6, 8)}`;
      const descricao = memoMatch?.[1]?.trim() || tipoMatch?.[1] || "Lançamento";

      lancamentos.push({ data, descricao, valor });
    } catch {
      erros.push(`Lançamento ${idx + 1}: erro ao processar`);
    }
  });

  return { lancamentos, erros };
}

// --------------------------------------------------------------------------
// PARSER CSV (formato livre: data, descricao, valor)
// --------------------------------------------------------------------------
// Aceita vários formatos. O valor pode ter sinal (-150 = saída, 150 = entrada).
export function parseCSVExtrato(conteudo: string): {
  lancamentos: ExtratoLancamento[];
  erros: string[];
} {
  const erros: string[] = [];
  const lancamentos: ExtratoLancamento[] = [];

  const linhas = conteudo
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((l) => l.trim());

  if (linhas.length < 2) {
    return { lancamentos, erros: ["Arquivo CSV vazio ou só com cabeçalho"] };
  }

  // Detecta separador
  const separador = linhas[0].includes(";") ? ";" : ",";

  // Tenta identificar as colunas pelo cabeçalho
  const cabecalho = linhas[0].toLowerCase();
  const temCabecalho =
    cabecalho.includes("data") || cabecalho.includes("valor");

  const inicio = temCabecalho ? 1 : 0;

  for (let i = inicio; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;

    try {
      const colunas = parsearLinhaCSV(linha, separador);
      if (colunas.length < 3) {
        erros.push(`Linha ${i + 1}: colunas insuficientes`);
        continue;
      }

      // Heurística: data na coluna 0, descrição nas do meio, valor na última
      const data = normalizarData(colunas[0]);
      const descricao = colunas.slice(1, -1).join(" ").trim() || "Lançamento";
      const valor = normalizarValor(colunas[colunas.length - 1]);

      if (!data) {
        erros.push(`Linha ${i + 1}: data inválida`);
        continue;
      }
      if (isNaN(valor)) {
        erros.push(`Linha ${i + 1}: valor inválido`);
        continue;
      }

      lancamentos.push({ data, descricao, valor });
    } catch {
      erros.push(`Linha ${i + 1}: erro ao processar`);
    }
  }

  return { lancamentos, erros };
}

// --------------------------------------------------------------------------
// PARSER JSON (array de objetos com data, descricao, valor)
// --------------------------------------------------------------------------
// Formato esperado:
//   [{"data": "2026-07-17", "descricao": "...", "valor": -150.50}, ...]
export function parseJSON(conteudo: string): {
  lancamentos: ExtratoLancamento[];
  erros: string[];
} {
  const erros: string[] = [];

  try {
    const obj = JSON.parse(conteudo);
    const arr = Array.isArray(obj) ? obj : obj.lancamentos || obj.transacoes;

    if (!Array.isArray(arr)) {
      return { lancamentos: [], erros: ["JSON deve ser um array ou ter propriedade 'lancamentos'"] };
    }

    const lancamentos: ExtratoLancamento[] = [];
    arr.forEach((item, idx) => {
      if (!item.data || item.valor === undefined) {
        erros.push(`Item ${idx + 1}: faltam campos data/valor`);
        return;
      }
      const data = normalizarData(item.data);
      const valor = Number(item.valor);
      if (!data || isNaN(valor)) {
        erros.push(`Item ${idx + 1}: dados inválidos`);
        return;
      }
      lancamentos.push({
        data,
        descricao: String(item.descricao || item.memo || "Lançamento"),
        valor,
      });
    });

    return { lancamentos, erros };
  } catch (e) {
    return { lancamentos: [], erros: ["JSON inválido"] };
  }
}

// --------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------
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
  return null;
}

function normalizarValor(raw: string): number {
  if (!raw) return NaN;
  let limpo = raw.trim().replace(/R\$/g, "").replace(/\s/g, "").replace(/['"]/g, "");
  if (limpo.includes(".") && limpo.includes(",")) {
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  } else if (limpo.includes(",") && !limpo.includes(".")) {
    limpo = limpo.replace(",", ".");
  }
  return parseFloat(limpo);
}

// --------------------------------------------------------------------------
// CALCULA HASH ÚNICO (anti-duplicação)
// --------------------------------------------------------------------------
// sha256(conta_id + data + valor + descricao) — se já existe, ignoramos.
// Em Node 20+, crypto.subtle está disponível. Em browsers, também.
export async function calcularHash(
  contaId: string,
  lancamento: ExtratoLancamento,
): Promise<string> {
  const entrada = `${contaId}|${lancamento.data}|${lancamento.valor}|${lancamento.descricao}`;
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(entrada));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
