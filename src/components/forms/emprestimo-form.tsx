"use client";

// ============================================================================
// FORMULÁRIO DE EMPRÉSTIMO — com cálculo de parcelas EM TEMPO REAL
// ============================================================================
// Enquanto o usuário digita, mostramos uma prévia de como ficam as parcelas.
// Usamos a MESMA calculadora do servidor (calculadora.ts) para garantir
// que o preview bate com o que será salvo.

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { criarEmprestimo } from "@/app/actions/emprestimos";
import { calcularEmprestimo } from "@/lib/finance/calculadora";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatarMoeda, formatarData } from "@/lib/constants";
import type { Cliente, SistemaJuros } from "@/lib/types/database";

interface Props {
  clientes: Cliente[];
  onSuccess?: () => void;
}

export function EmprestimoForm({ clientes, onSuccess }: Props) {
  const [carregando, setCarregando] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [valor, setValor] = useState("");
  const [taxa, setTaxa] = useState("5");
  const [parcelas, setParcelas] = useState("10");
  const [dataInicio, setDataInicio] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [sistema, setSistema] = useState<SistemaJuros>("price");
  const [observacoes, setObservacoes] = useState("");

  // Preview do cálculo (recalcula automaticamente quando algo muda)
  const preview = useMemo(() => {
    const v = parseFloat(valor);
    const t = parseFloat(taxa);
    const n = parseInt(parcelas);
    if (!v || v <= 0 || !n || n <= 0) return null;
    try {
      return calcularEmprestimo({
        valorPrincipal: v,
        taxaJurosMensal: isNaN(t) ? 0 : t,
        numParcelas: n,
        dataInicio,
        sistema,
      });
    } catch {
      return null;
    }
  }, [valor, taxa, parcelas, dataInicio, sistema]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);

    if (!clienteId) {
      toast.error("Selecione um cliente.");
      setCarregando(false);
      return;
    }

    const resultado = await criarEmprestimo({
      cliente_id: clienteId,
      valor_principal: parseFloat(valor),
      taxa_juros: parseFloat(taxa) || 0,
      num_parcelas: parseInt(parcelas),
      data_inicio: dataInicio,
      sistema_juros: sistema,
      observacoes: observacoes || undefined,
    });

    setCarregando(false);

    if (resultado.error) {
      toast.error(resultado.error);
      return;
    }

    toast.success("Empréstimo criado com sucesso!");
    // Limpar
    setClienteId("");
    setValor("");
    setTaxa("5");
    setParcelas("10");
    setObservacoes("");
    onSuccess?.();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cliente */}
        <div className="space-y-2">
          <Label>Cliente *</Label>
          <Select value={clienteId} onValueChange={setClienteId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes.length === 0 ? (
                <SelectItem value="_vazio" disabled>
                  Cadastre clientes primeiro
                </SelectItem>
              ) : (
                clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {clientes.length === 0 && (
            <p className="text-xs text-amber-600">
              ⚠️ Você precisa cadastrar clientes antes. Vá em Clientes no menu.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$) *</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              placeholder="1000"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
          </div>
          {/* Taxa de juros */}
          <div className="space-y-2">
            <Label htmlFor="taxa">Juros (% ao mês)</Label>
            <Input
              id="taxa"
              type="number"
              step="0.01"
              min="0"
              placeholder="5"
              value={taxa}
              onChange={(e) => setTaxa(e.target.value)}
            />
          </div>
          {/* Parcelas */}
          <div className="space-y-2">
            <Label htmlFor="parcelas">Nº de parcelas *</Label>
            <Input
              id="parcelas"
              type="number"
              min="1"
              placeholder="10"
              value={parcelas}
              onChange={(e) => setParcelas(e.target.value)}
              required
            />
          </div>
          {/* Data início */}
          <div className="space-y-2">
            <Label htmlFor="data">Data de início</Label>
            <Input
              id="data"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Sistema de juros */}
        <div className="space-y-2">
          <Label>Sistema de juros</Label>
          <Select
            value={sistema}
            onValueChange={(v) => setSistema(v as SistemaJuros)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">
                Tabela Price (parcelas iguais)
              </SelectItem>
              <SelectItem value="simples">Juros simples</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <Label htmlFor="obs">Observações</Label>
          <Input
            id="obs"
            placeholder="Ex: garantia oferecida, referências..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={carregando || clientes.length === 0}
        >
          {carregando ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Criando empréstimo...
            </>
          ) : (
            "Criar empréstimo"
          )}
        </Button>
      </form>

      {/* PREVIEW DAS PARCELAS */}
      {preview && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📊 Prévia do empréstimo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Parcela</p>
                <p className="font-bold text-emerald-600">
                  {formatarMoeda(preview.valorParcela)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-bold">
                  {formatarMoeda(preview.valorTotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Juros</p>
                <p className="font-bold text-amber-600">
                  {formatarMoeda(preview.totalJuros)}
                </p>
              </div>
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Ver tabela de parcelas ({preview.parcelas.length})
              </summary>
              <ul className="mt-2 space-y-1">
                {preview.parcelas.map((p) => (
                  <li
                    key={p.numero}
                    className="flex justify-between rounded px-2 py-1 odd:bg-background"
                  >
                    <span>Parcela {p.numero}</span>
                    <span className="text-muted-foreground">
                      {formatarData(p.vencimento)}
                    </span>
                    <span className="font-medium">
                      {formatarMoeda(p.valor)}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
