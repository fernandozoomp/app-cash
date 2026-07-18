"use client";

// ============================================================================
// LISTA DE CLIENTES (com editar, excluir elegante e FILTROS)
// ============================================================================

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Loader2, Phone, ArrowUpDown } from "lucide-react";

import { apagarCliente } from "@/app/actions/clientes";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { useConfirm } from "@/components/confirm-dialog";
import { FiltrosBar } from "@/components/listas/filtros-bar";
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

type FiltroCliente = "todos" | "comTelefone" | "semTelefone";
type Ordenacao = "recentes" | "az" | "za";

export function ClienteList({ clientes }: { clientes: Cliente[] }) {
  const [pendente, startTransition] = useTransition();
  const [editando, setEditando] = useState<Cliente | null>(null);
  const router = useRouter();
  const confirmar = useConfirm();

  // Estados de filtro
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroCliente>("todos");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("recentes");

  // Aplica busca + filtro + ordenação
  const filtrados = useMemo(() => {
    let resultado = [...clientes];

    // Busca por nome OU telefone
    if (busca.trim()) {
      const termo = busca.toLowerCase().trim();
      resultado = resultado.filter(
        (c) =>
          c.nome.toLowerCase().includes(termo) ||
          (c.telefone || "").toLowerCase().includes(termo),
      );
    }

    // Filtro por chips
    if (filtro === "comTelefone") {
      resultado = resultado.filter((c) => c.telefone && c.telefone.trim());
    } else if (filtro === "semTelefone") {
      resultado = resultado.filter((c) => !c.telefone || !c.telefone.trim());
    }

    // Ordenação
    if (ordenacao === "az") {
      resultado.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (ordenacao === "za") {
      resultado.sort((a, b) => b.nome.localeCompare(a.nome));
    } else {
      // recentes: por data de criação (mais novo primeiro)
      resultado.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    return resultado;
  }, [clientes, busca, filtro, ordenacao]);

  // Contadores para os chips
  const comTelefone = clientes.filter((c) => c.telefone && c.telefone.trim()).length;

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
      <FiltrosBar
        busca={busca}
        onBusca={setBusca}
        placeholderBusca="Buscar por nome ou telefone..."
        filtroAtivo={filtro}
        onFiltro={setFiltro}
        totalResultados={filtrados.length}
        chips={[
          { valor: "todos", label: "Todos", count: clientes.length },
          { valor: "comTelefone", label: "Com telefone", count: comTelefone },
          {
            valor: "semTelefone",
            label: "Sem telefone",
            count: clientes.length - comTelefone,
          },
        ]}
      />

      {/* Controle de ordenação */}
      <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
        <ArrowUpDown className="size-3.5" />
        <span>Ordenar:</span>
        <select
          value={ordenacao}
          onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
          className="rounded-md border border-input bg-background px-2 py-1 text-xs"
        >
          <option value="recentes">Mais recentes</option>
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
        </select>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState
          titulo="Nenhum cliente encontrado"
          descricao="Tente outro termo de busca ou outro filtro."
          icone="users"
          compacto
        />
      ) : (
        <ul className="divide-y">
          {filtrados.map((c) => (
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
      )}

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
