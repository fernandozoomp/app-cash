// ============================================================================
// PÁGINA: RELATÓRIOS
// ============================================================================
// Mostra um resumo financeiro dos últimos 6 meses e por categoria.

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatarMoeda, EMPREENDIMENTOS } from "@/lib/constants";

export default async function RelatoriosPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Buscar todas as transações
  const { data: transacoes } = await supabase
    .from("transacoes")
    .select("*")
    .order("data", { ascending: false });

  // Agrupar por mês
  const porMes: Record<string, { entrada: number; saida: number }> = {};
  for (const t of transacoes || []) {
    const mes = (t.data as string).slice(0, 7); // YYYY-MM
    if (!porMes[mes]) porMes[mes] = { entrada: 0, saida: 0 };
    if (t.tipo === "entrada") porMes[mes].entrada += Number(t.valor);
    else porMes[mes].saida += Number(t.valor);
  }

  const meses = Object.entries(porMes)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6);

  // Agrupar por empreendimento
  const porEmpreendimento = {
    adega: { entrada: 0, saida: 0 },
    emprestimos: { entrada: 0, saida: 0 },
    sucatas: { entrada: 0, saida: 0 },
  };
  for (const t of transacoes || []) {
    const emp = t.empreendimento as keyof typeof porEmpreendimento;
    if (t.tipo === "entrada") porEmpreendimento[emp].entrada += Number(t.valor);
    else porEmpreendimento[emp].saida += Number(t.valor);
  }

  // Nome do mês em português
  const nomeMes = (yyyymm: string) => {
    const [ano, mes] = yyyymm.split("-");
    const data = new Date(parseInt(ano), parseInt(mes) - 1, 1);
    return data.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      <PageHeader
        titulo="Relatórios"
        descricao="Análise dos últimos 6 meses"
      />

      {/* Por mês */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Histórico Mensal</CardTitle>
          <CardDescription>Entradas e saídas por mês</CardDescription>
        </CardHeader>
        <CardContent>
          {meses.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sem dados ainda. Comece a registrar suas movimentações!
            </p>
          ) : (
            <div className="space-y-4">
              {meses.map(([mes, valores]) => {
                const saldo = valores.entrada - valores.saida;
                const max = Math.max(valores.entrada, valores.saida, 1);
                return (
                  <div key={mes}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">
                        {nomeMes(mes)}
                      </span>
                      <span
                        className={
                          saldo >= 0 ? "text-emerald-600" : "text-rose-600"
                        }
                      >
                        Saldo: {formatarMoeda(saldo)}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-emerald-600">Entradas</span>
                        <div className="flex-1 rounded bg-muted">
                          <div
                            className="h-4 rounded bg-emerald-500"
                            style={{
                              width: `${(valores.entrada / max) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-20 text-right">
                          {formatarMoeda(valores.entrada)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-rose-600">Saídas</span>
                        <div className="flex-1 rounded bg-muted">
                          <div
                            className="h-4 rounded bg-rose-500"
                            style={{
                              width: `${(valores.saida / max) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-20 text-right">
                          {formatarMoeda(valores.saida)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Por empreendimento */}
      <Card>
        <CardHeader>
          <CardTitle>Por Empreendimento</CardTitle>
          <CardDescription>Total acumulado de cada negócio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(
              Object.keys(porEmpreendimento) as Array<
                keyof typeof porEmpreendimento
              >
            ).map((emp) => {
              const v = porEmpreendimento[emp];
              const lucro = v.entrada - v.saida;
              return (
                <div key={emp} className="rounded-md border p-3">
                  <p className="font-medium">
                    {EMPREENDIMENTOS[emp].label}
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Entradas</p>
                      <p className="font-semibold text-emerald-600">
                        {formatarMoeda(v.entrada)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Saídas</p>
                      <p className="font-semibold text-rose-600">
                        {formatarMoeda(v.saida)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Líquido</p>
                      <p
                        className={`font-semibold ${
                          lucro >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {formatarMoeda(lucro)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
