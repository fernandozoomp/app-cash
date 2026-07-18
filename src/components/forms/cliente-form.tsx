"use client";

// ============================================================================
// FORMULÁRIO DE CLIENTE (criar/editar)
// ============================================================================

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { criarCliente, atualizarCliente } from "@/app/actions/clientes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Cliente } from "@/lib/types/database";

interface Props {
  clienteEdicao?: Cliente | null;
  onSuccess?: () => void;
}

export function ClienteForm({ clienteEdicao, onSuccess }: Props) {
  const [carregando, setCarregando] = useState(false);
  const editando = !!clienteEdicao;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);

    const formData = new FormData(e.currentTarget);
    const input = {
      nome: formData.get("nome") as string,
      telefone: (formData.get("telefone") as string) || undefined,
      observacoes: (formData.get("observacoes") as string) || undefined,
    };

    const resultado = editando
      ? await atualizarCliente(clienteEdicao!.id, input)
      : await criarCliente(input);

    setCarregando(false);

    if (resultado.error) {
      toast.error(resultado.error);
      return;
    }

    toast.success(editando ? "Cliente atualizado!" : "Cliente cadastrado!");
    (e.target as HTMLFormElement).reset();
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input
          id="nome"
          name="nome"
          placeholder="Nome completo do cliente"
          required
          defaultValue={clienteEdicao?.nome}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="telefone">Telefone</Label>
        <Input
          id="telefone"
          name="telefone"
          placeholder="(11) 99999-9999"
          defaultValue={clienteEdicao?.telefone || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Input
          id="observacoes"
          name="observacoes"
          placeholder="Ex: bom pagador, referências..."
          defaultValue={clienteEdicao?.observacoes || ""}
        />
      </div>
      <Button type="submit" className="w-full" disabled={carregando}>
        {carregando ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Salvando...
          </>
        ) : editando ? (
          "Atualizar cliente"
        ) : (
          "Cadastrar cliente"
        )}
      </Button>
    </form>
  );
}
