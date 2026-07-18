"use client";

// ============================================================================
// FILTROS BAR — barra de busca + chips de filtro (reutilizável)
// ============================================================================
// Padrão visual já usado na tela de Cobranças. Aplicado em todas as listas
// para UX consistente: busca por texto + filtros rápidos (chips).

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface ChipFiltro<T extends string> {
  valor: T;
  label: string;
  count?: number;
}

interface Props<T extends string> {
  busca: string;
  onBusca: (valor: string) => void;
  placeholderBusca?: string;
  chips?: ChipFiltro<T>[];
  filtroAtivo?: T;
  onFiltro?: (valor: T) => void;
  // Conta total de itens (para mostrar "X resultados")
  totalResultados: number;
}

export function FiltrosBar<T extends string>({
  busca,
  onBusca,
  placeholderBusca = "Buscar...",
  chips,
  filtroAtivo,
  onFiltro,
  totalResultados,
}: Props<T>) {
  const temFiltros = busca || (filtroAtivo && filtroAtivo !== "todos");
  return (
    <div className="mb-4 space-y-3">
      {/* Linha 1: busca + contador */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={placeholderBusca}
            value={busca}
            onChange={(e) => onBusca(e.target.value)}
            className="pl-9"
          />
          {busca && (
            <button
              onClick={() => onBusca("")}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {totalResultados}{" "}
          {totalResultados === 1 ? "resultado" : "resultados"}
          {temFiltros && " · "}
          {temFiltros && (
            <button
              onClick={() => {
                onBusca("");
                onFiltro?.("todos" as T);
              }}
              className="text-primary hover:underline"
            >
              limpar filtros
            </button>
          )}
        </p>
      </div>

      {/* Linha 2: chips de filtro */}
      {chips && chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.valor}
              onClick={() => onFiltro?.(chip.valor)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filtroAtivo === chip.valor
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {chip.label}
              {chip.count !== undefined && (
                <span className="ml-1 opacity-70">({chip.count})</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
