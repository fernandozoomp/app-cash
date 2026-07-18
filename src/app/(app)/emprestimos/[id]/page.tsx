// ============================================================================
// PÁGINA: DETALHES DO EMPRÉSTIMO (/emprestimos/[id])
// ============================================================================
// Mostra: cards com valores, progresso, tabela de parcelas completa,
// linha do tempo de eventos (criação + pagamentos + cobranças) e notas.

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  HandCoins,
  TrendingUp,
  Wallet,
  CalendarClock,
  User,
  Plus,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotasSection } from "@/components/notas/notas-section";
import { EmprestimoParcelas } from "@/components/emprestimos/emprestimo-parcelas";
import { EmprestimoTimeline } from "@/components/emprestimos/emprestimo-timeline";
import { obterEmprestimo } from "@/app/actions/emprestimos";
import {
  formatarMoeda,
  formatarData,
  formatarTelefone,
  traduzirCategoria,
} from "@/lib/constants";

export default async function EmprestimoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resultado = await obterEmprestimo(id);
  if ("error" in resultado || !resultado.data) notFound();

  const { emprestimo, parcelas } = resultado.data as any;
  const cliente = emprestimo.clientes;

  // Cálculos de progresso
  const pagas = parcelas.filter((p: any) => p.status === "paga").length;
  const parciais = parcelas.filter((p: any) => p.status === "parcial").length;
  const progresso = parcelas.length
    ? Math.round((pagas / parcelas.length) * 100)
    : 0;
  const totalRecebido = parcelas.reduce(
    (s: number, p: any) => s + (Number(p.valor_pago) || 0),
    0,
  );

  return (
    <>
      <PageHeader
        titulo={`${emprestimo.num_parcelas}x de ${formatarMoeda(emprestimo.valor_parcela || 0)}`}
        descricao={`Empréstimo ${emprestimo.sistema_juros === "price" ? "Tabela Price" : "Juros Simples"}`}
        acoes={
          <Button asChild variant="ghost" size="sm">
            <Link href="/emprestimos">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      {/* Card principal: cliente + status + progresso */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <Link
              href={`/clientes/${emprestimo.cliente_id}`}
              className="flex items-center gap-3 hover:opacity-80"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {(cliente?.nome || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="flex items-center gap-1.5 font-semibold">
                  <User className="size-3.5 text-muted-foreground" />
                  {cliente?.nome || "—"}
                </p>
                {cliente?.telefone && (
                  <p className="text-xs text-muted-foreground">
                    {formatarTelefone(cliente.telefone)}
                  </p>
                )}
              </div>
            </Link>
            <Badge
              className={`text-sm ${
                emprestimo.status === "quitado"
                  ? "bg-emerald-600"
                  : emprestimo.status === "atrasado"
                    ? "bg-rose-600"
                    : "bg-amber-500"
              }`}
            >
              {emprestimo.status}
            </Badge>
          </div>

          {/* Barra de progresso */}
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {pagas} de {parcelas.length} parcelas pagas
                {parciais > 0 && ` • ${parciais} parciais`}
              </span>
              <span>{progresso}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4 cards de resumo */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Valor principal</p>
              <HandCoins className="size-4 text-amber-600" />
            </div>
            <p className="num-moeda mt-1 text-xl font-bold">
              {formatarMoeda(emprestimo.valor_principal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Total a pagar</p>
              <Wallet className="size-4 text-blue-600" />
            </div>
            <p className="num-moeda mt-1 text-xl font-bold">
              {formatarMoeda(emprestimo.valor_total || 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              Juros:{" "}
              {formatarMoeda(
                (emprestimo.valor_total || 0) - emprestimo.valor_principal,
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Recebido</p>
              <TrendingUp className="size-4 text-emerald-600" />
            </div>
            <p className="num-moeda mt-1 text-xl font-bold text-emerald-600">
              {formatarMoeda(totalRecebido)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Início</p>
              <CalendarClock className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-1 text-xl font-bold">
              {formatarData(emprestimo.data_inicio)}
            </p>
            <p className="text-xs text-muted-foreground">
              {emprestimo.taxa_juros}% a.m.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Abas */}
      <Tabs defaultValue="parcelas">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="parcelas">
            Parcelas ({parcelas.length})
          </TabsTrigger>
          <TabsTrigger value="timeline">Linha do tempo</TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
        </TabsList>

        {/* ABA: PARCELAS (com pagamentos e cobranças) */}
        <TabsContent value="parcelas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parcelas</CardTitle>
            </CardHeader>
            <CardContent>
              <EmprestimoParcelas
                parcelas={parcelas}
                totalParcelas={emprestimo.num_parcelas}
                nomeCliente={cliente?.nome || "—"}
                telefoneCliente={cliente?.telefone || null}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: TIMELINE */}
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Histórico de eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmprestimoTimeline
                emprestimo={emprestimo}
                parcelas={parcelas}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: NOTAS */}
        <TabsContent value="notas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notas e observações</CardTitle>
            </CardHeader>
            <CardContent>
              <NotasSection entidadeTipo="emprestimo" entidadeId={id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
