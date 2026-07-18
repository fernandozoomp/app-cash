"use client";

// ============================================================================
// CLIENT COMPONENT: gerencia templates na página dedicada
// ============================================================================
// Separei do page.tsx (Server Component) porque tem interatividade.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Copy, Trash2, Lock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm-dialog";
import {
  apagarTemplate,
  duplicarTemplate,
} from "@/app/actions/templates-mensagem";
import { infoCategoria } from "@/lib/cobranca/templates";
import { DialogTemplateEditor } from "@/components/cobranca/dialog-template-editor";
import type { TemplateMensagem } from "@/lib/types/database";

export function GerenciarTemplatesClient({
  templatesIniciais,
}: {
  templatesIniciais: TemplateMensagem[];
}) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [templates, setTemplates] = useState(templatesIniciais);
  const [editando, setEditando] = useState<TemplateMensagem | null>(null);
  const [criando, setCriando] = useState(false);
  const confirmar = useConfirm();

  function recarregar() {
    router.refresh();
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
        recarregar();
      }
    });
  }

  async function handleDuplicar(t: TemplateMensagem) {
    startTransition(async () => {
      const r = await duplicarTemplate(t.id);
      if (r.error) {
        toast.error(r.error);
      } else {
        toast.success("Template duplicado!");
        recarregar();
      }
    });
  }

  return (
    <>
      <Button onClick={() => setCriando(true)} className="mb-4">
        <Plus className="size-4" />
        Criar novo template
      </Button>

      <div className="grid gap-3 sm:grid-cols-2">
        {templates.map((t) => {
          const cat = infoCategoria(t.categoria);
          const protegido = t.criado_pelo_sistema;
          return (
            <Card key={t.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{t.icone}</span>
                    <div>
                      <p className="font-medium">{t.nome}</p>
                      <span
                        className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs ${cat.cor}`}
                      >
                        {cat.icone} {cat.label}
                      </span>
                    </div>
                  </div>
                  {protegido && (
                    <span
                      title="Template do sistema (não editável)"
                      className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      <Lock className="size-3" />
                      padrão
                    </span>
                  )}
                </div>

                <p className="mt-3 line-clamp-4 flex-1 whitespace-pre-wrap rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
                  {t.conteudo}
                </p>

                <div className="mt-3 flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicar(t)}
                    disabled={pendente}
                    className="flex-1"
                  >
                    <Copy className="size-3.5" />
                    Duplicar
                  </Button>
                  {!protegido && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditando(t)}
                        disabled={pendente}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleApagar(t)}
                        disabled={pendente}
                        className="text-muted-foreground hover:text-rose-600"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {templates.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nenhum template. Clique em &quot;Criar novo template&quot;.
        </p>
      )}

      {/* Modais de criação/edição */}
      {criando && (
        <DialogTemplateEditor
          aberto={true}
          onFechar={() => {
            setCriando(false);
            recarregar();
          }}
        />
      )}
      {editando && (
        <DialogTemplateEditor
          aberto={true}
          onFechar={() => {
            setEditando(null);
            recarregar();
          }}
          templateEdicao={editando}
        />
      )}
    </>
  );
}
