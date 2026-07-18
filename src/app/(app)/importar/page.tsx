// ============================================================================
// PÁGINA: IMPORTAR — Importação em lote via CSV
// ============================================================================
// Página dedicada para a feature de importação. Aqui o usuário escolhe o
// tipo de operação (clientes, caixa, sucatas, empréstimos), baixa o template,
// preenche, e faz upload.

import { Upload } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CSVUpload } from "@/components/forms/csv-upload";

export default function ImportarPage() {
  return (
    <>
      <PageHeader
        titulo="Importar Planilha"
        descricao="Traga suas operações em lote via CSV"
      />

      {/* Aviso explicativo no topo */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="flex items-start gap-3 pt-6">
          <Upload className="size-5 shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-medium">Como funciona?</p>
            <ol className="mt-2 space-y-1 text-muted-foreground">
              <li>
                <strong>1.</strong> Escolha o tipo de operação que quer importar
              </li>
              <li>
                <strong>2.</strong> Baixe o modelo de planilha
              </li>
              <li>
                <strong>3.</strong> Preencha no Excel ou Google Sheets, salve
                como CSV
              </li>
              <li>
                <strong>4.</strong> Faça upload aqui — o sistema valida tudo
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <CSVUpload />
        </CardContent>
      </Card>
    </>
  );
}
