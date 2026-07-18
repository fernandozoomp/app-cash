"use client";

// ============================================================================
// LISTA DE SUCATAS — com confirmação elegante
// ============================================================================

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

import { apagarSucata } from "@/app/actions/sucatas";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { useConfirm } from "@/components/confirm-dialog";
import { formatarMoeda, formatarData } from "@/lib/constants";
import type { MovimentacaoSucata } from "@/lib/types/database";

export function SucataList({ itens }: { itens: MovimentacaoSucata[] }) {
  const [pendente, startTransition] = useTransition();
  const router = useRouter();
  const confirmar = useConfirm();

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
    <ul className="divide-y">
      {itens.map((s) => (
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
  );
}
