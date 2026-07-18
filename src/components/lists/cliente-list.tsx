"use client";

// ============================================================================
// LISTA DE CLIENTES (com editar e excluir elegante)
// ============================================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Loader2, Phone } from "lucide-react";

import { apagarCliente } from "@/app/actions/clientes";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { useConfirm } from "@/components/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClienteForm } from "@/components/forms/cliente-form";
import { formatarTelefone } from "@/lib/constants";
import type { Cliente } from "@/lib/types/database";

export function ClienteList({ clientes }: { clientes: Cliente[] }) {
  const [pendente, startTransition] = useTransition();
  const [editando, setEditando] = useState<Cliente | null>(null);
  const router = useRouter();
  const confirmar = useConfirm();

  async function handleApagar(c: Cliente) {
    const ok = await confirmar({
      titulo: `Apagar ${c.nome}?`,
      descricao:
        "O cliente será removido. Empréstimos associados continuam, mas sem cliente vinculado. Esta ação não pode ser desfeita.",
      textoConfirmar: "Apagar",
      perigoso: true,
    });

    if (!ok) return;

    startTransition(async () => {
      const r = await apagarCliente(c.id);
      if (r.error) toast.error(r.error);
      else {
        toast.success("Cliente apagado.");
        router.refresh();
      }
    });
  }

  if (clientes.length === 0) {
    return (
      <EmptyState
        titulo="Sem clientes cadastrados"
        descricao="Cadastre seu primeiro cliente para começar a registrar empréstimos."
        icone="users"
        compacto
      />
    );
  }

  return (
    <>
      <ul className="divide-y">
        {clientes.map((c) => (
          <li
            key={c.id}
            className="group flex items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{c.nome}</p>
              {c.telefone && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="size-3" />
                  {formatarTelefone(c.telefone)}
                </p>
              )}
              {c.observacoes && (
                <p className="mt-0.5 truncate text-xs italic text-muted-foreground">
                  {c.observacoes}
                </p>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditando(c)}
                className="text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
                aria-label={`Editar ${c.nome}`}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleApagar(c)}
                disabled={pendente}
                className="text-muted-foreground opacity-0 transition-opacity hover:text-rose-600 group-hover:opacity-100"
                aria-label={`Apagar ${c.nome}`}
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
            onSuccess={() => {
              setEditando(null);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
