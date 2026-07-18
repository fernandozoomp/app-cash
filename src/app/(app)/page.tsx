// ============================================================================
// DASHBOARD — TELA INICIAL COM DADOS REAIS
// ============================================================================
// Server Component: busca dados no banco e mostra o resumo.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown, HandCoins, CalendarClock, AlertTriangle } from "lucide-react";
import { formatarMoeda, formatarData, EMPREENDIMENTOS } from "@/lib/constants";
import { obterResumoCaixa } from "@/app/actions/caixa";
import { proximosVencimentos } from "@/app/actions/emprestimos";
import { statusParcelaVencida } from "@/lib/finance/calculadora";

export default async function DashboardPage() {
  // Busca paralela de dados (mais rápido)
  const [resumo, vencimentos] = await Promise.all([
    obterResumoCaixa(),
    proximosVencimentos(7),
  ]);

  const cards = [
    {
      titulo: "Saldo Atual",
      valor: formatarMoeda(resumo.saldo),
      icone: Wallet,
      cor: "text-emerald-600",
      descricao: "Entradas − Saídas (total)",
    },
    {
      titulo: "Entradas do Mês",
      valor: formatarMoeda(resumo.entradasMes),
      icone: TrendingUp,
      cor: "text-blue-600",
      descricao: "Dinheiro que entrou",
    },
    {
      titulo: "Saídas do Mês",
      valor: formatarMoeda(resumo.saidasMes),
      icone: TrendingDown,
      cor: "text-rose-600",
      descricao: "Dinheiro que saiu",
    },
    {
      titulo: "A Receber",
      valor: formatarMoeda(resumo.aReceber),
      icone: HandCoins,
      cor: "text-amber-600",
      descricao: "Parcelas em aberto",
    },
  ];

  const totalEmp = resumo.porEmpreendimento;

  return (
    <>
      <PageHeader
        titulo="Visão Geral"
        descricao="Resumo financeiro dos seus empreendimentos"
      />

      {/* 4 cards principais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icone = card.icone;
          return (
            <Card key={card.titulo}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.titulo}
                </CardTitle>
                <Icone className={`size-5 ${card.cor}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.cor}`}>
                  {card.valor}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.descricao}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Linha de saldo por empreendimento */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {(Object.keys(EMPREENDIMENTOS) as Array<keyof typeof EMPREENDIMENTOS>).map(
          (emp) => {
            const valor = totalEmp[emp];
            return (
              <Card key={emp}>
                <CardContent className="flex items-center justify-between pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {EMPREENDIMENTOS[emp].label}
                    </p>
                    <p className={`mt-1 text-xl font-bold ${EMPREENDIMENTOS[emp].cor}`}>
                      {formatarMoeda(valor)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          },
        )}
      </div>

      {/* Próximos vencimentos */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-5 text-amber-600" />
            Próximos Vencimentos
          </CardTitle>
          <CardDescription>
            Parcelas a vencer nos próximos 7 dias (e atrasadas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vencimentos.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              🎉 Nenhum vencimento próximo. Tudo em dia!
            </p>
          ) : (
            <ul className="divide-y">
              {vencimentos.data.map((p: any) => {
                const status = statusParcelaVencida(p);
                const nome = p.emprestimos?.clientes?.nome || "—";
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="font-medium">{nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Parcela {p.numero} • Vence {formatarData(p.vencimento)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">
                        {formatarMoeda(p.valor)}
                      </span>
                      {status === "atrasada" ? (
                        <Badge variant="destructive">
                          <AlertTriangle className="mr-1 size-3" />
                          Atrasada
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
