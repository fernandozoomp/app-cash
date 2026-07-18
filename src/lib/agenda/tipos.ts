// ============================================================================
// CONFIGURAÇÃO DE TIPOS DE EVENTO (cores, ícones, labels)
// ============================================================================

import type { TipoEvento } from "@/lib/types/database";

export interface InfoTipoEvento {
  corBolinha: string; // classe tailwind para a bolinha no calendário
  corBadge: string; // classe para badges
  icone: string; // emoji
  label: string;
}

export const INFO_TIPOS_EVENTO: Record<TipoEvento, InfoTipoEvento> = {
  vencimento: {
    corBolinha: "bg-rose-500",
    corBadge: "badge-danger",
    icone: "🔴",
    label: "Vencimento",
  },
  followup: {
    corBolinha: "bg-amber-500",
    corBadge: "badge-warning",
    icone: "🟡",
    label: "Follow-up",
  },
  reuniao: {
    corBolinha: "bg-blue-500",
    corBadge: "badge-info",
    icone: "🔵",
    label: "Reunião",
  },
  pagamento: {
    corBolinha: "bg-emerald-500",
    corBadge: "badge-success",
    icone: "🟢",
    label: "Pagamento",
  },
  outros: {
    corBolinha: "bg-slate-400",
    corBadge: "badge-info",
    icone: "⚪",
    label: "Outros",
  },
};

// Legendas por ORIGEM (de onde o evento veio) — para mostrar na UI
export const LEGENDA_ORIGEM: Record<string, { emoji: string; label: string }> = {
  manual: { emoji: "📌", label: "Evento manual" },
  vencimento: { emoji: "🔴", label: "Vencimento de parcela" },
  inicio_emprestimo: { emoji: "💰", label: "Início de empréstimo" },
  cobranca: { emoji: "📲", label: "Cobrança enviada" },
  pagamento: { emoji: "✅", label: "Pagamento recebido" },
};

export function infoTipoEvento(tipo: TipoEvento): InfoTipoEvento {
  return INFO_TIPOS_EVENTO[tipo] || INFO_TIPOS_EVENTO.outros;
}

export const TIPOS_EVENTO_LISTA: Array<{
  valor: TipoEvento;
  label: string;
}> = [
  { valor: "followup", label: "🟡 Follow-up" },
  { valor: "reuniao", label: "🔵 Reunião / Compromisso" },
  { valor: "pagamento", label: "🟢 Pagamento a receber" },
  { valor: "vencimento", label: "🔴 Vencimento" },
  { valor: "outros", label: "⚪ Outros" },
];
