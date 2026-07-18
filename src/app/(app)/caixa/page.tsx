// ============================================================================
// PÁGINA: FLUXO DE CAIXA
// ============================================================================
// Server Component. Agora com:
// - Resumo do dia
// - Formulário de lançamento manual
// - Upload de CSV (extrato bancário)
// - Lista de transações recentes

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TransacaoForm } from "@/components/forms/transacao-form";
import { TransacaoList } from "@/components/lists/transacao-list";
import { CSVUpload } from "@/components/forms/csv-upload";
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
        descricao="Entradas, saídas e importação de extrato"
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
        {/* Coluna 1: Lançar (manual ou CSV) */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar movimentação</CardTitle>
            <CardDescription>
              Registre na hora ou importe um extrato
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="manual">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">
                  <PlusCircle className="size-4" />
                  Manual
                </TabsTrigger>
                <TabsTrigger value="csv">
                  <Upload className="size-4" />
                  Importar CSV
                </TabsTrigger>
              </TabsList>
              <TabsContent value="manual" className="mt-4">
                <TransacaoForm />
              </TabsContent>
              <TabsContent value="csv" className="mt-4">
                <CSVUpload />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Coluna 2: Lista de transações */}
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
