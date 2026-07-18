"use client";

// ============================================================================
// NOTAS SECTION — bloco reutilizável de notas em qualquer entidade
// ============================================================================
// Uso: <NotasSection entidadeTipo="cliente" entidadeId={cliente.id} />
// Renderiza: formulário inline + lista de notas com botão apagar.

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Trash2,
  StickyNote,
  Bell,
  AlertTriangle,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { useConfirm } from "@/components/confirm-dialog";
import {
  listarNotas,
  criarNota,
  apagarNota,
} from "@/app/actions/notas";
import type { EntidadeNota, TipoNota, Nota } from "@/lib/types/database";

const TIPOS: Array<{
  valor: TipoNota;
  label: string;
  icone: typeof StickyNote;
  cor: string;
}> = [
  { valor: "nota", label: "Nota", icone: StickyNote, cor: "bg-blue-100 text-blue-700" },
  { valor: "lembrete", label: "Lembrete", icone: Bell, cor: "bg-amber-100 text-amber-700" },
  { valor: "alerta", label: "Alerta", icone: AlertTriangle, cor: "bg-rose-100 text-rose-700" },
];

function infoTipo(tipo: TipoNota) {
  return TIPOS.find((t) => t.valor === tipo) || TIPOS[0];
}

function formatarDataRelativa(dataISO: string): string {
  const data = new Date(dataISO);
  const agora = new Date();
  const diffMs = agora.getTime() - data.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMin / 60);
  const diffDias = Math.floor(diffHoras / 24);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin}min`;
  if (diffHoras < 24) return `há ${diffHoras}h`;
  if (diffDias === 1) return "ontem";
  if (diffDias < 7) return `há ${diffDias} dias`;
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  entidadeTipo: EntidadeNota;
  entidadeId: string;
}

export function NotasSection({ entidadeTipo, entidadeId }: Props) {
  const router = useRouter();
  const confirmar = useConfirm();
  const [pendente, startTransition] = useTransition();
  const [carregando, setCarregando] = useState(true);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [conteudo, setConteudo] = useState("");
  const [tipo, setTipo] = useState<TipoNota>("nota");

  useEffect(() => {
    carregar();
  }, [entidadeTipo, entidadeId]);

  function carregar() {
    setCarregando(true);
    listarNotas(entidadeTipo, entidadeId).then((r) => {
      setNotas((r.data || []) as Nota[]);
      setCarregando(false);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!conteudo.trim()) {
      toast.error("Digite algo na nota.");
      return;
    }

    startTransition(async () => {
      const r = await criarNota({
        entidade_tipo: entidadeTipo,
        entidade_id: entidadeId,
        conteudo,
        tipo,
      });
      if (r.error) {
        toast.error(r.error);
        return;
      }
      setConteudo("");
      setTipo("nota");
      toast.success("Nota adicionada!");
      carregar();
      router.refresh();
    });
  }

  async function handleApagar(nota: Nota) {
    const ok = await confirmar({
      titulo: "Apagar esta nota?",
      descricao: "Esta ação não pode ser desfeita.",
      textoConfirmar: "Apagar",
      perigoso: true,
    });
    if (!ok) return;

    startTransition(async () => {
      const r = await apagarNota(nota.id);
      if (r.error) {
        toast.error(r.error);
      } else {
        toast.success("Nota apagada.");
        carregar();
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Formulário inline */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Seletor de tipo */}
        <div className="flex gap-1.5">
          {TIPOS.map((t) => {
            const Icone = t.icone;
            return (
              <button
                key={t.valor}
                type="button"
                onClick={() => setTipo(t.valor)}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  tipo === t.valor
                    ? t.cor + " ring-2 ring-offset-1 ring-current"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                <Icone className="size-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Textarea + botão */}
        <div className="flex gap-2">
          <textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Escreva uma anotação, lembrete ou alerta..."
            className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            type="submit"
            disabled={pendente || !conteudo.trim()}
            className="shrink-0"
          >
            {pendente ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
          </Button>
        </div>
        <p className="text-right text-xs text-muted-foreground">
          {conteudo.length}/2000
        </p>
      </form>

      {/* Lista de notas */}
      {carregando ? (
        <div className="flex justify-center py-4">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : notas.length === 0 ? (
        <EmptyState
          titulo="Sem anotações ainda"
          descricao="Use este espaço para lembretes, acordos e observações importantes."
          icone="calendar"
          compacto
        />
      ) : (
        <ul className="space-y-2">
          {notas.map((nota) => {
            const info = infoTipo(nota.tipo);
            const Icone = info.icone;
            return (
              <li
                key={nota.id}
                className="group rounded-lg border bg-card p-3 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex size-6 items-center justify-center rounded-full ${info.cor}`}
                    >
                      <Icone className="size-3.5" />
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatarDataRelativa(nota.created_at)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleApagar(nota)}
                    disabled={pendente}
                    aria-label="Apagar nota"
                    className="text-muted-foreground opacity-0 transition-opacity hover:text-rose-600 group-hover:opacity-100"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{nota.conteudo}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
