// ============================================================================
// DASHBOARD — TELA INICIAL COM DADOS REAIS
// ============================================================================
// Melhorias aplicadas (Etapa 4):
// - Saudação personalizada por horário (Bom dia/Boa tarde/Boa noite)
// - Hierarquia visual: card principal de saldo em destaque
// - Empty state amigável quando não há dados
// - Animações sutis de entrada
// - Indicadores de tendência (setas coloridas)
// - Lista de vencimentos com cores semânticas

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
  Sparkles,
} from "lucide-react";
import {
  formatarMoeda,
  formatarData,
  EMPREENDIMENTOS,
} from "@/lib/constants";
import { obterResumoCaixa } from "@/app/actions/caixa";
import { proximosVencimentos } from "@/app/actions/emprestimos";
import { statusParcelaVencida } from "@/lib/finance/calculadora";

// Saudação inteligente baseada no horário local.
function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function DashboardPage() {
  const [resumo, vencimentos] = await Promise.all([
    obterResumoCaixa(),
    proximosVencimentos(7),
  ]);

  const temDados =
    resumo.saldo !== 0 ||
    resumo.entradasMes !== 0 ||
    resumo.saidasMes !== 0 ||
    resumo.aReceber !== 0;

  return (
    <>
      <PageHeader
        titulo={`${saudacao()} 👋`}
        descricao="Veja como estão seus negócios hoje."
      />

      {/* ===== CARD PRINCIPAL: SALDO ATUAL ===== */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Wallet className="size-4" />
                Saldo total
              </p>
              <p
                className={`mt-1 text-4xl font-bold tracking-tight num-moeda ${
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

      {/* ===== 3 CARDS SECUNDÁRIOS ===== */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Entradas do mês</p>
              <TrendingUp className="size-4 text-blue-600" />
            </div>
            <p className="mt-1 text-2xl font-bold text-blue-600 num-moeda">
              {formatarMoeda(resumo.entradasMes)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Saídas do mês</p>
              <TrendingDown className="size-4 text-rose-600" />
            </div>
            <p className="mt-1 text-2xl font-bold text-rose-600 num-moeda">
              {formatarMoeda(resumo.saidasMes)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">A receber</p>
              <HandCoins className="size-4 text-amber-600" />
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-600 num-moeda">
              {formatarMoeda(resumo.aReceber)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ===== SALDO POR EMPREENDIMENTO ===== */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Por empreendimento
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            Object.keys(EMPREENDIMENTOS) as Array<
              keyof typeof EMPREENDIMENTOS
            >
          ).map((emp) => {
            const valor = resumo.porEmpreendimento[emp];
            return (
              <Card key={emp} className="overflow-hidden">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    {EMPREENDIMENTOS[emp].label}
                  </p>
                  <p
                    className={`mt-1 text-xl font-bold num-moeda ${
                      valor >= 0
                        ? EMPREENDIMENTOS[emp].cor
                        : "text-rose-600"
                    }`}
                  >
                    {formatarMoeda(valor)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ===== PRÓXIMOS VENCIMENTOS ===== */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
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
                        Parcela {p.numero} • Vence {formatarData(p.vencimento)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold num-moeda">
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

      {/* ===== EMPTY STATE: PRIMEIRO USO ===== */}
      {!temDados && (
        <Card className="mt-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <EmptyState
              titulo="Bem-vindo ao seu novo controle financeiro!"
              descricao="Comece registrando sua primeira venda, despesa ou criando um empréstimo. Em poucos cliques seu dashboard ganha vida."
              icone="wallet"
              acao={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild>
                    <Link href="/caixa">
                      <Sparkles className="size-4" />
                      Registrar primeira movimentação
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/emprestimos">Criar empréstimo</Link>
                  </Button>
                </div>
              }
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}
