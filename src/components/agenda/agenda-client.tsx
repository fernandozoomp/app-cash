"use client";

// ============================================================================
// AGENDA CLIENT — interatividade da página /agenda
// ============================================================================
// - Busca eventos dinamicamente quando o mês muda (navegação ← →)
// - Mostra bolinhas coloridas no calendário
// - Painel lateral com eventos do dia selecionado
// - Exportar .ics universal

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Download,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { useConfirm } from "@/components/confirm-dialog";
import { CalendarioMensal } from "@/components/agenda/calendario-mensal";
import { DialogNovoEvento } from "@/components/agenda/dialog-novo-evento";
import { infoTipoEvento } from "@/lib/agenda/tipos";
import { gerarICS, baixarICS } from "@/lib/agenda/ics";
import { formatarData } from "@/lib/constants";
import {
  alternarConcluido,
  apagarEvento,
  listarTodosEventesParaExport,
  listarEventosMes,
} from "@/app/actions/agenda";
import type { EventoCalendario } from "@/app/actions/agenda";

interface Props {
  eventosIniciais: EventoCalendario[];
  mesInicial: number;
  anoInicial: number;
}

export function AgendaClient({
  eventosIniciais,
  mesInicial,
  anoInicial,
}: Props) {
  const router = useRouter();
  const confirmar = useConfirm();
  const [pendente, startTransition] = useTransition();
  const [exportando, setExportando] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [novoEvAberto, setNovoEvAberto] = useState(false);
  const [novoEvData, setNovoEvData] = useState<string | undefined>(undefined);

  // Estado do mês visível (controla tanto o calendário quanto a busca)
  const [anoVisivel, setAnoVisivel] = useState(anoInicial);
  const [mesVisivel, setMesVisivel] = useState(mesInicial);
  const [eventos, setEventos] = useState<EventoCalendario[]>(eventosIniciais);
  const [carregandoMes, setCarregandoMes] = useState(false);

  // Busca eventos do mês visível (sempre que muda)
  const buscarEventos = useCallback(async (ano: number, mes: number) => {
    setCarregandoMes(true);
    try {
      const { data } = await listarEventosMes(ano, mes);
      setEventos(data || []);
    } catch {
      // Erro silencioso — mantém eventos atuais
    } finally {
      setCarregandoMes(false);
    }
  }, []);

  // Callback quando o usuário navega de mês no calendário
  function handleMudancaMes(novoAno: number, novoMes: number) {
    setAnoVisivel(novoAno);
    setMesVisivel(novoMes);
    setDiaSelecionado(null);
    buscarEventos(novoAno, novoMes);
  }

  // Atualiza eventos após criar/apagar/concluir (refresh da página reexecuta)
  useEffect(() => {
    // Re-busca quando o mês visível muda
    buscarEventos(anoVisivel, mesVisivel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Eventos do dia selecionado
  const eventosDia = diaSelecionado
    ? eventos.filter((e) => e.data === diaSelecionado)
    : [];

  function handleSelecionarDia(dataISO: string) {
    setDiaSelecionado((d) => (d === dataISO ? null : dataISO));
  }

  function handleNovoEvento(data?: string) {
    setNovoEvData(data);
    setNovoEvAberto(true);
  }

  function handleAlternar(ev: EventoCalendario) {
    // Só eventos manuais podem ser concluídos (vencimentos são automáticos)
    if (ev.origem !== "manual") return;
    startTransition(async () => {
      const r = await alternarConcluido(ev.id);
      if (r.error) toast.error(r.error);
      else router.refresh();
    });
  }

  async function handleApagar(ev: EventoCalendario) {
    if (ev.origem !== "manual") return;
    const ok = await confirmar({
      titulo: "Apagar evento?",
      descricao: `"${ev.titulo}" será removido.`,
      textoConfirmar: "Apagar",
      perigoso: true,
    });
    if (!ok) return;

    startTransition(async () => {
      const r = await apagarEvento(ev.id);
      if (r.error) toast.error(r.error);
      else {
        toast.success("Evento apagado.");
        router.refresh();
      }
    });
  }

  async function handleExportar() {
    setExportando(true);
    try {
      const { data } = await listarTodosEventesParaExport();
      if (data.length === 0) {
        toast.info("Sem eventos para exportar nos próximos 90 dias.");
        return;
      }
      const ics = gerarICS(data);
      baixarICS(ics);
      toast.success(`${data.length} eventos exportados!`, {
        description: "Abra o arquivo no Google Calendar, Outlook ou Apple.",
      });
    } catch {
      toast.error("Erro ao exportar.");
    } finally {
      setExportando(false);
    }
  }

  return (
    <>
      {/* Barra de ações */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Button onClick={() => handleNovoEvento()}>
          <Plus className="size-4" />
          Novo evento
        </Button>
        <Button
          variant="outline"
          onClick={handleExportar}
          disabled={exportando}
        >
          {exportando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Exportar calendário (.ics)
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Calendário (ocupa 2 colunas no desktop) */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <CalendarioMensal
                eventos={eventos}
                onSelecionarDia={handleSelecionarDia}
                diaSelecionado={diaSelecionado || undefined}
                mesInicial={mesVisivel}
                anoInicial={anoVisivel}
                onMudancaMes={handleMudancaMes}
              />
            </CardContent>
          </Card>

          {/* Legenda expandida com todos os tipos */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-rose-500" /> Vencimento
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500" /> Pagamento
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-amber-500" /> Follow-up
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-blue-500" /> Reunião
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-slate-400" /> Empréstimo/Outros
            </span>
          </div>
        </div>

        {/* Painel lateral: eventos do dia selecionado */}
        <div>
          <Card className="h-full">
            <CardContent className="pt-6">
              {diaSelecionado ? (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold capitalize">
                      {formatarData(diaSelecionado)}
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleNovoEvento(diaSelecionado)}
                    >
                      <Plus className="size-3.5" />
                      Add
                    </Button>
                  </div>

                  {eventosDia.length === 0 ? (
                    <EmptyState
                      titulo="Sem eventos neste dia"
                      descricao="Crie um evento para este dia."
                      icone="calendar"
                      compacto
                    />
                  ) : (
                    <ul className="space-y-2">
                      {eventosDia.map((ev) => {
                        const info = infoTipoEvento(ev.tipo);
                        return (
                          <li
                            key={ev.id}
                            className={`group rounded-lg border p-3 ${
                              ev.concluido ? "opacity-60" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <button
                                onClick={() => handleAlternar(ev)}
                                disabled={ev.origem !== "manual"}
                                className="mt-0.5 shrink-0"
                                aria-label="Alternar concluído"
                              >
                                {ev.concluido ? (
                                  <CheckCircle2 className="size-4 text-emerald-600" />
                                ) : (
                                  <Circle className="size-4 text-muted-foreground hover:text-emerald-600" />
                                )}
                              </button>
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`text-sm font-medium ${
                                    ev.concluido ? "line-through" : ""
                                  }`}
                                >
                                  {ev.titulo}
                                </p>
                                {ev.descricao && (
                                  <p className="text-xs text-muted-foreground">
                                    {ev.descricao}
                                  </p>
                                )}
                                <div className="mt-1 flex items-center gap-2">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${info.corBadge}`}
                                  >
                                    {info.label}
                                  </span>
                                  {ev.hora && (
                                    <span className="text-xs text-muted-foreground">
                                      {ev.hora}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {ev.origem === "manual" && (
                                <button
                                  onClick={() => handleApagar(ev)}
                                  disabled={pendente}
                                  className="text-muted-foreground opacity-0 transition-opacity hover:text-rose-600 group-hover:opacity-100"
                                  aria-label="Apagar"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              ) : (
                <EmptyState
                  titulo="Selecione um dia"
                  descricao="Toque em qualquer dia do calendário para ver os eventos."
                  icone="calendar"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de novo evento */}
      {novoEvAberto && (
        <DialogNovoEvento
          aberto={novoEvAberto}
          onFechar={() => setNovoEvAberto(false)}
          dataInicial={novoEvData}
        />
      )}
    </>
  );
}
