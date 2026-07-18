// ============================================================================
// PÁGINA: AGENDA — calendário visual com vencimentos e eventos
// ============================================================================

import { PageHeader } from "@/components/page-header";
import { AgendaClient } from "@/components/agenda/agenda-client";
import { listarEventosMes } from "@/app/actions/agenda";

export default async function AgendaPage() {
  const hoje = new Date();
  const { data: eventos } = await listarEventosMes(
    hoje.getFullYear(),
    hoje.getMonth(),
  );

  return (
    <>
      <PageHeader
        titulo="Agenda"
        descricao="Vencimentos, follow-ups e compromissos"
      />
      <AgendaClient
        eventosIniciais={eventos}
        mesInicial={hoje.getMonth()}
        anoInicial={hoje.getFullYear()}
      />
    </>
  );
}
