"use client";

// ============================================================================
// TABELA DE COBRANÇAS — o coração da rotina de cobrança
// ============================================================================
// Mostra TODAS as parcelas pendentes/atrasadas/parciais com:
//   - Filtros: Todas / Atrasadas / Hoje / Esta semana
//   - Busca por nome do cliente
//   - Badges de status com cores semânticas
//   - Botões por linha: WhatsApp | Pagamento | Histórico
//   - Ordenação por urgência (atrasadas no topo)

import { useState, useMemo } from "react";
import {
  Search,
  History,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { BotaoWhatsApp } from "@/components/cobranca/botao-whatsapp";
import { DialogPagamento } from "@/components/cobranca/dialog-pagamento";
import { DialogHistorico } from "@/components/cobranca/dialog-historico";
import { EmptyState } from "@/components/empty-state";
import {
  formatarMoeda,
  formatarData,
  formatarTelefone,
} from "@/lib/constants";
import { descreverUltimaCobranca } from "@/lib/cobranca/mensagem";
import type { ParcelaParaCobranca } from "@/app/actions/cobrancas";

type Filtro = "todas" | "atrasadas" | "hoje" | "semana";

function ehHoje(dataISO: string): boolean {
  const hoje = new Date().toISOString().slice(0, 10);
  return dataISO === hoje;
}

function diasAteVencimento(dataISO: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const v = new Date(dataISO + "T00:00:00");
  return Math.floor((v.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function statusVisual(p: ParcelaParaCobranca): {
  icone: typeof Clock;
  classe: string;
  texto: string;
} {
  const dias = diasAteVencimento(p.vencimento);

  if (p.status === "parcial") {
    return {
      icone: Clock,
      classe: "badge-warning",
      texto: `Parcial (${formatarMoeda(p.valor - p.valor_pago)})`,
    };
  }
  if (dias < 0) {
    return {
      icone: AlertTriangle,
      classe: "badge-danger",
      texto: `${Math.abs(dias)}d atrasada`,
    };
  }
  if (dias === 0) {
    return { icone: CalendarClock, classe: "badge-warning", texto: "Vence hoje" };
  }
  if (dias <= 7) {
    return {
      icone: Clock,
      classe: "badge-info",
      texto: `Vence em ${dias}d`,
    };
  }
  return { icone: Clock, classe: "badge-info", texto: `Vence em ${dias}d` };
}

export function TabelaCobrancas({
  parcelas,
}: {
  parcelas: ParcelaParaCobranca[];
}) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [pagamentoAberto, setPagamentoAberto] =
    useState<ParcelaParaCobranca | null>(null);
  const [historicoAberto, setHistoricoAberto] =
    useState<ParcelaParaCobranca | null>(null);

  // Aplica filtros + busca
  const filtradas = useMemo(() => {
    let resultado = [...parcelas];

    // Busca por nome
    if (busca.trim()) {
      const termo = busca.toLowerCase().trim();
      resultado = resultado.filter((p) =>
        p.cliente_nome.toLowerCase().includes(termo),
      );
    }

    // Filtro por situação
    if (filtro === "atrasadas") {
      resultado = resultado.filter((p) => diasAteVencimento(p.vencimento) < 0);
    } else if (filtro === "hoje") {
      resultado = resultado.filter((p) => ehHoje(p.vencimento));
    } else if (filtro === "semana") {
      resultado = resultado.filter(
        (p) => diasAteVencimento(p.vencimento) <= 7,
      );
    }

    return resultado;
  }, [parcelas, busca, filtro]);

  // Contadores para os filtros
  const counts = useMemo(() => {
    return {
      todas: parcelas.length,
      atrasadas: parcelas.filter((p) => diasAteVencimento(p.vencimento) < 0)
        .length,
      hoje: parcelas.filter((p) => ehHoje(p.vencimento)).length,
      semana: parcelas.filter((p) => diasAteVencimento(p.vencimento) <= 7)
        .length,
    };
  }, [parcelas]);

  if (parcelas.length === 0) {
    return (
      <EmptyState
        titulo="Nenhuma cobrança pendente"
        descricao="Quando houver parcelas em aberto, elas aparecem aqui organizadas por urgência."
        icone="calendar"
      />
    );
  }

  const filtros: Array<{ valor: Filtro; label: string; count: number }> = [
    { valor: "todas", label: "Todas", count: counts.todas },
    { valor: "atrasadas", label: "Atrasadas", count: counts.atrasadas },
    { valor: "hoje", label: "Vencem hoje", count: counts.hoje },
    { valor: "semana", label: "Esta semana", count: counts.semana },
  ];

  return (
    <div className="space-y-4">
      {/* Barra de ferramentas: busca + filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filtros.map((f) => (
            <button
              key={f.valor}
              onClick={() => setFiltro(f.valor)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filtro === f.valor
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* Lista (em cards no mobile, tabela no desktop) */}
      {filtradas.length === 0 ? (
        <EmptyState
          titulo="Nada aqui com esse filtro"
          descricao="Tente outro filtro ou limpe a busca."
          icone="calendar"
          compacto
        />
      ) : (
        <>
          {/* Versão mobile: cards empilhados */}
          <div className="space-y-2 sm:hidden">
            {filtradas.map((p) => (
              <Card key={p.id}>
                <CardContent className="space-y-3 pt-4">
                  <MobileRow
                    p={p}
                    onPagamento={() => setPagamentoAberto(p)}
                    onHistorico={() => setHistoricoAberto(p)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Versão desktop: tabela */}
          <Card className="hidden sm:block">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="p-3 font-medium">Cliente</th>
                    <th className="p-3 font-medium">Parcela</th>
                    <th className="p-3 text-right font-medium">Valor</th>
                    <th className="p-3 font-medium">Vencimento</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtradas.map((p) => {
                    const sv = statusVisual(p);
                    return (
                      <tr key={p.id} className="text-sm hover:bg-muted/30">
                        <td className="p-3">
                          <div className="font-medium">{p.cliente_nome}</div>
                          {p.cliente_telefone && (
                            <div className="text-xs text-muted-foreground">
                              {formatarTelefone(p.cliente_telefone)}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {p.numero}/{p.total_parcelas}
                        </td>
                        <td className="p-3 text-right">
                          <div className="num-moeda font-semibold">
                            {formatarMoeda(p.valor)}
                          </div>
                          {p.valor_pago > 0 && (
                            <div className="num-moeda text-xs text-emerald-600">
                              pago {formatarMoeda(p.valor_pago)}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div>{formatarData(p.vencimento)}</div>
                          {p.cobrancas_count > 0 && (
                            <div className="text-xs text-muted-foreground">
                              cobrado {p.cobrancas_count}x ·{" "}
                              {descreverUltimaCobranca(p.ultima_cobranca)}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={sv.classe}>
                            <sv.icone className="size-3" />
                            {sv.texto}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <BotaoWhatsApp
                              parcelaId={p.id}
                              nomeCliente={p.cliente_nome}
                              telefone={p.cliente_telefone}
                              numeroParcela={p.numero}
                              totalParcelas={p.total_parcelas}
                              valor={p.valor}
                              valorPago={p.valor_pago}
                              vencimento={p.vencimento}
                              status={
                                p.status as "pendente" | "atrasada" | "parcial"
                              }
                              ultimaCobranca={p.ultima_cobranca}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPagamentoAberto(p)}
                            >
                              <CheckCircle2 className="size-4 text-emerald-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setHistoricoAberto(p)}
                              aria-label="Histórico"
                            >
                              <History className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Modais */}
      {pagamentoAberto && (
        <DialogPagamento
          aberto={true}
          onFechar={() => setPagamentoAberto(null)}
          parcelaId={pagamentoAberto.id}
          numero={pagamentoAberto.numero}
          valorTotal={pagamentoAberto.valor}
          valorJaPago={pagamentoAberto.valor_pago}
          nomeCliente={pagamentoAberto.cliente_nome}
        />
      )}

      {historicoAberto && (
        <DialogHistorico
          aberto={true}
          onFechar={() => setHistoricoAberto(null)}
          parcelaId={historicoAberto.id}
          numero={historicoAberto.numero}
          nomeCliente={historicoAberto.cliente_nome}
        />
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// ROW MOBILE (card para telas pequenas)
// --------------------------------------------------------------------------
function MobileRow({
  p,
  onPagamento,
  onHistorico,
}: {
  p: ParcelaParaCobranca;
  onPagamento: () => void;
  onHistorico: () => void;
}) {
  const sv = statusVisual(p);
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{p.cliente_nome}</p>
          <p className="text-xs text-muted-foreground">
            Parcela {p.numero}/{p.total_parcelas} • Vence{" "}
            {formatarData(p.vencimento)}
          </p>
        </div>
        <span className={sv.classe}>
          <sv.icone className="size-3" />
          {sv.texto}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="num-moeda text-lg font-bold">{formatarMoeda(p.valor)}</p>
          {p.valor_pago > 0 && (
            <p className="num-moeda text-xs text-emerald-600">
              já pagou {formatarMoeda(p.valor_pago)}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <BotaoWhatsApp
            parcelaId={p.id}
            nomeCliente={p.cliente_nome}
            telefone={p.cliente_telefone}
            numeroParcela={p.numero}
            totalParcelas={p.total_parcelas}
            valor={p.valor}
            valorPago={p.valor_pago}
            vencimento={p.vencimento}
            status={p.status as "pendente" | "atrasada" | "parcial"}
            ultimaCobranca={p.ultima_cobranca}
            size="sm"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={onPagamento}
            aria-label="Registrar pagamento"
          >
            <CheckCircle2 className="size-4 text-emerald-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onHistorico}
            aria-label="Histórico"
          >
            <History className="size-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
