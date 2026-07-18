"use client";

// ============================================================================
// LISTA DE SUCATAS — com confirmação elegante + FILTROS
// ============================================================================

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

import { apagarSucata } from "@/app/actions/sucatas";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { useConfirm } from "@/components/confirm-dialog";
import { FiltrosBar } from "@/components/listas/filtros-bar";
import { formatarMoeda, formatarData } from "@/lib/constants";
import type { MovimentacaoSucata } from "@/lib/types/database";

type FiltroTipo = "todos" | "compra" | "venda";

export function SucataList({ itens }: { itens: MovimentacaoSucata[] }) {
  const [pendente, startTransition] = useTransition();
  const router = useRouter();
  const confirmar = useConfirm();

  // Filtros
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<FiltroTipo>("todos");

  const filtrados = useMemo(() => {
    let resultado = [...itens];

    if (busca.trim()) {
      const termo = busca.toLowerCase().trim();
      resultado = resultado.filter(
        (s) =>
          s.material.toLowerCase().includes(termo) ||
          (s.observacoes || "").toLowerCase().includes(termo),
      );
    }

    if (tipo !== "todos") {
      resultado = resultado.filter((s) => s.tipo === tipo);
    }

    return resultado;
  }, [itens, busca, tipo]);

  const counts = useMemo(
    () => ({
      compra: itens.filter((s) => s.tipo === "compra").length,
      venda: itens.filter((s) => s.tipo === "venda").length,
    }),
    [itens],
  );

  async function handleApagar(item: MovimentacaoSucata) {
    const ok = await confirmar({
      titulo: "Apagar esta movimentação?",
      descricao: `${item.material} — ${formatarMoeda(item.valor_total)}. Esta ação não pode ser desfeita.`,
      textoConfirmar: "Apagar",
      perigoso: true,
    });
    if (!ok) return;

    startTransition(async () => {
      const r = await apagarSucata(item.id);
      if (r.error) toast.error(r.error);
      else {
        toast.success("Movimentação apagada.");
        router.refresh();
      }
    });
  }

  if (itens.length === 0) {
    return (
      <EmptyState
        titulo="Sem movimentações ainda"
        descricao="Registre sua primeira compra ou venda para acompanhar o lucro."
        icone="recycle"
        compacto
      />
    );
  }

  return (
    <>
      <FiltrosBar
        busca={busca}
        onBusca={setBusca}
        placeholderBusca="Buscar por material..."
        totalResultados={filtrados.length}
        chips={[
          { valor: "todos", label: "Todos", count: itens.length },
          { valor: "compra", label: "Compras", count: counts.compra },
          { valor: "venda", label: "Vendas", count: counts.venda },
        ]}
        filtroAtivo={tipo}
        onFiltro={(v) => setTipo(v as FiltroTipo)}
      />

      {filtrados.length === 0 ? (
        <EmptyState
          titulo="Nenhuma movimentação encontrada"
          descricao="Tente outro filtro ou termo de busca."
          icone="recycle"
          compacto
        />
      ) : (
        <ul className="divide-y">
          {filtrados.map((s) => (
            <li
              key={s.id}
              className="group flex items-center justify-between gap-3 py-3"
            >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`badge-${s.tipo === "venda" ? "success" : "danger"}`}
              >
                {s.tipo === "venda" ? "Venda" : "Compra"}
              </span>
              <span className="font-medium">{s.material}</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatarData(s.data)} • {s.peso_kg}kg ×{" "}
              {formatarMoeda(s.preco_por_kg)}/kg
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`num-moeda font-semibold ${
                s.tipo === "venda" ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {s.tipo === "venda" ? "+" : "−"}
              {formatarMoeda(s.valor_total)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleApagar(s)}
              disabled={pendente}
              className="text-muted-foreground opacity-0 transition-opacity hover:text-rose-600 group-hover:opacity-100"
              aria-label="Apagar movimentação"
            >
              {pendente ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </Button>
          </div>
        </li>
          ))}
        </ul>
      )}
    </>
  );
}
