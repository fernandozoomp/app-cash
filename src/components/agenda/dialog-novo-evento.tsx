"use client";

// ============================================================================
// DIALOG: NOVO EVENTO DE AGENDA
// ============================================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { criarEvento } from "@/app/actions/agenda";
import { TIPOS_EVENTO_LISTA } from "@/lib/agenda/tipos";
import type { TipoEvento } from "@/lib/types/database";

interface Props {
  aberto: boolean;
  onFechar: () => void;
  dataInicial?: string; // YYYY-MM-DD (quando cria a partir de um dia clicado)
}

export function DialogNovoEvento({ aberto, onFechar, dataInicial }: Props) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState(
    dataInicial || new Date().toISOString().slice(0, 10),
  );
  const [hora, setHora] = useState("");
  const [tipo, setTipo] = useState<TipoEvento>("followup");
  const [descricao, setDescricao] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error("Digite um título.");
      return;
    }

    startTransition(async () => {
      const r = await criarEvento({
        titulo,
        data,
        hora: hora || undefined,
        tipo,
        descricao: descricao || undefined,
      });
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Evento criado!");
      setTitulo("");
      setDescricao("");
      setHora("");
      onFechar();
      router.refresh();
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo evento</DialogTitle>
          <DialogDescription>
            Crie um lembrete, follow-up ou compromisso
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ev-titulo">Título *</Label>
            <Input
              id="ev-titulo"
              placeholder="Ex: Cobrar João sobre parcela atrasada"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ev-data">Data *</Label>
              <Input
                id="ev-data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-hora">Hora (opcional)</Label>
              <Input
                id="ev-hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={tipo}
              onValueChange={(v) => setTipo(v as TipoEvento)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_EVENTO_LISTA.map((t) => (
                  <SelectItem key={t.valor} value={t.valor}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ev-desc">Descrição (opcional)</Label>
            <Input
              id="ev-desc"
              placeholder="Anotações sobre o evento"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={onFechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pendente}>
              {pendente ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Plus className="size-4" />
                  Criar evento
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
