"use client";

// ============================================================================
// DIALOG: EDITOR DE MENSAGEM WHATSAPP
// ============================================================================
// Substitui o "abre direto no WhatsApp" por um modal onde você:
//   1. Escolhe um template no dropdown
//   2. Vê a mensagem pré-preenchida (variáveis já substituídas)
//   3. Edita o texto livremente antes de enviar
//   4. Manda pro WhatsApp + registra a cobrança
//
// Visual do preview imita um balão de WhatsApp (fundo verde-bege).

import { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Send,
  Sparkles,
  ChevronDown,
  Wand2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listarTemplates,
} from "@/app/actions/templates-mensagem";
import { registrarCobranca } from "@/app/actions/cobrancas";
import {
  substituirVariaveis,
  VARIAVEIS_DISPONIVEIS,
  type DadosVariaveis,
} from "@/lib/cobranca/templates";
import {
  gerarLinkWhatsApp,
  limparTelefone,
} from "@/lib/cobranca/mensagem";
import type { TemplateMensagem } from "@/lib/types/database";

interface Props {
  aberto: boolean;
  onFechar: () => void;
  // Dados da parcela + cliente
  parcelaId: string;
  nomeCliente: string;
  telefone: string | null;
  dados: DadosVariaveis;
  // Template inicial sugerido (opcional)
  templateInicialId?: string;
}

export function DialogMensagem({
  aberto,
  onFechar,
  parcelaId,
  nomeCliente,
  telefone,
  dados,
  templateInicialId,
}: Props) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [templates, setTemplates] = useState<TemplateMensagem[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [mensagem, setMensagem] = useState<string>("");

  // Carrega os templates quando o modal abre
  useEffect(() => {
    if (!aberto) return;
    listarTemplates().then((r) => {
      const lista = (r.data || []) as TemplateMensagem[];
      setTemplates(lista);
      // Seleciona o template inicial ou o primeiro
      const inicial =
        (templateInicialId && lista.find((t) => t.id === templateInicialId)) ||
        lista[0];
      if (inicial) {
        setTemplateId(inicial.id);
        setMensagem(substituirVariaveis(inicial.conteudo, dados));
      }
    });
  }, [aberto, templateInicialId, dados]);

  // Quando troca de template, substitui variáveis e atualiza mensagem
  function trocarTemplate(novoId: string) {
    setTemplateId(novoId);
    const t = templates.find((x) => x.id === novoId);
    if (t) {
      setMensagem(substituirVariaveis(t.conteudo, dados));
    }
  }

  // Conta de caracteres (WhatsApp permite até 4096)
  const numChars = mensagem.length;

  // Não pode enviar se não tem telefone ou mensagem vazia
  const semTelefone = !telefone;
  const podeEnviar = mensagem.trim().length > 0 && !semTelefone && !pendente;

  function handleEnviar() {
    if (semTelefone) {
      toast.error("Este cliente não tem telefone cadastrado.");
      return;
    }
    if (!mensagem.trim()) {
      toast.error("A mensagem está vazia.");
      return;
    }

    const tel = limparTelefone(telefone!);
    const link = gerarLinkWhatsApp(tel, mensagem);

    // Abre WhatsApp em nova aba
    window.open(link, "_blank", "noopener,noreferrer");

    // Registra a cobrança
    startTransition(async () => {
      const r = await registrarCobranca({
        parcela_id: parcelaId,
        canal: "whatsapp",
        mensagem,
      });
      if (!r.error) {
        toast.success("Cobrança registrada!", {
          description: "WhatsApp aberto em nova aba.",
        });
        onFechar();
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="size-5 text-primary" />
            Enviar mensagem
          </DialogTitle>
          <DialogDescription>
            Para {nomeCliente}
            {telefone && (
              <span className="ml-1 text-muted-foreground">
                • {telefone}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {semTelefone && (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            ⚠️ Este cliente não tem telefone. Edite o cadastro para adicionar.
          </div>
        )}

        {/* Seletor de template */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-sm">
            <Sparkles className="size-3.5 text-primary" />
            Template
          </Label>
          <Select value={templateId} onValueChange={trocarTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  <span className="mr-1">{t.icone}</span>
                  {t.nome}
                  {t.criado_pelo_sistema && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (padrão)
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Editor da mensagem */}
        <div className="space-y-2">
          <Label className="text-sm">Mensagem (editável)</Label>
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            rows={7}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Digite a mensagem..."
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{numChars} caracteres</span>
            <span>Máx 4096</span>
          </div>
        </div>

        {/* Variáveis clicáveis (inserção rápida) */}
        <details className="text-sm">
          <summary className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Wand2 className="size-3.5" />
            Inserir variável (mostra preview)
          </summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {VARIAVEIS_DISPONIVEIS.map((v) => (
              <button
                key={v.codigo}
                type="button"
                onClick={() => setMensagem((m) => m + " " + v.codigo)}
                title={v.descricao}
                className="rounded-full bg-muted px-2 py-1 text-xs font-mono hover:bg-primary hover:text-primary-foreground"
              >
                {v.codigo}
              </button>
            ))}
          </div>
        </details>

        {/* Preview estilo balão de WhatsApp */}
        {mensagem.trim() && (
          <div className="rounded-lg bg-[#e5ddd5] p-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Preview
            </p>
            <div className="ml-auto max-w-[85%] rounded-lg bg-[#dcf8c6] p-2.5 text-sm shadow-sm">
              <p className="whitespace-pre-wrap">{mensagem}</p>
              <p className="mt-1 text-right text-[10px] text-muted-foreground">
                {new Date().toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                ✓✓
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleEnviar}
            disabled={!podeEnviar}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {pendente ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="size-4" />
                Enviar WhatsApp
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
