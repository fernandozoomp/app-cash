"use client";

// ============================================================================
// DIALOG DE PAGAMENTO — suporta total e parcial
// ============================================================================
// Abre um modal para registrar quanto o cliente pagou.
// Tem botões rápidos: "Marcar como paga" (total) ou valor personalizado.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { registrarPagamento } from "@/app/actions/cobrancas";
import { formatarMoeda } from "@/lib/constants";

interface Props {
  aberto: boolean;
  onFechar: () => void;
  parcelaId: string;
  numero: number;
  valorTotal: number;
  valorJaPago?: number;
  nomeCliente: string;
}

export function DialogPagamento({
  aberto,
  onFechar,
  parcelaId,
  numero,
  valorTotal,
  valorJaPago = 0,
  nomeCliente,
}: Props) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [valor, setValor] = useState("");

  const saldoDevedor = Math.max(0, valorTotal - valorJaPago);
  const hoje = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const valorPago = parseFloat(formData.get("valor") as string);
    const data = (formData.get("data") as string) || hoje;

    if (!valorPago || valorPago <= 0) {
      toast.error("Digite um valor válido.");
      return;
    }

    if (valorPago > saldoDevedor + 0.01) {
      // Tolerância de 1 centavo para erros de arredondamento
      toast.warning(
        `Valor maior que o saldo devedor (${formatarMoeda(saldoDevedor)}).`,
        { description: "Será registrado como pagamento total." },
      );
    }

    startTransition(async () => {
      const r = await registrarPagamento({
        parcela_id: parcelaId,
        valor_pago: valorPago,
        data_pagamento: data,
      });

      if (r.error) {
        toast.error(r.error);
        return;
      }

      toast.success(r.mensagem);
      setValor("");
      onFechar();
      router.refresh();
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
          <DialogDescription>
            Parcela {numero} de {nomeCliente}
          </DialogDescription>
        </DialogHeader>

        {/* Resumo visual da parcela */}
        <div className="rounded-xl bg-muted/50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Valor da parcela</span>
            <span className="font-semibold num-moeda">
              {formatarMoeda(valorTotal)}
            </span>
          </div>
          {valorJaPago > 0 && (
            <>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Já pago</span>
                <span className="font-semibold text-emerald-600 num-moeda">
                  {formatarMoeda(valorJaPago)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t pt-1 text-sm">
                <span className="text-muted-foreground">Faltam</span>
                <span className="font-bold text-amber-600 num-moeda">
                  {formatarMoeda(saldoDevedor)}
                </span>
              </div>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="valor-pagamento">Valor pago (R$)</Label>
            <Input
              id="valor-pagamento"
              name="valor"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              placeholder={saldoDevedor.toFixed(2)}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              autoFocus
              className="h-12 text-lg font-semibold"
            />
            {/* Botão rápido: preenche com o saldo devedor */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setValor(saldoDevedor.toFixed(2))}
            >
              <CheckCircle2 className="size-4 text-emerald-600" />
              Preencher com valor total ({formatarMoeda(saldoDevedor)})
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data-pagamento">Data do pagamento</Label>
            <Input
              id="data-pagamento"
              name="data"
              type="date"
              defaultValue={hoje}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onFechar}
              disabled={pendente}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pendente}>
              {pendente ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Registrar pagamento"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
