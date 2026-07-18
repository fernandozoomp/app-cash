"use client";

// ============================================================================
// DIALOG: GERENCIAR TEMPLATES
// ============================================================================
// Lista todos os templates em cards, com ações:
//   - Criar novo
//   - Editar (próprios)
//   - Duplicar (qualquer um, inclusive padrão)
//   - Excluir (só próprios; padrão é intocável)

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Copy,
  Trash2,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm-dialog";
import {
  listarTemplates,
  apagarTemplate,
  duplicarTemplate,
} from "@/app/actions/templates-mensagem";
import { infoCategoria } from "@/lib/cobranca/templates";
import { DialogTemplateEditor } from "@/components/cobranca/dialog-template-editor";
import type { TemplateMensagem } from "@/lib/types/database";

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

export function DialogGerenciarTemplates({ aberto, onFechar }: Props) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [carregando, setCarregando] = useState(true);
  const [templates, setTemplates] = useState<TemplateMensagem[]>([]);
  const [editando, setEditando] = useState<TemplateMensagem | null>(null);
  const [criando, setCriando] = useState(false);
  const confirmar = useConfirm();

  useEffect(() => {
    if (!aberto) return;
    setCarregando(true);
    carregar();
  }, [aberto]);

  function carregar() {
    listarTemplates().then((r) => {
      setTemplates((r.data || []) as TemplateMensagem[]);
      setCarregando(false);
    });
  }

  async function handleApagar(t: TemplateMensagem) {
    const ok = await confirmar({
      titulo: `Apagar "${t.nome}"?`,
      descricao: "Esta ação não pode ser desfeita.",
      textoConfirmar: "Apagar",
      perigoso: true,
    });
    if (!ok) return;

    startTransition(async () => {
      const r = await apagarTemplate(t.id);
      if (r.error) {
        toast.error(r.error);
      } else {
        toast.success("Template apagado.");
        carregar();
        router.refresh();
      }
    });
  }

  async function handleDuplicar(t: TemplateMensagem) {
    startTransition(async () => {
      const r = await duplicarTemplate(t.id);
      if (r.error) {
        toast.error(r.error);
      } else {
        toast.success("Template duplicado! Agora você pode editá-lo.");
        carregar();
        router.refresh();
      }
    });
  }

  return (
    <>
      <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              Gerenciar templates
            </DialogTitle>
            <DialogDescription>
              Crie, edite e organize suas mensagens de cobrança.
            </DialogDescription>
          </DialogHeader>

          {/* Botão criar */}
          <Button
            onClick={() => setCriando(true)}
            className="w-full sm:w-auto sm:self-start"
          >
            <Plus className="size-4" />
            Criar novo template
          </Button>

          {/* Lista */}
          {carregando ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum template. Clique em &quot;Criar novo&quot;.
            </p>
          ) : (
            <ul className="space-y-2">
              {templates.map((t) => {
                const cat = infoCategoria(t.categoria);
                const protegido = t.criado_pelo_sistema;
                return (
                  <li
                    key={t.id}
                    className="rounded-lg border p-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{t.icone}</span>
                          <p className="font-medium">{t.nome}</p>
                          {protegido && (
                            <span
                              title="Template do sistema (intocável)"
                              className="flex items-center gap-0.5 text-xs text-muted-foreground"
                            >
                              <Lock className="size-3" />
                              padrão
                            </span>
                          )}
                        </div>
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${cat.cor}`}
                        >
                          {cat.icone} {cat.label}
                        </span>
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                          {t.conteudo}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDuplicar(t)}
                          disabled={pendente}
                          title="Duplicar"
                          className="h-8 w-8"
                        >
                          <Copy className="size-3.5" />
                        </Button>
                        {!protegido && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditando(t)}
                              disabled={pendente}
                              title="Editar"
                              className="h-8 w-8"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleApagar(t)}
                              disabled={pendente}
                              title="Apagar"
                              className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="text-center text-xs text-muted-foreground">
            {templates.length} template(s) • {templates.filter((t) => t.criado_pelo_sistema).length}{" "}
            do sistema (não editáveis)
          </p>
        </DialogContent>
      </Dialog>

      {/* Editor (criar) */}
      {criando && (
        <DialogTemplateEditor
          aberto={true}
          onFechar={() => {
            setCriando(false);
            carregar();
          }}
        />
      )}

      {/* Editor (editar) */}
      {editando && (
        <DialogTemplateEditor
          aberto={true}
          onFechar={() => {
            setEditando(null);
            carregar();
          }}
          templateEdicao={editando}
        />
      )}
    </>
  );
}
