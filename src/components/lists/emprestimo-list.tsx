"use client";

// ============================================================================
// LISTA DE EMPRÉSTIMOS — com detalhes expansíveis
// ============================================================================
// Cada parcela tem 3 botões (no lugar do antigo "Receber"):
//   - WhatsApp (abre conversa com mensagem pronta)
//   - Pagamento (modal que suporta parcial/total)
//   - Histórico (timeline de cobranças já feitas)

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { FiltrosBar } from "@/components/listas/filtros-bar";
import { formatarMoeda, formatarData } from "@/lib/constants";
import { statusParcelaVencida } from "@/lib/finance/calculadora";
import { BotaoWhatsApp } from "@/components/cobranca/botao-whatsapp";
import { DialogPagamento } from "@/components/cobranca/dialog-pagamento";
import { DialogHistorico } from "@/components/cobranca/dialog-historico";
import type {
  EmprestimoComCliente,
  Parcela,
} from "@/lib/types/database";

interface EmprestimoComParcelas extends EmprestimoComCliente {
  parcelas?: Parcela[];
}

type FiltroStatus = "todos" | "ativo" | "quitado" | "atrasado";

export function EmprestimoList({
  emprestimos,
}: {
  emprestimos: EmprestimoComParcelas[];
}) {
  const [expandido, setExpandido] = useState<string | null>(
    emprestimos[0]?.id || null,
  );

  // Filtros
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<FiltroStatus>("todos");

  const filtrados = useMemo(() => {
    let resultado = [...emprestimos];

    if (busca.trim()) {
      const termo = busca.toLowerCase().trim();
      resultado = resultado.filter((e) =>
        (e.clientes?.nome || "").toLowerCase().includes(termo),
      );
    }

    if (status !== "todos") {
      resultado = resultado.filter((e) => e.status === status);
    }

    return resultado;
  }, [emprestimos, busca, status]);

  const counts = useMemo(
    () => ({
      ativo: emprestimos.filter((e) => e.status === "ativo").length,
      quitado: emprestimos.filter((e) => e.status === "quitado").length,
      atrasado: emprestimos.filter((e) => e.status === "atrasado").length,
    }),
    [emprestimos],
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
    <>
      <FiltrosBar
        busca={busca}
        onBusca={setBusca}
        placeholderBusca="Buscar por cliente..."
        totalResultados={filtrados.length}
        chips={[
          { valor: "todos", label: "Todos", count: emprestimos.length },
          { valor: "ativo", label: "Ativos", count: counts.ativo },
          { valor: "atrasado", label: "Atrasados", count: counts.atrasado },
          { valor: "quitado", label: "Quitados", count: counts.quitado },
        ]}
        filtroAtivo={status}
        onFiltro={(v) => setStatus(v as FiltroStatus)}
      />

      {filtrados.length === 0 ? (
        <EmptyState
          titulo="Nenhum empréstimo encontrado"
          descricao="Tente outro filtro ou termo de busca."
          icone="hand-coins"
          compacto
        />
      ) : (
        <ul className="space-y-3">
          {filtrados.map((emp) => {
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
                <ParcelaList
                  parcelas={parcelas}
                  totalParcelas={emp.num_parcelas}
                  nomeCliente={emp.clientes?.nome || "—"}
                  telefoneCliente={emp.clientes?.telefone || null}
                />
              </div>
            )}
          </li>
        );
      })}
        </ul>
      )}
    </>
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
// LISTA DE PARCELAS — com botões WhatsApp, Pagamento (parcial) e Histórico
// --------------------------------------------------------------------------
function ParcelaList({
  parcelas,
  totalParcelas,
  nomeCliente,
  telefoneCliente,
}: {
  parcelas: Parcela[];
  totalParcelas: number;
  nomeCliente: string;
  telefoneCliente: string | null;
}) {
  const [pagamento, setPagamento] = useState<Parcela | null>(null);
  const [historico, setHistorico] = useState<Parcela | null>(null);

  if (parcelas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Sem parcelas geradas.</p>
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
              className="flex items-center justify-between rounded-md bg-background p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                {status === "paga" ? (
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                ) : status === "atrasada" ? (
                  <AlertTriangle className="size-5 shrink-0 text-rose-600" />
                ) : (
                  <Clock className="size-5 shrink-0 text-amber-600" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium">Parcela {p.numero}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Vence {formatarData(p.vencimento)}
                    {p.data_pagamento &&
                      ` • Paga em ${formatarData(p.data_pagamento)}`}
                    {p.ultima_cobranca &&
                      ` • cobrada ${new Date(
                        p.ultima_cobranca,
                      ).toLocaleDateString("pt-BR")}`}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="text-right">
                  <div className="num-moeda font-semibold">
                    {formatarMoeda(p.valor)}
                  </div>
                  {parcial && Number(p.valor_pago) > 0 && (
                    <div className="num-moeda text-xs text-emerald-600">
                      pago {formatarMoeda(Number(p.valor_pago))}
                    </div>
                  )}
                </div>
                {status === "paga" ? (
                  <span className="badge-success">Paga</span>
                ) : (
                  <div className="flex items-center gap-1">
                    {/* Badge de status */}
                    {status === "atrasada" ? (
                      <span className="badge-danger">Atrasada</span>
                    ) : parcial ? (
                      <span className="badge-warning">Parcial</span>
                    ) : (
                      <span className="badge-warning">Pendente</span>
                    )}

                    {/* Botão WhatsApp */}
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

                    {/* Botão Pagamento */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPagamento(p)}
                      aria-label="Registrar pagamento"
                    >
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    </Button>

                    {/* Botão Histórico */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setHistorico(p)}
                      aria-label="Histórico de cobranças"
                    >
                      <History className="size-4" />
                    </Button>
                  </div>
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
