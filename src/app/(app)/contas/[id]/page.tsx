// ============================================================================
// PÁGINA: DETALHE DA CONTA (/contas/[id]) — upload + conciliação
// ============================================================================

import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ContaDetalheClient } from "@/components/contas/conta-detalhe-client";
import { obterConta, listarExtrato } from "@/app/actions/contas";

export default async function ContaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: conta, error } = await obterConta(id);
  if (error || !conta) notFound();

  const { data: itensNaoConciliados } = await listarExtrato(id, true);
  const { data: todosItens } = await listarExtrato(id, false);

  return (
    <>
      <PageHeader
        titulo={conta.nome}
        descricao="Importar extrato e conciliar lançamentos"
        acoes={
          <Button asChild variant="ghost" size="sm">
            <Link href="/contas">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <ContaDetalheClient
        conta={conta as any}
        itensNaoConciliados={itensNaoConciliados as any}
        totalItens={todosItens?.length || 0}
      />
    </>
  );
}
