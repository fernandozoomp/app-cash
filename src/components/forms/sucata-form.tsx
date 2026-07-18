"use client";

// ============================================================================
// FORMULÁRIO DE SUCATA (compra/venda)
// ============================================================================

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { criarMovimentacaoSucata } from "@/app/actions/sucatas";
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
import { formatarMoeda } from "@/lib/constants";
import type { TipoSucata } from "@/lib/types/database";

const MATERIAIS_COMUNS = [
  "Cobre",
  "Alumínio",
  "Ferro",
  "Aço",
  "Bronze",
  "Latão",
  "Chumbo",
  "Zinco",
  "Papelão",
  "Plástico",
  "Outro",
];

export function SucataForm({ onSuccess }: { onSuccess?: () => void }) {
  const [carregando, setCarregando] = useState(false);
  const [tipo, setTipo] = useState<TipoSucata>("compra");
  const [material, setMaterial] = useState("Cobre");
  const [peso, setPeso] = useState("");
  const [preco, setPreco] = useState("");

  const pesoNum = parseFloat(peso) || 0;
  const precoNum = parseFloat(preco) || 0;
  const total = pesoNum * precoNum;
  const hoje = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);

    const formData = new FormData(e.currentTarget);
    const resultado = await criarMovimentacaoSucata({
      data: formData.get("data") as string,
      tipo,
      material,
      peso_kg: pesoNum,
      preco_por_kg: precoNum,
      observacoes: (formData.get("observacoes") as string) || undefined,
    });

    setCarregando(false);

    if (resultado.error) {
      toast.error(resultado.error);
      return;
    }

    toast.success(
      `${tipo === "compra" ? "Compra" : "Venda"} de ${material} registrada!`,
    );
    setPeso("");
    setPreco("");
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tipo */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={tipo === "compra" ? "default" : "outline"}
          className={
            tipo === "compra"
              ? "bg-rose-600 hover:bg-rose-700"
              : "text-rose-600"
          }
          onClick={() => setTipo("compra")}
        >
          ↓ Compra
        </Button>
        <Button
          type="button"
          variant={tipo === "venda" ? "default" : "outline"}
          className={
            tipo === "venda"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "text-emerald-600"
          }
          onClick={() => setTipo("venda")}
        >
          ↑ Venda
        </Button>
      </div>

      {/* Material */}
      <div className="space-y-2">
        <Label>Material</Label>
        <Select value={material} onValueChange={setMaterial}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MATERIAIS_COMUNS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Peso */}
        <div className="space-y-2">
          <Label htmlFor="peso">Peso (kg) *</Label>
          <Input
            id="peso"
            type="number"
            step="0.01"
            min="0"
            placeholder="10"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            required
          />
        </div>
        {/* Preço por kg */}
        <div className="space-y-2">
          <Label htmlFor="preco">Preço/kg (R$) *</Label>
          <Input
            id="preco"
            type="number"
            step="0.01"
            min="0"
            placeholder="30"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Data */}
      <div className="space-y-2">
        <Label htmlFor="data">Data</Label>
        <Input id="data" name="data" type="date" defaultValue={hoje} required />
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="obs">Observações</Label>
        <Input id="obs" name="observacoes" placeholder="Notas sobre a operação" />
      </div>

      {/* Total calculado (preview) */}
      {total > 0 && (
        <div className="rounded-md bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">Total da operação</p>
          <p className="text-xl font-bold">
            {formatarMoeda(total)}
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
          "Registrar"
        )}
      </Button>
    </form>
  );
}
