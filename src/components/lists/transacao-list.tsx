"use client";

// ============================================================================
// LISTA DE TRANSAÇÕES (com confirmação elegante)
// ============================================================================
// Melhorias (Etapa 5):
// - Empty state amigável
// - Confirmação elegante (ConfirmDialog) em vez de confirm()
// - Categoria traduzida (sem snake_case)
// - Cores semânticas (entrada verde, saída vermelho)
// - Numérico alinhado à direita

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

import { apagarTransacao } from "@/app/actions/caixa";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import {
  formatarMoeda,
  formatarData,
  traduzirCategoria,
} from "@/lib/constants";
import type { Transacao } from "@/lib/types/database";

export function TransacaoList({ transacoes }: { transacoes: Transacao[] }) {
  const [pendente, startTransition] = useTransition();
  const router = useRouter();
  const confirmar = useConfirm();

  async function handleApagar(t: Transacao) {
    const ok = await confirmar({
      titulo: "Apagar esta movimentação?",
      descricao: `"${traduzirCategoria(t.categoria)}" — ${formatarMoeda(t.valor)}. Esta ação não pode ser desfeita.`,
      textoConfirmar: "Apagar",
      perigoso: true,
    });

    if (!ok) return;

    startTransition(async () => {
      const r = await apagarTransacao(t.id);
      if (r.error) {
        toast.error(r.error);
      } else {
        toast.success("Movimentação apagada.");
        router.refresh();
      }
    });
  }

  if (transacoes.length === 0) {
    return (
      <EmptyState
        titulo="Ainda não há movimentações por aqui"
        descricao="Registre sua primeira venda ou despesa e ela aparece aqui."
        icone="wallet"
        compacto
      />
    );
  }

  return (
    <ul className="divide-y">
      {transacoes.map((t) => {
        const entrada = t.tipo === "entrada";
        return (
          <li
            key={t.id}
            className="group flex items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`font-semibold num-moeda ${
                    entrada ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {entrada ? "+" : "−"}
                  {formatarMoeda(t.valor)}
                </span>
                <span className="badge-info capitalize">
                  {t.empreendimento}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {formatarData(t.data)} • {traduzirCategoria(t.categoria)}
                {t.descricao ? ` • ${t.descricao}` : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleApagar(t)}
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
          </li>
        );
      })}
    </ul>
  );
}
