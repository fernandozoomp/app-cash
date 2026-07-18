// ============================================================================
// PÁGINA: CONTAS BANCÁRIAS — lista e criação
// ============================================================================

import { Plus, Building2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ContasListaClient } from "@/components/contas/contas-lista-client";
import { listarContas } from "@/app/actions/contas";

export default async function ContasPage() {
  const { data: contas } = await listarContas();

  return (
    <>
      <PageHeader
        titulo="Contas Bancárias"
        descricao="Cadastre suas contas e concilie extratos"
      />

      {contas.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              titulo="Nenhuma conta cadastrada"
              descricao="Cadastre sua primeira conta bancária para importar extratos e fazer conciliação."
              icone="wallet"
              acao={<ContasListaClient contas={[]} />}
            />
          </CardContent>
        </Card>
      ) : (
        <ContasListaClient contas={contas as any} />
      )}
    </>
  );
}
