"use client";

// ============================================================================
// FORMULÁRIO DE TRANSAÇÃO (entrada/saída)
// ============================================================================
// Componente cliente porque tem estado (formulário controlado).
// Chama a Server Action criarTransacao ao enviar.

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { criarTransacao } from "@/app/actions/caixa";
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
import type {
  Empreendimento,
  FormaPagamento,
  TipoTransacao,
} from "@/lib/types/database";

const CATEGORIAS: Record<Empreendimento, string[]> = {
  adega: ["venda", "compra_estoque", "despesa", "outros"],
  emprestimos: ["emprestimo_concedido", "recebimento_parcela", "juros", "outros"],
  sucatas: ["venda_sucata", "compra_sucata", "outros"],
};

export function TransacaoForm({ onSuccess }: { onSuccess?: () => void }) {
  const [carregando, setCarregando] = useState(false);
  const [tipo, setTipo] = useState<TipoTransacao>("entrada");
  const [empreendimento, setEmpreendimento] =
    useState<Empreendimento>("adega");
  const [categoria, setCategoria] = useState<string>("venda");
  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamento>("dinheiro");

  const hoje = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);

    const formData = new FormData(e.currentTarget);
    const valor = parseFloat(formData.get("valor") as string);

    if (!valor || valor <= 0) {
      toast.error("Digite um valor válido.");
      setCarregando(false);
      return;
    }

    const resultado = await criarTransacao({
      data: formData.get("data") as string,
      tipo,
      empreendimento,
      categoria,
      descricao: (formData.get("descricao") as string) || undefined,
      valor,
      forma_pagamento: formaPagamento,
    });

    setCarregando(false);

    if (resultado.error) {
      toast.error(resultado.error);
      return;
    }

    toast.success(
      `${tipo === "entrada" ? "Entrada" : "Saída"} registrada com sucesso!`,
    );
    (e.target as HTMLFormElement).reset();
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tipo: entrada ou saída */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={tipo === "entrada" ? "default" : "outline"}
          className={
            tipo === "entrada"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "text-emerald-600"
          }
          onClick={() => setTipo("entrada")}
        >
          ↑ Entrada
        </Button>
        <Button
          type="button"
          variant={tipo === "saida" ? "default" : "outline"}
          className={
            tipo === "saida"
              ? "bg-rose-600 hover:bg-rose-700"
              : "text-rose-600"
          }
          onClick={() => setTipo("saida")}
        >
          ↓ Saída
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Valor */}
        <div className="space-y-2">
          <Label htmlFor="valor">Valor (R$) *</Label>
          <Input
            id="valor"
            name="valor"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            required
          />
        </div>

        {/* Data */}
        <div className="space-y-2">
          <Label htmlFor="data">Data *</Label>
          <Input id="data" name="data" type="date" defaultValue={hoje} required />
        </div>

        {/* Empreendimento */}
        <div className="space-y-2">
          <Label>Empreendimento *</Label>
          <Select
            value={empreendimento}
            onValueChange={(v) => {
              setEmpreendimento(v as Empreendimento);
              setCategoria(CATEGORIAS[v as Empreendimento][0]);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="adega">Adega</SelectItem>
              <SelectItem value="emprestimos">Empréstimos</SelectItem>
              <SelectItem value="sucatas">Sucatas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Categoria */}
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS[empreendimento].map((c) => (
                <SelectItem key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Forma de pagamento */}
        <div className="space-y-2">
          <Label>Pagamento</Label>
          <Select
            value={formaPagamento}
            onValueChange={(v) => setFormaPagamento(v as FormaPagamento)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dinheiro">Dinheiro</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="cartao">Cartão</SelectItem>
              <SelectItem value="fiado">Fiado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição (opcional)</Label>
        <Input
          id="descricao"
          name="descricao"
          placeholder="Ex: Venda de cerveja para João"
        />
      </div>

      <Button type="submit" className="w-full" disabled={carregando}>
        {carregando ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Salvar lançamento"
        )}
      </Button>
    </form>
  );
}
