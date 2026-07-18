// ============================================================================
// PÁGINA: EMPRÉSTIMOS
// ============================================================================

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmprestimoForm } from "@/components/forms/emprestimo-form";
import { EmprestimoList } from "@/components/lists/emprestimo-list";
import { listarClientes } from "@/app/actions/clientes";
import { listarEmprestimosComParcelas } from "@/app/actions/emprestimos";

export default async function EmprestimosPage() {
  const [{ data: clientes }, { data: emprestimos }] = await Promise.all([
    listarClientes(),
    listarEmprestimosComParcelas(),
  ]);

  const ativos = emprestimos.filter((e: any) => e.status === "ativo").length;
  const quitados = emprestimos.filter((e: any) => e.status === "quitado").length;

  return (
    <>
      <PageHeader
        titulo="Empréstimos"
        descricao="Controle de empréstimos, parcelas e vencimentos"
      />

      {/* Resumo */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="mt-1 text-xl font-bold">{emprestimos.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ativos</p>
            <p className="mt-1 text-xl font-bold text-amber-600">{ativos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Quitados</p>
            <p className="mt-1 text-xl font-bold text-emerald-600">{quitados}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Novo Empréstimo</CardTitle>
            <CardDescription>
              Calcule parcelas automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmprestimoForm clientes={clientes as any} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Empréstimos</CardTitle>
            <CardDescription>
              Clique em um para ver as parcelas e receber
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmprestimoList emprestimos={emprestimos as any} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
