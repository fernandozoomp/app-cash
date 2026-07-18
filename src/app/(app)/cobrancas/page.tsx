// ============================================================================
// PÁGINA: COBRANÇAS — rotina operacional de cobrança
// ============================================================================
// Mostra todas as parcelas pendentes/atrasadas/parciais em um tabelão
// com botões de WhatsApp, pagamento e histórico.

import { AlertTriangle, CalendarClock, HandCoins, Wallet, Sparkles } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TabelaCobrancas } from "@/components/cobranca/tabela-cobrancas";
import { listarCobrancasPendentes } from "@/app/actions/cobrancas";
import { formatarMoeda } from "@/lib/constants";

function diasAteVencimento(dataISO: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const v = new Date(dataISO + "T00:00:00");
  return Math.floor((v.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function CobrancasPage() {
  const { data: parcelas } = await listarCobrancasPendentes();

  // Métricas para o resumo no topo
  const atrasadas = parcelas.filter((p) => diasAteVencimento(p.vencimento) < 0);
  const vencemHoje = parcelas.filter(
    (p) => diasAteVencimento(p.vencimento) === 0,
  );
  // totalAReceber: soma do saldo devedor de cada parcela
  // (valor_total - valor_pago). Usamos Number() para converter null/undefined
  // em 0 com segurança (defesa contra dados antigos sem valor_pago).
  const totalAReceber = parcelas.reduce((s, p) => {
    const valor = Number(p.valor) || 0;
    const pago = Number(p.valor_pago) || 0;
    return s + Math.max(0, valor - pago);
  }, 0);

  return (
    <>
      <PageHeader
        titulo="Cobranças"
        descricao="Rotina diária de lembretes e pagamentos"
        acoes={
          <Button asChild variant="outline" size="sm">
            <Link href="/cobrancas/templates">
              <Sparkles className="size-4" />
              Gerenciar templates
            </Link>
          </Button>
        }
      />

      {/* Resumo: 4 mini cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className={
            atrasadas.length > 0
              ? "border-rose-300 bg-rose-50/50"
              : "border-muted/60"
          }
        >
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs text-muted-foreground">Atrasadas</p>
              <p className="num-moeda mt-1 text-2xl font-bold text-rose-600">
                {atrasadas.length}
              </p>
            </div>
            <AlertTriangle className="size-8 text-rose-300" />
          </CardContent>
        </Card>

        <Card
          className={
            vencemHoje.length > 0
              ? "border-amber-300 bg-amber-50/50"
              : "border-muted/60"
          }
        >
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs text-muted-foreground">Vencem hoje</p>
              <p className="num-moeda mt-1 text-2xl font-bold text-amber-600">
                {vencemHoje.length}
              </p>
            </div>
            <CalendarClock className="size-8 text-amber-300" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs text-muted-foreground">A receber</p>
              <p className="num-moeda mt-1 text-2xl font-bold text-emerald-600">
                {formatarMoeda(totalAReceber)}
              </p>
            </div>
            <Wallet className="size-8 text-emerald-300" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs text-muted-foreground">Pendentes total</p>
              <p className="num-moeda mt-1 text-2xl font-bold">
                {parcelas.length}
              </p>
            </div>
            <HandCoins className="size-8 text-muted-foreground/30" />
          </CardContent>
        </Card>
      </div>

      {/* Aviso destacado quando há atrasadas */}
      {atrasadas.length > 0 && (
        <Card className="mb-6 border-rose-300 bg-rose-50/40">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="size-5 shrink-0 text-rose-600" />
            <p className="text-sm text-rose-900">
              <strong>{atrasadas.length} parcela(s) em atraso.</strong>{" "}
              Comece a cobrança por estas — clique em "Cobrar" para enviar
              lembrete via WhatsApp.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabela principal */}
      <TabelaCobrancas parcelas={parcelas} />
    </>
  );
}
