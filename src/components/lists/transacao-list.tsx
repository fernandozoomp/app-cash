"use client";

// ============================================================================
// LISTA DE TRANSAÇÕES (com confirmação elegante + FILTROS completos)
// ============================================================================

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

import { apagarTransacao } from "@/app/actions/caixa";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { FiltrosBar } from "@/components/listas/filtros-bar";
import {
  formatarMoeda,
  formatarData,
  traduzirCategoria,
} from "@/lib/constants";
import type { Transacao, Empreendimento } from "@/lib/types/database";

type FiltroEmp = "todos" | Empreendimento;

export function TransacaoList({ transacoes }: { transacoes: Transacao[] }) {
  const [pendente, startTransition] = useTransition();
  const router = useRouter();
  const confirmar = useConfirm();

  // Filtros
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<"todos" | "entrada" | "saida">("todos");
  const [emp, setEmp] = useState<FiltroEmp>("todos");

  // Aplica filtros
  const filtrados = useMemo(() => {
    let resultado = [...transacoes];

    if (busca.trim()) {
      const termo = busca.toLowerCase().trim();
      resultado = resultado.filter(
        (t) =>
          (t.descricao || "").toLowerCase().includes(termo) ||
          traduzirCategoria(t.categoria).toLowerCase().includes(termo),
      );
    }

    if (tipo !== "todos") {
      resultado = resultado.filter((t) => t.tipo === tipo);
    }

    if (emp !== "todos") {
      resultado = resultado.filter((t) => t.empreendimento === emp);
    }

    return resultado;
  }, [transacoes, busca, tipo, emp]);

  // Contadores
  const counts = useMemo(
    () => ({
      adega: transacoes.filter((t) => t.empreendimento === "adega").length,
      emprestimos: transacoes.filter((t) => t.empreendimento === "emprestimos")
        .length,
      sucatas: transacoes.filter((t) => t.empreendimento === "sucatas").length,
    }),
    [transacoes],
  );

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
    <>
      <FiltrosBar
        busca={busca}
        onBusca={setBusca}
        placeholderBusca="Buscar por descrição ou categoria..."
        totalResultados={filtrados.length}
        chips={[
          { valor: "todos", label: "Todos", count: transacoes.length },
          { valor: "adega", label: "🍷 Adega", count: counts.adega },
          { valor: "emprestimos", label: "🤝 Empréstimos", count: counts.emprestimos },
          { valor: "sucatas", label: "♻️ Sucatas", count: counts.sucatas },
        ]}
        filtroAtivo={emp}
        onFiltro={(v) => setEmp(v as FiltroEmp)}
      />

      {/* Filtro de tipo (entrada/saída) — chips separados */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(["todos", "entrada", "saida"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTipo(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              tipo === t
                ? t === "entrada"
                  ? "bg-emerald-600 text-white"
                  : t === "saida"
                    ? "bg-rose-600 text-white"
                    : "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {t === "todos" ? "Tudo" : t === "entrada" ? "↑ Entradas" : "↓ Saídas"}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <EmptyState
          titulo="Nenhuma movimentação encontrada"
          descricao="Tente outro filtro ou limpe a busca."
          icone="wallet"
          compacto
        />
      ) : (
        <ul className="divide-y">
          {filtrados.map((t) => {
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
      )}
    </>
  );
}
