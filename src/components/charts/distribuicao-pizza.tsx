"use client";

// ============================================================================
// GRÁFICO DE PIZZA (DONUT): DISTRIBUIÇÃO POR EMPREENDIMENTO
// ============================================================================
// Mostra quanto cada negócio (Adega, Empréstimos, Sucatas) movimenta.

import { Pie, PieChart, Cell } from "recharts";

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
  nome: string;
  valor: number;
  chave: string;
}

// Cores de cada empreendimento (alinhadas com EMPREENDIMENTOS do constants)
const CORES: Record<string, string> = {
  adega: "#e11d48", // rosa (adega)
  emprestimos: "#f59e0b", // âmbar (empréstimos)
  sucatas: "#10b981", // verde (sucatas)
};

const config = {
  adega: { label: "Adega", color: CORES.adega },
  emprestimos: { label: "Empréstimos", color: CORES.emprestimos },
  sucatas: { label: "Sucatas", color: CORES.sucatas },
} satisfies ChartConfig;

export function DistribuicaoPizza({ dados }: { dados: Dado[] }) {
  const temDados = dados.some((d) => d.valor > 0);
  const total = dados.reduce((s, d) => s + d.valor, 0);

  if (!temDados) {
    return (
      <EmptyState
        titulo="Sem dados ainda"
        descricao="A distribuição aparece quando você tiver movimentações."
        icone="wallet"
        compacto
      />
    );
  }

  return (
    <div className="relative">
      <ChartContainer
        config={config}
        className="mx-auto h-[220px] w-full"
      >
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                nameKey="nome"
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-muted-foreground">{name}</span>
                    <span className="font-semibold num-moeda">
                      {formatarMoeda(value as number)}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Pie
            data={dados}
            dataKey="valor"
            nameKey="nome"
            innerRadius={56}
            outerRadius={88}
            paddingAngle={2}
            strokeWidth={0}
          >
            {dados.map((d) => (
              <Cell key={d.chave} fill={CORES[d.chave] || "#94a3b8"} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="nome" />} />
        </PieChart>
      </ChartContainer>

      {/* Total no centro do donut */}
      <div className="pointer-events-none absolute inset-x-0 top-[64px] flex flex-col items-center">
        <p className="text-xs text-muted-foreground">Total</p>
        <p className="num-moeda text-sm font-bold">{formatarMoeda(total)}</p>
      </div>
    </div>
  );
}
