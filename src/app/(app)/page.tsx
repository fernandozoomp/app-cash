// ============================================================================
// DASHBOARD — TELA INICIAL REFATORADA (visual fintech)
// ============================================================================
// Novo layout em seções:
//   1. Saudação + data
//   2. Atalhos rápidos (4 botões grandes)
//   3. Saldo principal (card hero) + 3 mini cards
//   4. Gráfico de linha (saldo 30 dias)
//   5. Pizza (distribuição) + Barras (mês a mês)
//   6. Próximos vencimentos

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  HandCoins,
  CalendarClock,
  AlertTriangle,
  ArrowRight,
  BellRing,
} from "lucide-react";
import { formatarMoeda, formatarDataExtenso } from "@/lib/constants";
import { obterResumoCaixa } from "@/app/actions/caixa";
import { proximosVencimentos } from "@/app/actions/emprestimos";
import { listarCobrancasPendentes } from "@/app/actions/cobrancas";
import { statusParcelaVencida } from "@/lib/finance/calculadora";
import { AtalhosRapidos } from "@/components/charts/atalhos-rapidos";
import { SaldoLinha } from "@/components/charts/saldo-linha";
import { DistribuicaoPizza } from "@/components/charts/distribuicao-pizza";
import { ComparativoBarras } from "@/components/charts/comparativo-barras";

// Helper local: dias até o vencimento
function diasAte(dataISO: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const v = new Date(dataISO + "T00:00:00");
  return Math.floor((v.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

// Saudação inteligente baseada no horário local.
function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function DashboardPage() {
  const [resumo, vencimentos, cobrancasPendentes] = await Promise.all([
    obterResumoCaixa(),
    proximosVencimentos(7),
    listarCobrancasPendentes(),
  ]);

  const temDados =
    resumo.saldo !== 0 ||
    resumo.entradasMes !== 0 ||
    resumo.saidasMes !== 0 ||
    resumo.aReceber !== 0;

  // Métricas para o widget "Cobrar hoje"
  const atrasadas = cobrancasPendentes.data.filter(
    (p) => diasAte(p.vencimento) < 0,
  );
  const vencemHoje = cobrancasPendentes.data.filter(
    (p) => diasAte(p.vencimento) === 0,
  );
  const totalCobrancasHoje = atrasadas.length + vencemHoje.length;

  return (
    <>
      {/* SAUDAÇÃO + DATA */}
      <PageHeader
        titulo={`${saudacao()} 👋`}
        descricao={formatarDataExtenso(new Date())}
      />

      {/* WIDGET: COBRAR HOJE (destaque se houver pendências) */}
      {totalCobrancasHoje > 0 && (
        <Card className="mb-8 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="flex flex-col items-start justify-between gap-4 pt-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                <BellRing className="size-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">
                  {totalCobrancasHoje} cobrança(s) para fazer hoje
                </p>
                <p className="text-sm text-muted-foreground">
                  {atrasadas.length > 0 && `${atrasadas.length} atrasada(s)`}
                  {atrasadas.length > 0 && vencemHoje.length > 0 && " • "}
                  {vencemHoje.length > 0 && `${vencemHoje.length} vencendo hoje`}
                </p>
              </div>
            </div>
            <Button asChild className="shrink-0">
              <Link href="/cobrancas">
                Ir para Cobranças
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ATALHOS RÁPIDOS */}
      <div className="mb-8">
        <AtalhosRapidos />
      </div>

      {/* SALDO PRINCIPAL + MINI CARDS */}
      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        {/* Card principal: saldo (ocupa 2 colunas no desktop) */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent lg:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Wallet className="size-4" />
                  Saldo total
                </p>
                <p
                  className={`num-moeda mt-2 text-4xl font-bold tracking-tight ${
                    resumo.saldo >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {formatarMoeda(resumo.saldo)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Entradas − Saídas de todos os empreendimentos
                </p>
              </div>
              <div className="hidden size-20 items-center justify-center rounded-2xl bg-primary/10 sm:flex">
                <Wallet className="size-10 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3 mini cards empilhados */}
        <div className="grid gap-4">
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="size-3.5 text-blue-600" />
                  Entradas (mês)
                </p>
                <p className="num-moeda mt-0.5 text-lg font-bold text-blue-600">
                  {formatarMoeda(resumo.entradasMes)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingDown className="size-3.5 text-rose-600" />
                  Saídas (mês)
                </p>
                <p className="num-moeda mt-0.5 text-lg font-bold text-rose-600">
                  {formatarMoeda(resumo.saidasMes)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <HandCoins className="size-3.5 text-amber-600" />
                  A receber
                </p>
                <p className="num-moeda mt-0.5 text-lg font-bold text-amber-600">
                  {formatarMoeda(resumo.aReceber)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* GRÁFICO DE LINHA: SALDO 30 DIAS */}
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Evolução do saldo
          </CardTitle>
          <CardDescription>Últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <SaldoLinha dados={resumo.saldoPorDia} />
        </CardContent>
      </Card>

      {/* PIZZA + BARRAS (lado a lado no desktop) */}
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Distribuição por empreendimento
            </CardTitle>
            <CardDescription>
              Movimentação total de cada negócio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistribuicaoPizza dados={resumo.distribuicao} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Entradas x Saídas
            </CardTitle>
            <CardDescription>Comparativo dos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ComparativoBarras dados={resumo.comparativoMensal} />
          </CardContent>
        </Card>
      </div>

      {/* PRÓXIMOS VENCIMENTOS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CalendarClock className="size-5 text-amber-600" />
            Vencimentos dos próximos 7 dias
          </CardTitle>
          <CardDescription>
            Parcelas a vencer e as que já passaram
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vencimentos.data.length === 0 ? (
            <EmptyState
              titulo="Tudo em dia por aqui"
              descricao="Não há parcelas vencendo nos próximos 7 dias."
              icone="calendar"
              compacto
            />
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
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Parcela {p.numero} • Vence{" "}
                        {new Date(p.vencimento).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="num-moeda font-semibold">
                        {formatarMoeda(p.valor)}
                      </span>
                      {status === "atrasada" ? (
                        <span className="badge-danger">
                          <AlertTriangle className="size-3" />
                          Atrasada
                        </span>
                      ) : (
                        <span className="badge-warning">Pendente</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {vencimentos.data.length > 0 && (
            <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
              <Link href="/emprestimos">
                Ver todos os empréstimos
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* EMPTY STATE: PRIMEIRO USO */}
      {!temDados && (
        <Card className="mt-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <EmptyState
              titulo="Bem-vindo ao seu novo controle financeiro!"
              descricao="Comece registrando sua primeira venda, despesa ou criando um empréstimo. Em poucos cliques seu dashboard ganha vida."
              icone="wallet"
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}
