"use client";

// ============================================================================
// PARCELAS — versão rica para a página de detalhe do empréstimo
// ============================================================================
// Mostra TODAS as parcelas com: número, vencimento, valor, valor pago,
// status, última cobrança, e botões de WhatsApp/Pagamento/Histórico.

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  MessageCircle,
  Calendar,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { BotaoWhatsApp } from "@/components/cobranca/botao-whatsapp";
import { DialogPagamento } from "@/components/cobranca/dialog-pagamento";
import { DialogHistorico } from "@/components/cobranca/dialog-historico";
import { formatarMoeda, formatarData } from "@/lib/constants";
import { statusParcelaVencida } from "@/lib/finance/calculadora";
import type { Parcela } from "@/lib/types/database";

interface Props {
  parcelas: Parcela[];
  totalParcelas: number;
  nomeCliente: string;
  telefoneCliente: string | null;
}

export function EmprestimoParcelas({
  parcelas,
  totalParcelas,
  nomeCliente,
  telefoneCliente,
}: Props) {
  const [pagamento, setPagamento] = useState<Parcela | null>(null);
  const [historico, setHistorico] = useState<Parcela | null>(null);

  if (parcelas.length === 0) {
    return (
      <EmptyState
        titulo="Sem parcelas"
        descricao="As parcelas são geradas ao criar o empréstimo."
        icone="calendar"
        compacto
      />
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {parcelas.map((p) => {
          const status = statusParcelaVencida(p);
          const parcial = p.status === "parcial";
          return (
            <li
              key={p.id}
              className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    status === "paga"
                      ? "bg-emerald-100 text-emerald-700"
                      : status === "atrasada"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {p.numero}
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-medium">
                    {formatarMoeda(p.valor)}
                    {parcial && Number(p.valor_pago) > 0 && (
                      <span className="text-xs text-emerald-600">
                        (pago {formatarMoeda(Number(p.valor_pago))})
                      </span>
                    )}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    Vence {formatarData(p.vencimento)}
                    {p.data_pagamento &&
                      ` • paga em ${formatarData(p.data_pagamento)}`}
                    {p.ultima_cobranca &&
                      ` • cobrada ${formatarData(p.ultima_cobranca)}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {status === "paga" ? (
                  <Badge className="bg-emerald-600">
                    <CheckCircle2 className="mr-1 size-3" />
                    Paga
                  </Badge>
                ) : (
                  <>
                    {status === "atrasada" ? (
                      <span className="badge-danger">
                        <AlertTriangle className="size-3" />
                        Atrasada
                      </span>
                    ) : parcial ? (
                      <span className="badge-warning">
                        <Clock className="size-3" />
                        Parcial
                      </span>
                    ) : (
                      <span className="badge-warning">
                        <Clock className="size-3" />
                        Pendente
                      </span>
                    )}

                    <BotaoWhatsApp
                      parcelaId={p.id}
                      nomeCliente={nomeCliente}
                      telefone={telefoneCliente}
                      numeroParcela={p.numero}
                      totalParcelas={totalParcelas}
                      valor={p.valor}
                      valorPago={Number(p.valor_pago) || 0}
                      vencimento={p.vencimento}
                      status={
                        parcial
                          ? "parcial"
                          : status === "atrasada"
                            ? "atrasada"
                            : "pendente"
                      }
                      ultimaCobranca={p.ultima_cobranca}
                      size="sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPagamento(p)}
                      aria-label="Registrar pagamento"
                    >
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setHistorico(p)}
                      aria-label="Histórico"
                    >
                      <History className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Modais */}
      {pagamento && (
        <DialogPagamento
          aberto={true}
          onFechar={() => setPagamento(null)}
          parcelaId={pagamento.id}
          numero={pagamento.numero}
          valorTotal={pagamento.valor}
          valorJaPago={Number(pagamento.valor_pago) || 0}
          nomeCliente={nomeCliente}
        />
      )}
      {historico && (
        <DialogHistorico
          aberto={true}
          onFechar={() => setHistorico(null)}
          parcelaId={historico.id}
          numero={historico.numero}
          nomeCliente={nomeCliente}
        />
      )}
    </>
  );
}
