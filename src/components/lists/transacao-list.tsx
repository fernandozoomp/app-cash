"use client";

// ============================================================================
// LISTA DE TRANSAÇÕES (com botão excluir)
// ============================================================================

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

import { apagarTransacao } from "@/app/actions/caixa";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatarMoeda, formatarData } from "@/lib/constants";
import type { Transacao } from "@/lib/types/database";

export function TransacaoList({
  transacoes,
}: {
  transacoes: Transacao[];
}) {
  const [pendente, startTransition] = useTransition();

  function handleApagar(id: string) {
    if (!confirm("Tem certeza que deseja apagar esta transação?")) return;
    startTransition(async () => {
      const r = await apagarTransacao(id);
      if (r.error) toast.error(r.error);
      else toast.success("Transação apagada.");
    });
  }

  if (transacoes.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma transação registrada ainda.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {transacoes.map((t) => (
        <li key={t.id} className="flex items-center justify-between py-3 gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`font-semibold ${
                  t.tipo === "entrada" ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {t.tipo === "entrada" ? "+" : "−"}
                {formatarMoeda(t.valor)}
              </span>
              <Badge variant="outline" className="text-xs">
                {t.empreendimento}
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {formatarData(t.data)} • {t.categoria.replace(/_/g, " ")}
              {t.descricao ? ` • ${t.descricao}` : ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleApagar(t.id)}
            disabled={pendente}
            className="text-muted-foreground hover:text-rose-600"
          >
            {pendente ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </li>
      ))}
    </ul>
  );
}
