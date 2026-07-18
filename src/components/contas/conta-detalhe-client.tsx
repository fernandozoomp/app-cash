"use client";

// ============================================================================
// CLIENT: detalhe da conta — upload de extrato + conciliação
// ============================================================================

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Upload,
  Loader2,
  CheckCircle2,
  Link2,
  PlusCircle,
  FileText,
  Sparkles,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { useConfirm } from "@/components/confirm-dialog";
import {
  importarExtrato,
  sugerirConciliacao,
  vincularExtrato,
  criarTransacaoDeExtrato,
} from "@/app/actions/contas";
import {
  parseOFX,
  parseCSVExtrato,
  parseJSON,
  detectarFormato,
  calcularHash,
  type ExtratoLancamento,
} from "@/lib/extrato/parser";
import { formatarMoeda, formatarData } from "@/lib/constants";
import type { ContaBancaria, ExtratoItem } from "@/lib/types/database";

interface Props {
  conta: ContaBancaria;
  itensNaoConciliados: ExtratoItem[];
  totalItens: number;
}

export function ContaDetalheClient({
  conta,
  itensNaoConciliados,
  totalItens,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendente, startTransition] = useTransition();
  const [carregando, setCarregando] = useState(false);
  const [sugestoes, setSugestoes] = useState<
    Record<string, any[]>
  >({});
  const [carregandoSugestao, setCarregandoSugestao] = useState<string | null>(
    null,
  );

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setCarregando(true);
    try {
      const conteudo = await arquivo.text();
      const formato = detectarFormato(arquivo.name, conteudo);

      // Parseia conforme o formato
      let resultado: { lancamentos: ExtratoLancamento[]; erros: string[] };
      if (formato === "ofx") resultado = parseOFX(conteudo);
      else if (formato === "json") resultado = parseJSON(conteudo);
      else resultado = parseCSVExtrato(conteudo);

      if (resultado.lancamentos.length === 0) {
        toast.error("Nenhum lançamento encontrado no arquivo.");
        return;
      }

      // Calcula hashes
      const itensComHash = await Promise.all(
        resultado.lancamentos.map(async (l) => ({
          ...l,
          hash_unico: await calcularHash(conta.id, l),
        })),
      );

      // Importa
      const r = await importarExtrato({
        conta_id: conta.id,
        origem: formato,
        itens: itensComHash,
      });

      if (r && "error" in r && r.error) {
        toast.error(r.error);
      } else {
        toast.success(
          `${resultado.lancamentos.length} lançamento(s) processado(s)!`,
          {
            description: r.mensagem,
          },
        );
        router.refresh();
      }
    } catch (err) {
      toast.error("Erro ao ler o arquivo.");
    } finally {
      setCarregando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleSugerir(item: ExtratoItem) {
    setCarregandoSugestao(item.id);
    const { sugestoes: sugs } = await sugerirConciliacao(item.id);
    setSugestoes((prev) => ({ ...prev, [item.id]: sugs }));
    setCarregandoSugestao(null);

    if (sugs.length === 0) {
      toast.info("Sem sugestões automáticas para este lançamento.", {
        description: "Você pode criar uma transação nova.",
      });
    }
  }

  async function handleVincular(item: ExtratoItem, transacaoId: string) {
    startTransition(async () => {
      const r = await vincularExtrato(item.id, transacaoId);
      if (r.error) {
        toast.error(r.error);
      } else {
        toast.success("Lançamento conciliado! ✓");
        setSugestoes((prev) => {
          const copia = { ...prev };
          delete copia[item.id];
          return copia;
        });
        router.refresh();
      }
    });
  }

  async function handleCriarTransacao(item: ExtratoItem) {
    startTransition(async () => {
      const r = await criarTransacaoDeExtrato(item.id, {
        empreendimento: "adega",
        categoria: "importado_extrato",
      });
      if (r.error) {
        toast.error(r.error);
      } else {
        toast.success("Transação criada e vinculada!");
        router.refresh();
      }
    });
  }

  const totalEntradas = itensNaoConciliados
    .filter((i) => Number(i.valor) > 0)
    .reduce((s, i) => s + Number(i.valor), 0);
  const totalSaidas = itensNaoConciliados
    .filter((i) => Number(i.valor) < 0)
    .reduce((s, i) => s + Math.abs(Number(i.valor)), 0);

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Saldo inicial</p>
            <p className="num-moeda mt-1 text-xl font-bold">
              {formatarMoeda(Number(conta.saldo_inicial))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">
              A conciliar (entradas)
            </p>
            <p className="num-moeda mt-1 text-xl font-bold text-emerald-600">
              +{formatarMoeda(totalEntradas)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">
              A conciliar (saídas)
            </p>
            <p className="num-moeda mt-1 text-xl font-bold text-rose-600">
              −{formatarMoeda(totalSaidas)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upload */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Upload className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Importar extrato bancário</p>
                <p className="text-sm text-muted-foreground">
                  Formatos suportados: <strong>OFX</strong>, <strong>CSV</strong> e <strong>JSON</strong>
                </p>
              </div>
            </div>
            <Button onClick={() => inputRef.current?.click()} disabled={carregando}>
              {carregando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Escolher arquivo
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".ofx,.csv,.json,.txt"
              onChange={handleArquivo}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de itens não conciliados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Lançamentos para conciliar</span>
            <Badge variant="outline">{itensNaoConciliados.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {itensNaoConciliados.length === 0 ? (
            <EmptyState
              titulo="Tudo conciliado! 🎉"
              descricao={
                totalItens === 0
                  ? "Importe um extrato para começar a conciliar."
                  : "Não há lançamentos pendentes. Importe mais extratos quando quiser."
              }
              icone="wallet"
              compacto
            />
          ) : (
            <ul className="space-y-3">
              {itensNaoConciliados.map((item) => {
                const entrada = Number(item.valor) >= 0;
                const sugs = sugestoes[item.id] || [];
                return (
                  <li
                    key={item.id}
                    className="rounded-lg border p-3 transition-shadow hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`num-moeda font-semibold ${
                              entrada ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {entrada ? "+" : "−"}
                            {formatarMoeda(Math.abs(Number(item.valor)))}
                          </span>
                          <Badge variant="outline" className="text-xs uppercase">
                            {item.origem}
                          </Badge>
                        </div>
                        <p className="mt-0.5 truncate text-sm">
                          {item.descricao || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatarData(item.data)}
                        </p>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSugerir(item)}
                        disabled={carregandoSugestao === item.id}
                      >
                        {carregandoSugestao === item.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="size-3.5" />
                        )}
                        Sugerir match
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCriarTransacao(item)}
                        disabled={pendente}
                      >
                        <PlusCircle className="size-3.5" />
                        Criar nova
                      </Button>
                    </div>

                    {/* Sugestões */}
                    {sugs.length > 0 && (
                      <div className="mt-3 space-y-2 rounded-lg bg-muted/50 p-2">
                        <p className="px-1 text-xs font-medium text-muted-foreground">
                          💡 {sugs.length} transação(ões) com valor parecido:
                        </p>
                        {sugs.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between rounded-md bg-background p-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {t.descricao || t.categoria}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatarData(t.data)} •{" "}
                                {formatarMoeda(Number(t.valor))} •{" "}
                                {t.empreendimento}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleVincular(item, t.id)}
                              disabled={pendente}
                            >
                              <Link2 className="size-3.5" />
                              Vincular
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
