"use client";

// ============================================================================
// CALENDÁRIO MENSAL VISUAL
// ============================================================================
// Grid 7 colunas × 5-6 linhas. Cada dia mostra bolinhas coloridas dos eventos.
// Clica num dia → seleciona e mostra detalhes no painel lateral.
// Setas ← → mudam de mês.

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { infoTipoEvento } from "@/lib/agenda/tipos";
import type { EventoCalendario } from "@/app/actions/agenda";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

interface Props {
  eventos: EventoCalendario[];
  onSelecionarDia: (dataISO: string) => void;
  diaSelecionado?: string;
  // Controle de mês/ano: o componente é "controlado" pelo pai, que decide
  // qual mês mostrar (e faz a busca de eventos quando muda).
  mesInicial?: number;
  anoInicial?: number;
  onMudancaMes?: (ano: number, mes: number) => void;
}

export function CalendarioMensal({
  eventos,
  onSelecionarDia,
  diaSelecionado,
  mesInicial,
  anoInicial,
  onMudancaMes,
}: Props) {
  const hoje = new Date();
  // Se o pai controla mes/ano, usamos esses valores. Senão, estado interno.
  const ano = anoInicial ?? hoje.getFullYear();
  const mes = mesInicial ?? hoje.getMonth();

  // Agrupa eventos por data (YYYY-MM-DD)
  const eventosPorDia = useMemo(() => {
    const mapa: Record<string, EventoCalendario[]> = {};
    for (const ev of eventos) {
      if (!mapa[ev.data]) mapa[ev.data] = [];
      mapa[ev.data].push(ev);
    }
    return mapa;
  }, [eventos]);

  // Gera a grade de dias do mês
  const dias = useMemo(() => {
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const numDias = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay();

    const grade: Array<{ dia: number; dataISO: string } | null> = [];

    // Espaços vazios antes do dia 1
    for (let i = 0; i < diaSemanaInicio; i++) {
      grade.push(null);
    }

    // Dias do mês
    for (let d = 1; d <= numDias; d++) {
      const dataISO = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      grade.push({ dia: d, dataISO });
    }

    return grade;
  }, [ano, mes]);

  function mesAnterior() {
    if (onMudancaMes) {
      const novoMes = mes === 0 ? 11 : mes - 1;
      const novoAno = mes === 0 ? ano - 1 : ano;
      onMudancaMes(novoAno, novoMes);
      return;
    }
  }

  function proximoMes() {
    if (onMudancaMes) {
      const novoMes = mes === 11 ? 0 : mes + 1;
      const novoAno = mes === 11 ? ano + 1 : ano;
      onMudancaMes(novoAno, novoMes);
      return;
    }
  }

  const hojeStr = hoje.toISOString().slice(0, 10);

  return (
    <div>
      {/* Cabeçalho: navegação de mês */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {MESES[mes]} <span className="text-muted-foreground">{ano}</span>
        </h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={mesAnterior} aria-label="Mês anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={proximoMes} aria-label="Próximo mês">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Grade do calendário */}
      <div className="grid grid-cols-7 gap-1">
        {/* Cabeçalho dos dias da semana */}
        {DIAS_SEMANA.map((d) => (
          <div
            key={d}
            className="pb-2 text-center text-xs font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}

        {/* Dias */}
        {dias.map((d, i) => {
          if (!d) return <div key={`vazio-${i}`} className="min-h-[80px]" />;

          const evsDoDia = eventosPorDia[d.dataISO] || [];
          const isHoje = d.dataISO === hojeStr;
          const isSelecionado = d.dataISO === diaSelecionado;
          const temVencimento = evsDoDia.some((e) => e.tipo === "vencimento");

          return (
            <button
              key={d.dataISO}
              onClick={() => onSelecionarDia(d.dataISO)}
              className={`min-h-[80px] rounded-lg border p-1.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/30 ${
                isSelecionado
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : isHoje
                    ? "border-primary/60 bg-primary/5"
                    : "border-muted"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    isHoje ? "text-primary" : ""
                  }`}
                >
                  {d.dia}
                </span>
                {temVencimento && evsDoDia.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {evsDoDia.length}
                  </span>
                )}
              </div>

              {/* Bolinhas de eventos */}
              <div className="mt-1 flex flex-wrap gap-0.5">
                {evsDoDia.slice(0, 4).map((ev) => {
                  const info = infoTipoEvento(ev.tipo);
                  return (
                    <span
                      key={ev.id}
                      className={`size-2 rounded-full ${info.corBolinha}`}
                      title={ev.titulo}
                    />
                  );
                })}
                {evsDoDia.length > 4 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{evsDoDia.length - 4}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
