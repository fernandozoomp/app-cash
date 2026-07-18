"use client";

// ============================================================================
// LISTA DE EMPRÉSTIMOS — com detalhes e botão "receber parcela"
// ============================================================================

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
import { Badge } from "@/components/ui/badge";
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
  const [expandido, setExpandido] = useState<string | null>(null);

  if (emprestimos.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhum empréstimo registrado ainda.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {emprestimos.map((emp) => {
        const aberto = expandido === emp.id;
        const parcelas = emp.parcelas || [];
        const pagas = parcelas.filter((p) => p.status === "paga").length;
        const pendentes = parcelas.length - pagas;

        return (
          <li
            key={emp.id}
            className="rounded-lg border overflow-hidden"
          >
            {/* Cabeçalho clicável */}
            <button
              onClick={() => setExpandido(aberto ? null : emp.id)}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {emp.clientes?.nome || "—"}
                  </span>
                  {emp.status === "ativo" && (
                    <Badge variant="secondary">Ativo</Badge>
                  )}
                  {emp.status === "quitado" && (
                    <Badge className="bg-emerald-600">Quitado</Badge>
                  )}
                  {emp.status === "atrasado" && (
                    <Badge variant="destructive">Atrasado</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {parcelas.length}x de {formatarMoeda(emp.valor_parcela || 0)} •
                  Total {formatarMoeda(emp.valor_total || 0)} • {pagas}/{parcelas.length}{" "}
                  pagas
                </p>
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
                <ParcelaList emprestimoId={emp.id} parcelas={parcelas} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// --------------------------------------------------------------------------
// LISTA DE PARCELAS — com botão receber
// --------------------------------------------------------------------------
function ParcelaList({
  emprestimoId,
  parcelas,
}: {
  emprestimoId: string;
  parcelas: Parcela[];
}) {
  const [pendente, startTransition] = useTransition();
  const router = useRouter();

  function handleReceber(parcelaId: string) {
    startTransition(async () => {
      const r = await receberParcela(parcelaId);
      if (r.error) {
        toast.error(r.error);
      } else {
        toast.success("Parcela recebida! Entrada registrada no caixa. 🎉");
        router.refresh();
      }
    });
  }

  if (parcelas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sem parcelas geradas.
      </p>
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

            <div className="flex items-center gap-3">
              <span className="font-semibold">{formatarMoeda(p.valor)}</span>
              {status === "paga" ? (
                <Badge className="bg-emerald-600">Paga</Badge>
              ) : status === "atrasada" ? (
                <Badge variant="destructive">Atrasada</Badge>
              ) : (
                <>
                  <Badge variant="secondary">Pendente</Badge>
                  <Button
                    size="sm"
                    onClick={() => handleReceber(p.id)}
                    disabled={pendente}
                  >
                    {pendente ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      "Receber"
                    )}
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
