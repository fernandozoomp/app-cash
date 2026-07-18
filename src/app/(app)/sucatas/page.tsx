// ============================================================================
// PÁGINA: SUCATAS — COMPRA E VENDA POR PESO
// ============================================================================

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SucataForm } from "@/components/forms/sucata-form";
import { SucataList } from "@/components/lists/sucata-list";
import { listarSucatas } from "@/app/actions/sucatas";
import { formatarMoeda } from "@/lib/constants";

export default async function SucatasPage() {
  const { data: itens } = await listarSucatas();

  // Calcular lucro
  const totalCompras = itens
    .filter((s: any) => s.tipo === "compra")
    .reduce((s: number, x: any) => s + Number(x.valor_total), 0);
  const totalVendas = itens
    .filter((s: any) => s.tipo === "venda")
    .reduce((s: number, x: any) => s + Number(x.valor_total), 0);
  const lucro = totalVendas - totalCompras;

  return (
    <>
      <PageHeader
        titulo="Sucatas"
        descricao="Compra e venda de materiais por peso"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Comprado</p>
            <p className="mt-1 text-xl font-bold text-rose-600">
              {formatarMoeda(totalCompras)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Vendido</p>
            <p className="mt-1 text-xl font-bold text-emerald-600">
              {formatarMoeda(totalVendas)}
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nova Movimentação</CardTitle>
            <CardDescription>Registre compra ou venda</CardDescription>
          </CardHeader>
          <CardContent>
            <SucataForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
            <CardDescription>{itens.length} movimentação(ões)</CardDescription>
          </CardHeader>
          <CardContent>
            <SucataList itens={itens as any} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
