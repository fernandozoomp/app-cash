// ============================================================================
// LIB DE TEMPLATES DE MENSAGEM
// ============================================================================
// Define as variáveis disponíveis, categorias e a função de substituição.
// Os templates padrão são inseridos pelo SQL; aqui ficam apenas metadados.

import type { CategoriaTemplate } from "@/lib/types/database";
import { formatarMoeda, formatarData } from "@/lib/constants";

// --------------------------------------------------------------------------
// VARIÁVEIS DISPONÍVEIS NOS TEMPLATES
// --------------------------------------------------------------------------
// Documentação usada na UI para mostrar ao usuário o que pode usar.
export interface VariavelInfo {
  codigo: string; // ex: {{nome}}
  descricao: string;
  exemplo: string;
}

export const VARIAVEIS_DISPONIVEIS: VariavelInfo[] = [
  { codigo: "{{nome}}", descricao: "Nome do cliente", exemplo: "João Silva" },
  {
    codigo: "{{parcela}}",
    descricao: "Número da parcela atual",
    exemplo: "3",
  },
  {
    codigo: "{{total_parcelas}}",
    descricao: "Total de parcelas do empréstimo",
    exemplo: "10",
  },
  {
    codigo: "{{valor}}",
    descricao: "Valor da parcela",
    exemplo: formatarMoeda(129.5),
  },
  {
    codigo: "{{valor_pago}}",
    descricao: "Quanto já foi pago (parcial)",
    exemplo: formatarMoeda(60),
  },
  {
    codigo: "{{saldo_devedor}}",
    descricao: "Quanto falta pagar",
    exemplo: formatarMoeda(69.5),
  },
  {
    codigo: "{{vencimento}}",
    descricao: "Data de vencimento",
    exemplo: formatarData("2026-07-22"),
  },
];

// --------------------------------------------------------------------------
// DADOS QUE O SISTEMA PASSA PARA SUBSTITUIR NAS VARIÁVEIS
// --------------------------------------------------------------------------
export interface DadosVariaveis {
  nome: string;
  parcela: number;
  total_parcelas: number;
  valor: number;
  valor_pago?: number;
  vencimento: string; // ISO date
}

// --------------------------------------------------------------------------
// SUBSTITUI AS VARIÁVEIS NO CONTEÚDO
// --------------------------------------------------------------------------
// "{{nome}}, sua parcela {{parcela}} vence {{vencimento}}"
//   → "João, sua parcela 3 vence 22/07/2026"
export function substituirVariaveis(
  conteudo: string,
  dados: DadosVariaveis,
): string {
  const saldoDevedor = Math.max(0, dados.valor - (dados.valor_pago || 0));

  const mapa: Record<string, string> = {
    "{{nome}}": dados.nome,
    "{{parcela}}": String(dados.parcela),
    "{{total_parcelas}}": String(dados.total_parcelas),
    "{{valor}}": formatarMoeda(dados.valor),
    "{{valor_pago}}":
      dados.valor_pago && dados.valor_pago > 0
        ? formatarMoeda(dados.valor_pago)
        : "—",
    "{{saldo_devedor}}":
      saldoDevedor > 0 ? formatarMoeda(saldoDevedor) : "—",
    "{{vencimento}}": formatarData(dados.vencimento),
  };

  let resultado = conteudo;
  for (const [codigo, valor] of Object.entries(mapa)) {
    // Substitui todas as ocorrências (g = global, i = case-insensitive)
    const regex = new RegExp(escapeRegExp(codigo), "gi");
    resultado = resultado.replace(regex, valor);
  }
  return resultado;
}

// Helper: escapa caracteres especiais para uso seguro em RegExp
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// --------------------------------------------------------------------------
// CATEGORIAS DE TEMPLATE
// --------------------------------------------------------------------------
// Usadas para organizar e colorir os templates na UI.
export interface CategoriaInfo {
  valor: CategoriaTemplate;
  label: string;
  icone: string;
  cor: string; // classes tailwind
}

export const CATEGORIAS_TEMPLATES: CategoriaInfo[] = [
  {
    valor: "cobranca",
    label: "Cobrança",
    icone: "🔔",
    cor: "bg-rose-100 text-rose-700",
  },
  {
    valor: "lembrete",
    label: "Lembrete",
    icone: "⏰",
    cor: "bg-amber-100 text-amber-700",
  },
  {
    valor: "aviso",
    label: "Aviso de atraso",
    icone: "⚠️",
    cor: "bg-red-100 text-red-700",
  },
  {
    valor: "agradecimento",
    label: "Agradecimento",
    icone: "🙏",
    cor: "bg-emerald-100 text-emerald-700",
  },
  {
    valor: "conclusao",
    label: "Conclusão",
    icone: "✅",
    cor: "bg-blue-100 text-blue-700",
  },
  {
    valor: "outros",
    label: "Outros",
    icone: "💬",
    cor: "bg-slate-100 text-slate-700",
  },
];

export function infoCategoria(
  cat: CategoriaTemplate,
): CategoriaInfo {
  return (
    CATEGORIAS_TEMPLATES.find((c) => c.valor === cat) ||
    CATEGORIAS_TEMPLATES[CATEGORIAS_TEMPLATES.length - 1]
  );
}

// --------------------------------------------------------------------------
// DADOS DE EXEMPLO — para preview ao criar/editar template
// --------------------------------------------------------------------------
export const DADOS_EXEMPLO: DadosVariaveis = {
  nome: "João Silva",
  parcela: 3,
  total_parcelas: 10,
  valor: 129.5,
  valor_pago: 0,
  vencimento: "2026-07-22",
};
