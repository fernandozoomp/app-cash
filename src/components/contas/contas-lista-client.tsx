"use client";

// ============================================================================
// CLIENT: lista de contas + dialog de criação
// ============================================================================

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Building2,
  Trash2,
  ArrowRight,
  Banknote,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfirm } from "@/components/confirm-dialog";
import { criarConta, apagarConta } from "@/app/actions/contas";
import { formatarMoeda } from "@/lib/constants";
import type { ContaBancaria, BancoCodigo } from "@/lib/types/database";

const BANCOS: Array<{ valor: BancoCodigo; label: string; emoji: string }> = [
  { valor: "nubank", label: "Nubank", emoji: "🟣" },
  { valor: "itau", label: "Itaú", emoji: "🟠" },
  { valor: "bradesco", label: "Bradesco", emoji: "🔴" },
  { valor: "bb", label: "Banco do Brasil", emoji: "🟡" },
  { valor: "inter", label: "Banco Inter", emoji: "🟠" },
  { valor: "santander", label: "Santander", emoji: "🔴" },
  { valor: "caixa", label: "Caixa", emoji: "🔵" },
  { valor: "outros", label: "Outros", emoji: "🏦" },
];

const CORES = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#6366f1",
];

export function ContasListaClient({ contas }: { contas: ContaBancaria[] }) {
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const confirmar = useConfirm();

  // Estado do formulário
  const [nome, setNome] = useState("");
  const [banco, setBanco] = useState<BancoCodigo>("nubank");
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");
  const [saldo, setSaldo] = useState("");
  const [cor, setCor] = useState(CORES[0]);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;

    setCarregando(true);
    const r = await criarConta({
      nome,
      banco,
      agencia: agencia || undefined,
      conta: conta || undefined,
      saldo_inicial: saldo ? parseFloat(saldo) : 0,
      cor,
    });
    setCarregando(false);

    if (r && "error" in r && r.error) {
      alert(r.error);
      return;
    }

    // Limpa e fecha
    setNome("");
    setAgencia("");
    setConta("");
    setSaldo("");
    setCor(CORES[0]);
    setAberto(false);
  }

  async function handleApagar(c: ContaBancaria) {
    const ok = await confirmar({
      titulo: `Apagar conta "${c.nome}"?`,
      descricao: "Todos os extratos vinculados também serão removidos.",
      textoConfirmar: "Apagar",
      perigoso: true,
    });
    if (!ok) return;
    await apagarConta(c.id);
  }

  return (
    <>
      {/* Botão criar */}
      <div className="mb-4">
        <Button onClick={() => setAberto(true)}>
          <Plus className="size-4" />
          Nova conta
        </Button>
      </div>

      {/* Grid de contas */}
      {contas.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contas.map((c) => {
            const bancoInfo = BANCOS.find((b) => b.valor === c.banco);
            return (
              <Card key={c.id} className="group relative overflow-hidden">
                {/* Faixa de cor no topo */}
                <div className="h-1.5 w-full" style={{ background: c.cor }} />
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{bancoInfo?.emoji || "🏦"}</span>
                      <div>
                        <p className="font-semibold">{c.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {bancoInfo?.label || c.banco}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApagar(c)}
                      className="text-muted-foreground opacity-0 transition-opacity hover:text-rose-600 group-hover:opacity-100"
                      aria-label="Apagar conta"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  {c.agencia && c.conta && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Ag {c.agencia} • CC {c.conta}
                    </p>
                  )}

                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground">
                      Saldo inicial
                    </p>
                    <p className="num-moeda text-lg font-bold">
                      {formatarMoeda(Number(c.saldo_inicial))}
                    </p>
                  </div>

                  <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                    <Link href={`/contas/${c.id}`}>
                      Abrir conta
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de criação */}
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              Nova conta bancária
            </DialogTitle>
            <DialogDescription>
              Cadastre uma conta para importar extratos
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCriar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-nome">Nome da conta *</Label>
              <Input
                id="c-nome"
                placeholder="Ex: Conta Nubank PJ"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Banco</Label>
              <Select value={banco} onValueChange={(v) => setBanco(v as BancoCodigo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BANCOS.map((b) => (
                    <SelectItem key={b.valor} value={b.valor}>
                      {b.emoji} {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="c-ag">Agência</Label>
                <Input
                  id="c-ag"
                  placeholder="0001"
                  value={agencia}
                  onChange={(e) => setAgencia(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-cc">Conta</Label>
                <Input
                  id="c-cc"
                  placeholder="12345-6"
                  value={conta}
                  onChange={(e) => setConta(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-saldo">Saldo inicial (R$)</Label>
              <Input
                id="c-saldo"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={saldo}
                onChange={(e) => setSaldo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-1.5">
                {CORES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCor(c)}
                    className={`size-8 rounded-full transition-transform ${
                      cor === c ? "ring-2 ring-offset-2 ring-current scale-110" : ""
                    }`}
                    style={{ background: c }}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={carregando}>
                {carregando ? "Criando..." : "Criar conta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
