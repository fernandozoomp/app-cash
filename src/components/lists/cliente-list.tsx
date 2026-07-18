"use client";

// ============================================================================
// LISTA DE CLIENTES (com editar e excluir)
// ============================================================================

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Loader2, Phone, X } from "lucide-react";

import { apagarCliente } from "@/app/actions/clientes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClienteForm } from "@/components/forms/cliente-form";
import type { Cliente } from "@/lib/types/database";

export function ClienteList({ clientes }: { clientes: Cliente[] }) {
  const [pendente, startTransition] = useTransition();
  const [editando, setEditando] = useState<Cliente | null>(null);

  function handleApagar(id: string, nome: string) {
    if (!confirm(`Apagar o cliente "${nome}"? Esta ação não pode ser desfeita.`))
      return;
    startTransition(async () => {
      const r = await apagarCliente(id);
      if (r.error) toast.error(r.error);
      else toast.success("Cliente apagado.");
    });
  }

  if (clientes.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhum cliente cadastrado ainda.
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y">
        {clientes.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-3 gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{c.nome}</p>
              {c.telefone && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="size-3" />
                  {c.telefone}
                </p>
              )}
              {c.observacoes && (
                <p className="truncate text-xs italic text-muted-foreground">
                  {c.observacoes}
                </p>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditando(c)}
                className="text-muted-foreground hover:text-primary"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleApagar(c.id, c.nome)}
                disabled={pendente}
                className="text-muted-foreground hover:text-rose-600"
              >
                {pendente ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {/* Modal de edição */}
      <Dialog
        open={!!editando}
        onOpenChange={(o) => !o && setEditando(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
            <DialogDescription>
              Altere os dados e clique em atualizar.
            </DialogDescription>
          </DialogHeader>
          <ClienteForm
            clienteEdicao={editando}
            onSuccess={() => setEditando(null)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
