// ============================================================================
// PÁGINA: FLUXO DE CAIXA
// ============================================================================
// Server Component. Mostra o formulário de lançamento e a lista de
// transações recentes.

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  return (
    <>
      <PageHeader
        titulo="Fluxo de Caixa"
        descricao="Registre entradas e saídas de dinheiro"
      />

      {/* Resumo do dia */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Entradas hoje</p>
            <p className="mt-1 text-xl font-bold text-emerald-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(entradasHoje)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Saídas hoje</p>
            <p className="mt-1 text-xl font-bold text-rose-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(saidasHoje)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Saldo do dia</p>
            <p
              className={`mt-1 text-xl font-bold ${
                saldoHoje >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(saldoHoje)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Coluna 1: Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Novo Lançamento</CardTitle>
            <CardDescription>
              Registre uma entrada ou saída de dinheiro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransacaoForm />
          </CardContent>
        </Card>

        {/* Coluna 2: Lista */}
        <Card>
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
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
