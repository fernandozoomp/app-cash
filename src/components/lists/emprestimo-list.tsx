"use client";

// ============================================================================
// LISTA DE EMPRÉSTIMOS — com detalhes expansíveis e receber parcela
// ============================================================================
// Melhorias (Etapa 6):
// - Empty state amigável
// - Confirmação elegante ao receber parcela
// - Progresso visual (barra de parcelas pagas)
// - Badges semânticos (verde pago, amarelo pendente, vermelho atrasado)
// - Resumo no topo de cada empréstimo

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";

import { receberParcela } from "@/app/actions/emprestimos";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { useConfirm } from "@/components/confirm-dialog";
import { formatarMoeda, formatarData } from "@/lib/constants";
import { statusParcelaVencida } from "@/lib/finance/calculadora";
import type {
  EmprestimoComCliente,
  Parcela,
} from "@/lib/types/database";

interface EmprestimoComParcelas extends EmprestimoComCliente {
  parcelas?: Parcela[];
}

export function EmprestimoList({
  emprestimos,
}: {
  emprestimos: EmprestimoComParcelas[];
}) {
  const [expandido, setExpandido] = useState<string | null>(
    emprestimos[0]?.id || null,
  );

  if (emprestimos.length === 0) {
    return (
      <EmptyState
        titulo="Nenhum empréstimo por aqui"
        descricao="Crie o primeiro empréstimo e o sistema calcula as parcelas automaticamente."
        icone="hand-coins"
        compacto
      />
    );
  }

  return (
    <ul className="space-y-3">
      {emprestimos.map((emp) => {
        const aberto = expandido === emp.id;
        const parcelas = emp.parcelas || [];
        const pagas = parcelas.filter((p) => p.status === "paga").length;
        const progresso =
          parcelas.length > 0 ? (pagas / parcelas.length) * 100 : 0;

        return (
          <li
            key={emp.id}
            className="overflow-hidden rounded-lg border transition-shadow hover:shadow-sm"
          >
            {/* Cabeçalho */}
            <button
              onClick={() => setExpandido(aberto ? null : emp.id)}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/30"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {emp.clientes?.nome || "—"}
                  </span>
                  <StatusBadge status={emp.status} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {parcelas.length}x de{" "}
                  {formatarMoeda(emp.valor_parcela || 0)} • Total{" "}
                  {formatarMoeda(emp.valor_total || 0)}
                </p>

                {/* Barra de progresso */}
                {parcelas.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${progresso}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {pagas}/{parcelas.length}
                    </span>
                  </div>
                )}
              </div>
              {aberto ? (
                <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              )}
            </button>

            {/* Detalhes (parcelas) */}
            {aberto && (
              <div className="border-t bg-muted/20 p-4">
                <ParcelaList parcelas={parcelas} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// --------------------------------------------------------------------------
// BADGE DE STATUS DO EMPRÉSTIMO
// --------------------------------------------------------------------------
function StatusBadge({ status }: { status: string }) {
  if (status === "quitado")
    return <span className="badge-success">Quitado</span>;
  if (status === "atrasado")
    return (
      <span className="badge-danger">
        <AlertTriangle className="size-3" />
        Atrasado
      </span>
    );
  return <span className="badge-info">Ativo</span>;
}

// --------------------------------------------------------------------------
// LISTA DE PARCELAS — com confirmação ao receber
// --------------------------------------------------------------------------
function ParcelaList({ parcelas }: { parcelas: Parcela[] }) {
  const [pendente, startTransition] = useTransition();
  const router = useRouter();
  const confirmar = useConfirm();

  async function handleReceber(parcela: Parcela) {
    const ok = await confirmar({
      titulo: "Confirmar recebimento?",
      descricao: `Parcela ${parcela.numero} — ${formatarMoeda(
        parcela.valor,
      )}. Uma entrada de mesmo valor será criada no caixa.`,
      textoConfirmar: "Confirmar recebimento",
    });

    if (!ok) return;

    startTransition(async () => {
      const r = await receberParcela(parcela.id);
      if (r.error) {
        toast.error(r.error);
      } else {
        toast.success("Recebimento registrado! 🎉", {
          description: "Entrada adicionada ao caixa.",
        });
        router.refresh();
      }
    });
  }

  if (parcelas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Sem parcelas geradas.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {parcelas.map((p) => {
        const status = statusParcelaVencida(p);
        return (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-md bg-background p-3"
          >
            <div className="flex items-center gap-3">
              {status === "paga" ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : status === "atrasada" ? (
                <AlertTriangle className="size-5 text-rose-600" />
              ) : (
                <Clock className="size-5 text-amber-600" />
              )}
              <div>
                <p className="text-sm font-medium">Parcela {p.numero}</p>
                <p className="text-xs text-muted-foreground">
                  Vence {formatarData(p.vencimento)}
                  {p.data_pagamento &&
                    ` • Paga em ${formatarData(p.data_pagamento)}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="num-moeda font-semibold">
                {formatarMoeda(p.valor)}
              </span>
              {status === "paga" ? (
                <span className="badge-success">Paga</span>
              ) : status === "atrasada" ? (
                <>
                  <span className="badge-danger">Atrasada</span>
                  <Button
                    size="sm"
                    onClick={() => handleReceber(p)}
                    disabled={pendente}
                  >
                    {pendente ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      "Receber"
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <span className="badge-warning">Pendente</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReceber(p)}
                    disabled={pendente}
                  >
                    Receber
                  </Button>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
