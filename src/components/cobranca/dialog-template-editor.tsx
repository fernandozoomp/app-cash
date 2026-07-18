"use client";

// ============================================================================
// DIALOG: EDITOR DE TEMPLATE (criar novo ou editar existente)
// ============================================================================

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  criarTemplate,
  atualizarTemplate,
} from "@/app/actions/templates-mensagem";
import {
  CATEGORIAS_TEMPLATES,
  VARIAVEIS_DISPONIVEIS,
  substituirVariaveis,
  DADOS_EXEMPLO,
} from "@/lib/cobranca/templates";
import type { CategoriaTemplate, TemplateMensagem } from "@/lib/types/database";

const EMOJIS_COMUNS = [
  "💬",
  "🔔",
  "⏰",
  "⚠️",
  "🙏",
  "✅",
  "💰",
  "📱",
  "👍",
  "🎉",
  "💪",
  "🤝",
  "📌",
  "❤️",
  "🔥",
  "⭐",
];

interface Props {
  aberto: boolean;
  onFechar: () => void;
  // Se passar, é edição. Se não, é criação.
  templateEdicao?: TemplateMensagem | null;
}

export function DialogTemplateEditor({ aberto, onFechar, templateEdicao }: Props) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const editando = !!templateEdicao;

  const [nome, setNome] = useState(templateEdicao?.nome || "");
  const [categoria, setCategoria] = useState<CategoriaTemplate>(
    templateEdicao?.categoria || "cobranca",
  );
  const [conteudo, setConteudo] = useState(templateEdicao?.conteudo || "");
  const [icone, setIcone] = useState(templateEdicao?.icone || "💬");

  // Preview ao vivo com dados de exemplo
  const preview = useMemo(
    () => substituirVariaveis(conteudo || "", DADOS_EXEMPLO),
    [conteudo],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !conteudo.trim()) {
      toast.error("Preencha nome e conteúdo.");
      return;
    }

    startTransition(async () => {
      const input = {
        nome: nome.trim(),
        categoria,
        conteudo: conteudo.trim(),
        icone,
      };

      const r = editando
        ? await atualizarTemplate(templateEdicao!.id, input)
        : await criarTemplate(input);

      if (r.error) {
        toast.error(r.error);
        return;
      }

      toast.success(editando ? "Template atualizado!" : "Template criado!");
      router.refresh();
      onFechar();
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editando ? "Editar template" : "Novo template"}
          </DialogTitle>
          <DialogDescription>
            {editando
              ? "Altere os campos e salve."
              : "Crie um template personalizado para usar nas cobranças."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome-tpl">Nome *</Label>
            <Input
              id="nome-tpl"
              placeholder="Ex: Cobrança amigável com PIX"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={categoria}
              onValueChange={(v) => setCategoria(v as CategoriaTemplate)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_TEMPLATES.map((c) => (
                  <SelectItem key={c.valor} value={c.valor}>
                    {c.icone} {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ícone (emoji) */}
          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-1">
              {EMOJIS_COMUNS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcone(e)}
                  className={`flex size-9 items-center justify-center rounded-md text-lg transition-colors ${
                    icone === e
                      ? "bg-primary/20 ring-2 ring-primary"
                      : "bg-muted hover:bg-muted/70"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Conteúdo */}
          <div className="space-y-2">
            <Label htmlFor="conteudo-tpl">Conteúdo *</Label>
            <textarea
              id="conteudo-tpl"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={6}
              required
              placeholder={`Olá {{nome}}! Sua parcela {{parcela}} vence em {{vencimento}}...`}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {/* Variáveis clicáveis */}
            <div className="flex flex-wrap gap-1">
              {VARIAVEIS_DISPONIVEIS.slice(0, 5).map((v) => (
                <button
                  key={v.codigo}
                  type="button"
                  onClick={() =>
                    setConteudo((c) => c + (c ? " " : "") + v.codigo)
                  }
                  title={v.descricao}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs font-mono hover:bg-primary hover:text-primary-foreground"
                >
                  {v.codigo}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {conteudo.trim() && (
            <div className="rounded-lg bg-[#e5ddd5] p-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Preview (com dados de exemplo)
              </p>
              <div className="ml-auto max-w-[85%] rounded-lg bg-[#dcf8c6] p-2.5 text-sm shadow-sm">
                <p className="whitespace-pre-wrap">{preview}</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={onFechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pendente}>
              {pendente ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  {editando ? "Salvar" : "Criar template"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
