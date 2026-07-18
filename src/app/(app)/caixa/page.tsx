// ============================================================================
// PÁGINA: FLUXO DE CAIXA
// ============================================================================
// Apenas lançamento manual e listagem. A importação em lote (CSV) ficou em
// sua própria página /importar, pois agora suporta 4 tipos diferentes.

import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransacaoForm } from "@/components/forms/transacao-form";
import { TransacaoList } from "@/components/lists/transacao-list";
import { listarTransacoes } from "@/app/actions/caixa";

export default async function CaixaPage() {
  const { data: transacoes } = await listarTransacoes({ limite: 100 });

  // Calcular totais do dia
  const hoje = new Date().toISOString().slice(0, 10);
  const transacoesHoje = transacoes.filter((t: any) => t.data === hoje);
  const entradasHoje = transacoesHoje
    .filter((t: any) => t.tipo === "entrada")
    .reduce((s: number, t: any) => s + Number(t.valor), 0);
  const saidasHoje = transacoesHoje
    .filter((t: any) => t.tipo === "saida")
    .reduce((s: number, t: any) => s + Number(t.valor), 0);
  const saldoHoje = entradasHoje - saidasHoje;

  const fmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <>
      <PageHeader
        titulo="Fluxo de Caixa"
        descricao="Entradas e saídas de dinheiro"
        acoes={
          <Button asChild variant="outline" size="sm">
            <Link href="/importar">
              <PlusCircle className="size-4" />
              Importar planilha
            </Link>
          </Button>
        }
      />

      {/* Resumo do dia */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Entradas hoje</p>
            <p className="num-moeda mt-1 text-xl font-bold text-emerald-600">
              {fmt.format(entradasHoje)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Saídas hoje</p>
            <p className="num-moeda mt-1 text-xl font-bold text-rose-600">
              {fmt.format(saidasHoje)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Saldo do dia</p>
            <p
              className={`num-moeda mt-1 text-xl font-bold ${
                saldoHoje >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {fmt.format(saldoHoje)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Adicionar movimentação</CardTitle>
            <CardDescription>
              Registre uma entrada ou saída na hora
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransacaoForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Movimentações recentes</CardTitle>
            <CardDescription>
              {transacoes.length} lançamento(s) no total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransacaoList transacoes={transacoes as any} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
