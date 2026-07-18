"use client";

// ============================================================================
// GRÁFICO DE BARRAS: COMPARATIVO MÊS A MÊS
// ============================================================================
// Mostra entradas (verde) vs saídas (vermelho) dos últimos 6 meses.

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { EmptyState } from "@/components/empty-state";
import { formatarMoeda } from "@/lib/constants";

interface Dado {
  mes: string;
  entradas: number;
  saidas: number;
}

const config = {
  entradas: { label: "Entradas", color: "#10b981" },
  saidas: { label: "Saídas", color: "#ef4444" },
} satisfies ChartConfig;

export function ComparativoBarras({ dados }: { dados: Dado[] }) {
  const temDados = dados.some((d) => d.entradas > 0 || d.saidas > 0);

  if (!temDados) {
    return (
      <EmptyState
        titulo="Sem histórico ainda"
        descricao="O comparativo aparece com o primeiro mês de dados."
        icone="wallet"
        compacto
      />
    );
  }

  return (
    <ChartContainer config={config} className="h-[240px] w-full">
      <BarChart data={dados} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
        <XAxis
          dataKey="mes"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) =>
            new Intl.NumberFormat("pt-BR", {
              notation: "compact",
              compactDisplay: "short",
            }).format(v as number)
          }
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {name === "entradas" ? "Entradas" : "Saídas"}
                  </span>
                  <span className="font-semibold num-moeda">
                    {formatarMoeda(value as number)}
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="entradas"
          fill="var(--color-entradas)"
          radius={[6, 6, 0, 0]}
          maxBarSize={28}
        />
        <Bar
          dataKey="saidas"
          fill="var(--color-saidas)"
          radius={[6, 6, 0, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ChartContainer>
  );
}
