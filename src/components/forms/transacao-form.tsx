"use client";

// ============================================================================
// FORMULÁRIO DE TRANSAÇÃO (entrada/saída)
// ============================================================================
// Melhorias (Etapa 5):
// - Preview do valor sendo digitado (feedback imediato)
// - Tradução das categorias (sem snake_case)
// - Validação mais clara
// - Botão mostrar/ocultar valor para conferir antes de salvar

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
import { formatarMoeda, traduzirCategoria } from "@/lib/constants";
import type {
  Empreendimento,
  FormaPagamento,
  TipoTransacao,
} from "@/lib/types/database";

// Mapeia empreendimento → categorias disponíveis (códigos internos).
// A tradução para o usuário acontece no Select via traduzirCategoria().
const CATEGORIAS: Record<Empreendimento, string[]> = {
  adega: ["venda", "compra_estoque", "despesa", "outros"],
  emprestimos: [
    "emprestimo_concedido",
    "recebimento_parcela",
    "juros",
    "outros",
  ],
  sucatas: ["venda_sucata", "compra_sucata", "outros"],
};

const FORMAS_PAGAMENTO: { valor: FormaPagamento; label: string }[] = [
  { valor: "dinheiro", label: "Dinheiro" },
  { valor: "pix", label: "PIX" },
  { valor: "cartao", label: "Cartão" },
  { valor: "fiado", label: "Fiado" },
];

export function TransacaoForm({ onSuccess }: { onSuccess?: () => void }) {
  const [carregando, setCarregando] = useState(false);
  const [tipo, setTipo] = useState<TipoTransacao>("entrada");
  const [empreendimento, setEmpreendimento] =
    useState<Empreendimento>("adega");
  const [categoria, setCategoria] = useState<string>("venda");
  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamento>("dinheiro");
  const [valorPreview, setValorPreview] = useState("");

  const hoje = new Date().toISOString().slice(0, 10);
  const valorNum = parseFloat(valorPreview) || 0;

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
      `${tipo === "entrada" ? "Entrada" : "Saída"} de ${formatarMoeda(valor)} registrada!`,
    );
    (e.target as HTMLFormElement).reset();
    setValorPreview("");
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tipo: entrada ou saída (toggle visual) */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={tipo === "entrada" ? "default" : "outline"}
          className={
            tipo === "entrada"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
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
              : "border-rose-200 text-rose-700 hover:bg-rose-50"
          }
          onClick={() => setTipo("saida")}
        >
          ↓ Saída
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="valor">Valor (R$) *</Label>
          <Input
            id="valor"
            name="valor"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0,00"
            value={valorPreview}
            onChange={(e) => setValorPreview(e.target.value)}
            required
            className={`text-lg font-semibold ${
              tipo === "entrada"
                ? "focus-visible:ring-emerald-500"
                : "focus-visible:ring-rose-500"
            }`}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="data">Data *</Label>
          <Input
            id="data"
            name="data"
            type="date"
            defaultValue={hoje}
            required
          />
        </div>
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
              <SelectItem value="adega">🍷 Adega</SelectItem>
              <SelectItem value="emprestimos">🤝 Empréstimos</SelectItem>
              <SelectItem value="sucatas">♻️ Sucatas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS[empreendimento].map((c) => (
                <SelectItem key={c} value={c}>
                  {traduzirCategoria(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Pagamento</Label>
          <Select
            value={formaPagamento}
            onValueChange={(v) => setFormaPagamento(v as FormaPagamento)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORMAS_PAGAMENTO.map((f) => (
                <SelectItem key={f.valor} value={f.valor}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição (opcional)</Label>
        <Input
          id="descricao"
          name="descricao"
          placeholder={
            tipo === "entrada"
              ? "Ex: venda de cerveja para o João"
              : "Ex: compra de estoque na distribuidora"
          }
        />
      </div>

      {/* Preview do valor (feedback visual antes de salvar) */}
      {valorNum > 0 && (
        <div
          className={`rounded-lg p-3 text-center transition-colors ${
            tipo === "entrada"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          <p className="text-xs opacity-80">
            {tipo === "entrada" ? "Vai entrar" : "Vai sair"}
          </p>
          <p className="num-moeda text-xl font-bold">
            {formatarMoeda(valorNum)}
          </p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={carregando}>
        {carregando ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Salvar"
        )}
      </Button>
    </form>
  );
}
