"use client";

// ============================================================================
// UPLOAD DE CSV — Importação em lote de operações
// ============================================================================
// Nova versão: o usuário escolhe o tipo de operação, baixa o template,
// preenche, e faz o upload. O parser detecta e valida automaticamente.
//
// Funciona em desktop e celular.

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Download,
  FileSpreadsheet,
  Users,
  Wallet,
  Recycle,
  HandCoins,
  type LucideIcon,
} from "lucide-react";

import { parseCSV, type TipoPlanilha } from "@/lib/csv/parser";
import { TEMPLATES, baixarTemplate, type TipoTemplate } from "@/lib/csv/templates";
import { importarCSV } from "@/app/actions/csv";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatarMoeda, formatarData } from "@/lib/constants";

const ICONES_TIPO: Record<TipoTemplate, LucideIcon> = {
  clientes: Users,
  caixa: Wallet,
  sucatas: Recycle,
  emprestimos: HandCoins,
};

// Rota para onde redirecionar após importar cada tipo
const ROTAS_POS_IMPORT: Record<TipoTemplate, string> = {
  clientes: "/clientes",
  caixa: "/caixa",
  sucatas: "/sucatas",
  emprestimos: "/emprestimos",
};

export function CSVUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [carregando, setCarregando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoTemplate | null>(
    null,
  );
  const [tipoDetectado, setTipoDetectado] = useState<TipoPlanilha | null>(null);
  const [linhas, setLinhas] = useState<any[]>([]);
  const [erros, setErros] = useState<Array<{ linha: number; mensagem: string }>>(
    [],
  );
  const [arquivoNome, setArquivoNome] = useState("");

  // ------------------- handlers -------------------

  function selecionarTipo(tipo: TipoTemplate) {
    setTipoSelecionado(tipo);
    // Limpa o estado anterior ao trocar de tipo
    setLinhas([]);
    setErros([]);
    setTipoDetectado(null);
    setArquivoNome("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    if (
      !arquivo.name.toLowerCase().endsWith(".csv") &&
      !arquivo.type.includes("csv") &&
      !arquivo.type.includes("text")
    ) {
      toast.error("Por favor, selecione um arquivo .csv");
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo: 5MB.");
      return;
    }

    setCarregando(true);
    setArquivoNome(arquivo.name);

    try {
      const texto = await arquivo.text();
      const resultado = parseCSV(texto);

      setTipoDetectado(resultado.tipo);
      setLinhas(resultado.linhas);
      setErros(resultado.erros);

      if (resultado.linhas.length === 0) {
        toast.warning(
          "Nenhuma linha válida encontrada. Verifique se está usando o template correto.",
        );
      } else {
        // Verifica se o tipo detectado bate com o selecionado
        if (tipoSelecionado && resultado.tipo !== tipoSelecionado) {
          toast.warning(
            `O arquivo parece ser do tipo "${resultado.tipo}", mas você selecionou "${tipoSelecionado}". Vamos importar mesmo assim.`,
          );
        } else {
          toast.success(
            `${resultado.linhas.length} linhas prontas para importar.`,
          );
        }
      }
    } catch {
      toast.error("Não foi possível ler o arquivo.");
      setLinhas([]);
      setTipoDetectado(null);
    } finally {
      setCarregando(false);
    }
  }

  async function handleImportar() {
    if (linhas.length === 0 || !tipoDetectado) return;

    setImportando(true);
    const resultado = await importarCSV({
      tipo: tipoDetectado,
      linhas,
    });
    setImportando(false);

    if (resultado.error) {
      toast.error(resultado.error);
      return;
    }

    toast.success(resultado.mensagem, {
      description: resultado.falhas ? `${resultado.falhas} falharam` : undefined,
    });

    // Limpa
    setLinhas([]);
    setErros([]);
    setTipoDetectado(null);
    setArquivoNome("");
    if (inputRef.current) inputRef.current.value = "";

    router.refresh();
    router.push(ROTAS_POS_IMPORT[tipoDetectado as TipoTemplate]);
  }

  function handleLimpar() {
    setLinhas([]);
    setErros([]);
    setTipoDetectado(null);
    setArquivoNome("");
    if (inputRef.current) inputRef.current.value = "";
  }

  // ------------------- render -------------------

  // Passo 1: escolher o tipo
  if (!tipoSelecionado) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium">O que você quer importar?</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(TEMPLATES) as TipoTemplate[]).map((tipo) => {
            const t = TEMPLATES[tipo];
            const Icone = ICONES_TIPO[tipo];
            return (
              <button
                key={tipo}
                type="button"
                onClick={() => selecionarTipo(tipo)}
                className="flex items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg">
                  {t.icone}
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{t.titulo}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t.descricao}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Passo 2 e 3: download do template + upload
  const template = TEMPLATES[tipoSelecionado];
  const IconeTipo = ICONES_TIPO[tipoSelecionado];

  return (
    <div className="space-y-4">
      {/* Voltar para seleção */}
      <button
        type="button"
        onClick={() => setTipoSelecionado(null)}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Escolher outro tipo
      </button>

      {/* Cabeçalho do tipo selecionado */}
      <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-lg">
          {template.icone}
        </div>
        <div>
          <p className="font-medium">{template.titulo}</p>
          <p className="text-xs text-muted-foreground">
            {template.descricao}
          </p>
        </div>
      </div>

      {/* Download do template */}
      <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="size-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Baixe o modelo</p>
            <p className="text-xs text-muted-foreground">
              Abra no Excel ou Google Sheets, preencha, salve como CSV
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => baixarTemplate(tipoSelecionado)}
        >
          <Download className="size-4" />
          Baixar
        </Button>
      </div>

      {/* Colunas esperadas */}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Ver colunas esperadas
        </summary>
        <ul className="mt-2 space-y-1 rounded-lg bg-muted/50 p-3 text-xs">
          {template.colunas.map((c) => (
            <li key={c.nome} className="flex gap-2">
              <code className="rounded bg-background px-1.5 py-0.5 font-mono">
                {c.nome}
              </code>
              {c.obrigatorio && (
                <span className="text-rose-600">* obrigatório</span>
              )}
              <span className="text-muted-foreground">{c.explicacao}</span>
            </li>
          ))}
        </ul>
      </details>

      {/* Zona de upload */}
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
            Arquivo .csv preenchido a partir do modelo
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

      {/* Erros de leitura */}
      {erros.length > 0 && (
        <div className="space-y-2 rounded-lg bg-amber-50 p-3 text-sm">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="size-4 shrink-0" />
            <span>{erros.length} linha(s) não puderam ser lidas:</span>
          </div>
          <ul className="max-h-32 overflow-y-auto text-xs text-amber-700">
            {erros.slice(0, 10).map((e, i) => (
              <li key={i}>• {e.mensagem}</li>
            ))}
            {erros.length > 10 && (
              <li>• ... e mais {erros.length - 10} erro(s)</li>
            )}
          </ul>
        </div>
      )}

      {/* Preview das linhas */}
      {linhas.length > 0 && (
        <Card className="border-primary/20">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">
                    {linhas.length} linha(s) pronta(s)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {arquivoNome}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLimpar}>
                Limpar
              </Button>
            </div>

            {/* Preview das primeiras linhas */}
            <div className="max-h-60 overflow-y-auto rounded-lg border">
              <ul className="divide-y text-sm">
                {linhas.slice(0, 20).map((l, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {l.nome ||
                          l.cliente_nome ||
                          l.descricao ||
                          l.material ||
                          l.categoria ||
                          "Linha"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {l.data && formatarData(l.data)}
                        {l.data_inicio && `Início ${formatarData(l.data_inicio)}`}
                        {l.tipo && ` • ${l.tipo}`}
                        {l.empreendimento && ` • ${l.empreendimento}`}
                        {l.peso_kg && ` • ${l.peso_kg}kg`}
                      </p>
                    </div>
                    {(l.valor || l.valor_principal || l.preco_por_kg) && (
                      <span className="num-moeda shrink-0 font-semibold">
                        {formatarMoeda(l.valor || l.valor_principal || 0)}
                        {l.preco_por_kg && `/kg`}
                      </span>
                    )}
                  </li>
                ))}
                {linhas.length > 20 && (
                  <li className="px-3 py-2 text-center text-xs text-muted-foreground">
                    + {linhas.length - 20} linha(s)...
                  </li>
                )}
              </ul>
            </div>

            <Button
              onClick={handleImportar}
              className="w-full"
              disabled={importando}
            >
              {importando ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Importando {linhas.length}...
                </>
              ) : (
                <>
                  Importar {linhas.length} {tipoSelecionado === "clientes" ? "cliente(s)" : tipoSelecionado === "emprestimos" ? "empréstimo(s)" : "operação(ões)"}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
