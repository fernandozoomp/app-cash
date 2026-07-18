"use client";

// ============================================================================
// FORMULÁRIO DE EMPRÉSTIMO — com preview em tempo real
// ============================================================================
// Melhorias (Etapa 6):
// - Cards de resumo em destaque (parcela, total, juros)
// - Explicação didática do sistema de juros escolhido
// - Validação visual (campo vermelho se inválido)
// - Empty state quando não há clientes
// - Texto humanizado

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

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
import { Card, CardContent } from "@/components/ui/card";
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

  // Preview do cálculo (recalcula automaticamente)
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
      toast.error("Selecione um cliente antes de criar o empréstimo.");
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

    toast.success("Empréstimo criado!", {
      description: preview
        ? `${preview.parcelas.length} parcelas de ${formatarMoeda(
            preview.valorParcela,
          )}`
        : undefined,
    });
    setClienteId("");
    setValor("");
    setTaxa("5");
    setParcelas("10");
    setObservacoes("");
    onSuccess?.();
  }

  const semClientes = clientes.length === 0;

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
              {clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {semClientes && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <AlertCircle className="size-4 shrink-0" />
              <div>
                Você precisa cadastrar clientes antes.{" "}
                <Link
                  href="/clientes"
                  className="font-medium text-amber-900 underline"
                >
                  Cadastrar agora
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="valor">Valor emprestado (R$) *</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="1000"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
              className="text-base font-semibold"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxa">Juros (% ao mês)</Label>
            <Input
              id="taxa"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="5"
              value={taxa}
              onChange={(e) => setTaxa(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parcelas">Número de parcelas *</Label>
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
                Tabela Price — parcelas iguais
              </SelectItem>
              <SelectItem value="simples">Juros simples</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {sistema === "price"
              ? "Todas as parcelas têm o mesmo valor. É o sistema que os bancos usam."
              : "Juros direto sobre o valor inicial. Mais simples de explicar pro cliente."}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="obs">Observações (opcional)</Label>
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
          disabled={carregando || semClientes}
        >
          {carregando ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Criando...
            </>
          ) : (
            "Criar empréstimo"
          )}
        </Button>
      </form>

      {/* ===== PREVIEW DO EMPRÉSTIMO ===== */}
      {preview && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="space-y-3 pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Prévia do empréstimo
            </p>

            {/* 3 números principais */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Parcela</p>
                <p className="num-moeda text-lg font-bold text-primary">
                  {formatarMoeda(preview.valorParcela)}
                </p>
              </div>
              <div className="border-x text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="num-moeda text-lg font-bold">
                  {formatarMoeda(preview.valorTotal)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Juros</p>
                <p className="num-moeda text-lg font-bold text-amber-600">
                  {formatarMoeda(preview.totalJuros)}
                </p>
              </div>
            </div>

            {/* Detalhes expansíveis */}
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between text-sm text-muted-foreground hover:text-foreground">
                <span>
                  Ver todas as {preview.parcelas.length} parcelas
                </span>
                <span className="text-xs group-open:hidden">▾</span>
                <span className="hidden text-xs group-open:inline">▴</span>
              </summary>
              <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto text-sm">
                {preview.parcelas.map((p) => (
                  <li
                    key={p.numero}
                    className="flex justify-between gap-2 rounded px-2 py-1 odd:bg-background"
                  >
                    <span className="shrink-0">P{p.numero}</span>
                    <span className="flex-1 truncate text-center text-muted-foreground">
                      {formatarData(p.vencimento)}
                    </span>
                    <span className="num-moeda font-medium">
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
