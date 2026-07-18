"use client";

// ============================================================================
// TIMELINE DE EVENTOS DO EMPRÉSTIMO
// ============================================================================
// Mostra cronologicamente: criação do empréstimo, cada pagamento recebido,
// cada cobrança enviada. Visual de "linha do tempo" com bolinhas.

import {
  CheckCircle2,
  HandCoins,
  MessageCircle,
  Plus,
} from "lucide-react";
import { formatarMoeda, formatarData } from "@/lib/constants";

interface Evento {
  data: string;
  tipo: "criacao" | "pagamento" | "cobranca";
  descricao: string;
  valor?: number;
}

interface Props {
  emprestimo: any;
  parcelas: any[];
}

export function EmprestimoTimeline({ emprestimo, parcelas }: Props) {
  // Monta a lista de eventos
  const eventos: Evento[] = [];

  // 1) Criação
  eventos.push({
    data: emprestimo.created_at,
    tipo: "criacao",
    descricao: `Empréstimo criado — ${emprestimo.num_parcelas}x de ${formatarMoeda(emprestimo.valor_parcela || 0)}`,
    valor: emprestimo.valor_principal,
  });

  // 2) Pagamentos (parcelas pagas ou parciais)
  for (const p of parcelas) {
    if (p.status === "paga" || (p.status === "parcial" && p.valor_pago > 0)) {
      eventos.push({
        data: p.data_pagamento || p.updated_at,
        tipo: "pagamento",
        descricao: `Pagamento ${p.status === "parcial" ? "parcial" : ""} da parcela ${p.numero}`,
        valor: Number(p.valor_pago) || Number(p.valor),
      });
    }
  }

  // 3) Cobranças (das parcelas com ultima_cobranca)
  for (const p of parcelas) {
    if (p.ultima_cobranca) {
      eventos.push({
        data: p.ultima_cobranca,
        tipo: "cobranca",
        descricao: `Cobrança enviada — parcela ${p.numero}`,
      });
    }
  }

  // Ordena por data (mais recente primeiro)
  eventos.sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
  );

  if (eventos.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Sem eventos registrados.
      </p>
    );
  }

  const icones = {
    criacao: { Icone: Plus, cor: "bg-blue-100 text-blue-700" },
    pagamento: { Icone: CheckCircle2, cor: "bg-emerald-100 text-emerald-700" },
    cobranca: { Icone: MessageCircle, cor: "bg-amber-100 text-amber-700" },
  };

  return (
    <ol className="relative space-y-4 border-l-2 border-muted pl-6">
      {eventos.map((ev, i) => {
        const { Icone, cor } = icones[ev.tipo];
        const data = new Date(ev.data);
        return (
          <li key={i} className="relative">
            {/* Bolinha do timeline */}
            <span
              className={`absolute -left-[31px] flex size-5 items-center justify-center rounded-full ring-2 ring-background ${cor}`}
            >
              <Icone className="size-3" />
            </span>

            <div className="rounded-lg bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{ev.descricao}</p>
                {ev.valor !== undefined && (
                  <span className="num-moeda shrink-0 text-sm font-semibold text-emerald-600">
                    +{formatarMoeda(ev.valor)}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {data.toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
