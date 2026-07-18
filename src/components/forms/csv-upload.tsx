"use client";

// ============================================================================
// UPLOAD DE CSV (extrato bancário)
// ============================================================================
// Funciona em desktop e celular (input type=file com accept=".csv").
// Fluxo:
//   1. Usuário escolhe o arquivo CSV
//   2. Lemos e parseamos no navegador (detecção automática do banco)
//   3. Mostramos preview das transações detectadas
//   4. Usuário escolhe o empreendimento destino
//   5. Confirma → importamos tudo no banco

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import { parseCSV, type BancoDetectado } from "@/lib/csv/parser";
import { importarTransacoesCSV } from "@/app/actions/csv";
import { Button } from "@/components/ui/button";
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
import type { Empreendimento } from "@/lib/types/database";

const NOMES_BANCO: Record<BancoDetectado, string> = {
  nubank: "Nubank",
  itau: "Itaú",
  bradesco: "Bradesco",
  inter: "Banco Inter",
  generico: "Formato genérico",
};

export function CSVUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [carregando, setCarregando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [arquivoNome, setArquivoNome] = useState("");
  const [banco, setBanco] = useState<BancoDetectado | null>(null);
  const [transacoes, setTransacoes] = useState<
    Array<{ data: string; descricao: string; valor: number }>
  >([]);
  const [erros, setErros] = useState<string[]>([]);
  const [empreendimento, setEmpreendimento] =
    useState<Empreendimento>("adega");

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    // Validação: só aceita .csv ou texto
    if (
      !arquivo.name.toLowerCase().endsWith(".csv") &&
      !arquivo.type.includes("csv") &&
      !arquivo.type.includes("text")
    ) {
      toast.error("Por favor, selecione um arquivo .csv");
      return;
    }

    // Limite de tamanho: 5MB (suficiente para extratos grandes)
    if (arquivo.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo: 5MB.");
      return;
    }

    setCarregando(true);
    setArquivoNome(arquivo.name);

    try {
      const texto = await arquivo.text();
      const resultado = parseCSV(texto);

      setBanco(resultado.banco);
      setTransacoes(resultado.transacoes);
      setErros(resultado.erros);

      if (resultado.transacoes.length === 0) {
        toast.warning(
          "Nenhuma transação encontrada no arquivo. Verifique o formato.",
        );
      } else {
        toast.success(
          `${resultado.transacoes.length} transações detectadas (${NOMES_BANCO[resultado.banco]}).`,
        );
      }
    } catch (e) {
      toast.error("Não foi possível ler o arquivo.");
      setTransacoes([]);
      setBanco(null);
    } finally {
      setCarregando(false);
    }
  }

  async function handleImportar() {
    if (transacoes.length === 0) return;

    setImportando(true);
    const resultado = await importarTransacoesCSV({
      empreendimento,
      transacoes,
    });
    setImportando(false);

    if (resultado.error) {
      toast.error(resultado.error);
      return;
    }

    toast.success(resultado.mensagem, {
      description: "Confira no Caixa.",
    });
    // Limpa
    setTransacoes([]);
    setBanco(null);
    setArquivoNome("");
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
    router.push("/caixa");
  }

  function handleLimpar() {
    setTransacoes([]);
    setBanco(null);
    setErros([]);
    setArquivoNome("");
    if (inputRef.current) inputRef.current.value = "";
  }

  // Resumo financeiro do preview
  const totalEntradas = transacoes
    .filter((t) => t.valor > 0)
    .reduce((s, t) => s + t.valor, 0);
  const totalSaidas = transacoes
    .filter((t) => t.valor < 0)
    .reduce((s, t) => s + Math.abs(t.valor), 0);

  return (
    <div className="space-y-4">
      {/* Zona de upload (clicável) */}
      <div
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
      >
        {carregando ? (
          <Loader2 className="size-8 animate-spin text-primary" />
        ) : (
          <Upload className="size-8 text-muted-foreground" />
        )}
        <div>
          <p className="font-medium">
            {carregando ? "Lendo arquivo..." : "Toque para escolher o CSV"}
          </p>
          <p className="text-xs text-muted-foreground">
            Baixe o extrato do seu banco em formato CSV
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={handleArquivo}
          className="hidden"
        />
      </div>

      {/* Avisos de erros */}
      {erros.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="size-4 shrink-0" />
          <div>
            <p>{erros.length} linha(s) não puderam ser lidas.</p>
            <p className="text-xs opacity-80">
              As outras foram importadas normalmente.
            </p>
          </div>
        </div>
      )}

      {/* Preview das transações */}
      {transacoes.length > 0 && (
        <Card className="border-primary/20">
          <CardContent className="space-y-4 pt-6">
            {/* Cabeçalho do preview */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">
                    {transacoes.length} transações detectadas
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Banco: {banco ? NOMES_BANCO[banco] : "—"} • {arquivoNome}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLimpar}>
                Limpar
              </Button>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3 text-center text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Entradas</p>
                <p className="num-moeda font-bold text-emerald-600">
                  {formatarMoeda(totalEntradas)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saídas</p>
                <p className="num-moeda font-bold text-rose-600">
                  {formatarMoeda(totalSaidas)}
                </p>
              </div>
            </div>

            {/* Lista (máx 10 itens, scrollable) */}
            <div className="max-h-60 overflow-y-auto rounded-lg border">
              <ul className="divide-y">
                {transacoes.slice(0, 50).map((t, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{t.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatarData(t.data)}
                      </p>
                    </div>
                    <span
                      className={`num-moeda shrink-0 font-semibold ${
                        t.valor >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {t.valor >= 0 ? "+" : "−"}
                      {formatarMoeda(Math.abs(t.valor))}
                    </span>
                  </li>
                ))}
                {transacoes.length > 50 && (
                  <li className="px-3 py-2 text-center text-xs text-muted-foreground">
                    + {transacoes.length - 50} transações...
                  </li>
                )}
              </ul>
            </div>

            {/* Seleção do empreendimento destino */}
            <div className="space-y-2">
              <Label>Para qual empreendimento importar?</Label>
              <Select
                value={empreendimento}
                onValueChange={(v) => setEmpreendimento(v as Empreendimento)}
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

            <Button
              onClick={handleImportar}
              className="w-full"
              disabled={importando}
            >
              {importando ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Importando {transacoes.length}...
                </>
              ) : (
                <>
                  Importar {transacoes.length} transações
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dica de onde baixar o CSV */}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          📖 Onde baixar o extrato em CSV?
        </summary>
        <div className="mt-2 space-y-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <p>
            <strong>Nubank:</strong> App → Extrato → ícone de download → CSV.
          </p>
          <p>
            <strong>Itaú:</strong> Site → Extrato → Exportar → CSV.
          </p>
          <p>
            <strong>Bradesco:</strong> Site → Extrato → Salvar como → TXT/CSV.
          </p>
          <p className="pt-1">
            💡 A detecção é automática. Se algo não bater, é só conferir os
            valores importados e ajustar manualmente.
          </p>
        </div>
      </details>
    </div>
  );
}
