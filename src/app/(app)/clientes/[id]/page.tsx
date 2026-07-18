// ============================================================================
// PÁGINA: DETALHES DO CLIENTE (/clientes/[id])
// ============================================================================
// Perfil completo do cliente com abas:
//   - Visão geral (totais)
//   - Empréstimos
//   - Pagamentos recebidos
//   - Mensagens enviadas (cobranças)
//   - Notas / observações

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  HandCoins,
  TrendingUp,
  TrendingDown,
  Wallet,
  MessageCircle,
  Clock,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { NotasSection } from "@/components/notas/notas-section";
import { obterCliente, obterHistoricoCliente } from "@/app/actions/clientes";
import {
  formatarMoeda,
  formatarData,
  formatarTelefone,
} from "@/lib/constants";

export default async function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: cliente, error } = await obterCliente(id);

  if (error || !cliente) notFound();

  const historico = await obterHistoricoCliente(id);
  if ("error" in historico) notFound();

  const {
    emprestimos = [],
    pagamentos = [],
    cobrancas = [],
    totais,
  } = historico as any;

  return (
    <>
      <PageHeader
        titulo={cliente.nome}
        descricao="Perfil completo do cliente"
        acoes={
          <Button asChild variant="ghost" size="sm">
            <Link href="/clientes">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      {/* Card de identificação */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {cliente.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{cliente.nome}</h2>
                {cliente.telefone && (
                  <a
                    href={`tel:${cliente.telefone}`}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                  >
                    <Phone className="size-3.5" />
                    {formatarTelefone(cliente.telefone)}
                  </a>
                )}
              </div>
            </div>
            {cliente.observacoes && (
              <p className="rounded-lg bg-muted/50 p-2 text-sm italic text-muted-foreground">
                “{cliente.observacoes}”
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Cliente desde {formatarData(cliente.created_at)}
            </p>
          </div>

          <Button asChild size="sm">
            <Link href={`/emprestimos?cliente=${id}`}>
              <HandCoins className="size-4" />
              Novo empréstimo
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* 4 cards de resumo financeiro */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Total emprestado</p>
              <HandCoins className="size-4 text-amber-600" />
            </div>
            <p className="num-moeda mt-1 text-xl font-bold text-amber-600">
              {formatarMoeda(totais.totalEmprestado)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Total recebido</p>
              <TrendingUp className="size-4 text-emerald-600" />
            </div>
            <p className="num-moeda mt-1 text-xl font-bold text-emerald-600">
              {formatarMoeda(totais.totalRecebido)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">A receber</p>
              <Wallet className="size-4 text-blue-600" />
            </div>
            <p className="num-moeda mt-1 text-xl font-bold text-blue-600">
              {formatarMoeda(totais.totalAReceber)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Empréstimos</p>
              <TrendingDown className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-1 text-xl font-bold">
              {totais.numEmprestimos}
              <span className="ml-1 text-xs text-muted-foreground">
                ({totais.numAtivos} ativos, {totais.numQuitados} quitados)
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Abas */}
      <Tabs defaultValue="emprestimos">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="emprestimos">
            Empréstimos ({emprestimos.length})
          </TabsTrigger>
          <TabsTrigger value="pagamentos">
            Pagamentos ({pagamentos.length})
          </TabsTrigger>
          <TabsTrigger value="mensagens">
            Mensagens ({cobrancas.length})
          </TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
        </TabsList>

        {/* ABA: EMPRÉSTIMOS */}
        <TabsContent value="emprestimos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Empréstimos do cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {emprestimos.length === 0 ? (
                <EmptyState
                  titulo="Sem empréstimos"
                  descricao="Os empréstimos deste cliente aparecem aqui."
                  icone="hand-coins"
                  compacto
                />
              ) : (
                <ul className="divide-y">
                  {emprestimos.map((emp: any) => (
                    <li
                      key={emp.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <Link
                          href={`/emprestimos/${emp.id}`}
                          className="font-medium hover:underline"
                        >
                          {emp.num_parcelas}x de{" "}
                          {formatarMoeda(emp.valor_parcela || 0)}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          Início {formatarData(emp.data_inicio)} • Total{" "}
                          {formatarMoeda(emp.valor_total || 0)}
                        </p>
                      </div>
                      <Badge
                        className={
                          emp.status === "quitado"
                            ? "bg-emerald-600"
                            : emp.status === "atrasado"
                              ? "bg-rose-600"
                              : ""
                        }
                      >
                        {emp.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: PAGAMENTOS */}
        <TabsContent value="pagamentos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Pagamentos recebidos —{" "}
                {formatarMoeda(totais.totalRecebido)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pagamentos.length === 0 ? (
                <EmptyState
                  titulo="Sem pagamentos registrados"
                  compacto
                  icone="wallet"
                />
              ) : (
                <ul className="divide-y">
                  {pagamentos.map((p: any) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="font-medium">Parcela {p.numero}</p>
                        <p className="text-xs text-muted-foreground">
                          Paga em{" "}
                          {formatarData(p.data_pagamento || p.vencimento)}
                        </p>
                      </div>
                      <span className="num-moeda font-semibold text-emerald-600">
                        +{formatarMoeda(p.valor_pago || p.valor)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: MENSAGENS ENVIADAS */}
        <TabsContent value="mensagens" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Cobranças enviadas ({cobrancas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cobrancas.length === 0 ? (
                <EmptyState
                  titulo="Sem cobranças enviadas"
                  descricao="Quando você enviar um lembrete via WhatsApp, ele aparece aqui."
                  compacto
                  icone="calendar"
                />
              ) : (
                <ul className="space-y-2">
                  {cobrancas.map((c: any) => (
                    <li
                      key={c.id}
                      className="flex items-start gap-3 rounded-lg bg-muted/30 p-3"
                    >
                      <MessageCircle className="size-4 shrink-0 text-emerald-600" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {c.canal}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            {new Date(c.data).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {c.mensagem && (
                          <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground">
                            “{c.mensagem}”
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: NOTAS */}
        <TabsContent value="notas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Notas e observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NotasSection entidadeTipo="cliente" entidadeId={id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
