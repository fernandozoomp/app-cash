// ============================================================================
// PÁGINA: ADEGA
// ============================================================================
// Para o controle da adega, recomendamos usar o módulo de Caixa com a
// categoria "venda" e empreendimento "adega". Aqui mostramos um resumo
// específico da adega, com atalho para lançar vendas no caixa.

import Link from "next/link";
import { Wine, ArrowRight, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatarMoeda, formatarData, traduzirCategoria } from "@/lib/constants";

export default async function AdegaPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Buscar transações da adega
  const { data: transacoes } = await supabase
    .from("transacoes")
    .select("*")
    .eq("empreendimento", "adega")
    .order("data", { ascending: false })
    .limit(20);

  const entradas = (transacoes || [])
    .filter((t: any) => t.tipo === "entrada")
    .reduce((s: number, t: any) => s + Number(t.valor), 0);
  const saidas = (transacoes || [])
    .filter((t: any) => t.tipo === "saida")
    .reduce((s: number, t: any) => s + Number(t.valor), 0);
  const lucro = entradas - saidas;

  return (
    <>
      <PageHeader
        titulo="Adega"
        descricao="Vendas e despesas da adega"
        acoes={
          <Button asChild>
            <Link href="/caixa">
              <ShoppingBag className="size-4" />
              Lançar venda
            </Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Vendas</p>
            <p className="mt-1 text-xl font-bold text-emerald-600">
              {formatarMoeda(entradas)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Despesas</p>
            <p className="mt-1 text-xl font-bold text-rose-600">
              {formatarMoeda(saidas)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Lucro</p>
            <p
              className={`mt-1 text-xl font-bold ${
                lucro >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {formatarMoeda(lucro)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimentações Recentes</CardTitle>
          <CardDescription>Últimas 20 operações da adega</CardDescription>
        </CardHeader>
        <CardContent>
          {(transacoes || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Wine className="size-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nenhuma venda registrada ainda.
              </p>
              <Button asChild variant="outline">
                <Link href="/caixa">
                  Registrar primeira venda
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {(transacoes || []).map((t: any) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-medium">
                      {traduzirCategoria(t.categoria)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatarData(t.data)}
                      {t.descricao ? ` • ${t.descricao}` : ""}
                    </p>
                  </div>
                  <span
                    className={`font-semibold ${
                      t.tipo === "entrada"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {t.tipo === "entrada" ? "+" : "−"}
                    {formatarMoeda(t.valor)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
