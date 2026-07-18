"use client";

// ============================================================================
// GRÁFICO DE ÁREA: SALDO AO LONGO DOS ÚLTIMOS 30 DIAS
// ============================================================================
// Mostra a evolução do saldo. Verde esmeralda com gradiente suave.

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { EmptyState } from "@/components/empty-state";
import { formatarMoeda } from "@/lib/constants";

interface Dado {
  data: string; // YYYY-MM-DD
  saldo: number;
}

const config = {
  saldo: {
    label: "Saldo",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function SaldoLinha({ dados }: { dados: Dado[] }) {
  // Se todos os saldos forem zero, mostra empty state
  const temDados = dados.some((d) => d.saldo !== 0);

  if (!temDados) {
    return (
      <EmptyState
        titulo="Sem histórico ainda"
        descricao="O gráfico aparece quando você registrar suas primeiras movimentações."
        icone="wallet"
        compacto
      />
    );
  }

  // Formata data legível: "17/07"
  const formatarEixoX = (data: string) => {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}`;
  };

  return (
    <ChartContainer config={config} className="h-[240px] w-full">
      <AreaChart data={dados} margin={{ left: 8, right: 12, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
        <XAxis
          dataKey="data"
          tickFormatter={formatarEixoX}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
          minTickGap={32}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v) =>
            new Intl.NumberFormat("pt-BR", {
              notation: "compact",
              compactDisplay: "short",
            }).format(v as number)
          }
        />
        <ChartTooltip
          cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeDasharray: "3 3" }}
          content={
            <ChartTooltipContent
              labelFormatter={(label) => {
                const [ano, mes, dia] = (label as string).split("-");
                return `${dia}/${mes}/${ano}`;
              }}
              formatter={(value) => (
                <span className="font-semibold num-moeda">
                  {formatarMoeda(value as number)}
                </span>
              )}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="saldo"
          stroke="var(--primary)"
          strokeWidth={2.5}
          fill="url(#gradSaldo)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
