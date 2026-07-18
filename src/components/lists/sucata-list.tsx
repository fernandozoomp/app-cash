"use client";

// ============================================================================
// LISTA DE SUCATAS
// ============================================================================

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

import { apagarSucata } from "@/app/actions/sucatas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatarMoeda, formatarData } from "@/lib/constants";
import type { MovimentacaoSucata } from "@/lib/types/database";

export function SucataList({ itens }: { itens: MovimentacaoSucata[] }) {
  const [pendente, startTransition] = useTransition();

  function handleApagar(id: string) {
    if (!confirm("Apagar esta movimentação?")) return;
    startTransition(async () => {
      const r = await apagarSucata(id);
      if (r.error) toast.error(r.error);
      else toast.success("Movimentação apagada.");
    });
  }

  if (itens.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma movimentação registrada ainda.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {itens.map((s) => (
        <li key={s.id} className="flex items-center justify-between py-3 gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge
                variant={s.tipo === "venda" ? "default" : "destructive"}
                className={
                  s.tipo === "venda" ? "bg-emerald-600" : ""
                }
              >
                {s.tipo === "venda" ? "Venda" : "Compra"}
              </Badge>
              <span className="font-medium">{s.material}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatarData(s.data)} • {s.peso_kg}kg ×{" "}
              {formatarMoeda(s.preco_por_kg)}/kg
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold ${
                s.tipo === "venda" ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {s.tipo === "venda" ? "+" : "−"}
              {formatarMoeda(s.valor_total)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleApagar(s.id)}
              disabled={pendente}
              className="text-muted-foreground hover:text-rose-600"
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
