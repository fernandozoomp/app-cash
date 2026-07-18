// ============================================================================
// PÁGINA: CLIENTES — CRUD COMPLETO
// ============================================================================

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClienteForm } from "@/components/forms/cliente-form";
import { ClienteList } from "@/components/lists/cliente-list";
import { listarClientes } from "@/app/actions/clientes";

export default async function ClientesPage() {
  const { data: clientes } = await listarClientes();

  return (
    <>
      <PageHeader
        titulo="Clientes"
        descricao="Cadastro de quem pega empréstimo"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Novo Cliente</CardTitle>
            <CardDescription>Cadastre um novo cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <ClienteForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes Cadastrados</CardTitle>
            <CardDescription>
              {clientes.length} cliente(s) no total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClienteList clientes={clientes as any} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
