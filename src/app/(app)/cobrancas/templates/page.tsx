// ============================================================================
// PÁGINA: GERENCIAR TEMPLATES DE MENSAGEM
// ============================================================================
// Página dedicada (mais espaço que o modal) para criar, editar, duplicar
// e apagar templates de WhatsApp.

import { Sparkles, Plus, Pencil, Copy, Trash2, Lock } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GerenciarTemplatesClient } from "@/components/cobranca/gerenciar-templates-client";
import { listarTemplates } from "@/app/actions/templates-mensagem";

export default async function TemplatesPage() {
  const { data: templates } = await listarTemplates();

  return (
    <>
      <PageHeader
        titulo="Templates de Mensagem"
        descricao="Crie e organize suas mensagens de cobrança"
        acoes={
          <Button asChild variant="ghost" size="sm">
            <Link href="/cobrancas">← Voltar para Cobranças</Link>
          </Button>
        }
      />

      <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="flex items-start gap-3 pt-6">
          <Sparkles className="size-5 shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-medium">Como funcionam os templates?</p>
            <p className="mt-1 text-muted-foreground">
              Use variáveis como{" "}
              <code className="rounded bg-muted px-1 font-mono">{"{{nome}}"}</code>
              ,{" "}
              <code className="rounded bg-muted px-1 font-mono">
                {"{{valor}}"}
              </code>{" "}
              e{" "}
              <code className="rounded bg-muted px-1 font-mono">
                {"{{vencimento}}"}
              </code>{" "}
              — o sistema substitui automaticamente ao enviar. Templates
              marcados como 🔒 são do sistema e não podem ser editados, mas
              podem ser duplicados.
            </p>
          </div>
        </CardContent>
      </Card>

      <GerenciarTemplatesClient templatesIniciais={templates as any} />
    </>
  );
}
