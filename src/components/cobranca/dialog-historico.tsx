"use client";

// ============================================================================
// DIALOG DE HISTÓRICO DE COBRANÇAS
// ============================================================================
// Mostra todas as cobranças já feitas de uma parcela em formato timeline.

import { useEffect, useState } from "react";
import { Clock, MessageCircle, Phone, User, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { listarHistoricoCobrancas } from "@/app/actions/cobrancas";

interface Props {
  aberto: boolean;
  onFechar: () => void;
  parcelaId: string;
  nomeCliente: string;
  numero: number;
}

const ICONES_CANAL: Record<string, typeof MessageCircle> = {
  whatsapp: MessageCircle,
  presencial: User,
  telefone: Phone,
  outros: Clock,
};

export function DialogHistorico({
  aberto,
  onFechar,
  parcelaId,
  nomeCliente,
  numero,
}: Props) {
  const [carregando, setCarregando] = useState(true);
  const [cobrancas, setCobrancas] = useState<any[]>([]);

  useEffect(() => {
    if (!aberto) return;
    setCarregando(true);
    listarHistoricoCobrancas(parcelaId).then((r) => {
      setCobrancas(r.data || []);
      setCarregando(false);
    });
  }, [aberto, parcelaId]);

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Histórico de cobranças</DialogTitle>
          <DialogDescription>
            Parcela {numero} de {nomeCliente}
          </DialogDescription>
        </DialogHeader>

        {carregando ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : cobrancas.length === 0 ? (
          <EmptyState
            titulo="Nenhuma cobrança ainda"
            descricao="As cobranças aparecem aqui quando você enviar lembretes."
            icone="calendar"
            compacto
          />
        ) : (
          <ol className="relative space-y-3 border-l-2 border-muted pl-4">
            {cobrancas.map((c: any) => {
              const Icone = ICONES_CANAL[c.canal] || Clock;
              const data = new Date(c.data);
              return (
                <li key={c.id} className="relative">
                  {/* Bolinha do timeline */}
                  <span className="absolute -left-[21px] flex size-4 items-center justify-center rounded-full bg-primary ring-2 ring-background">
                    <span className="size-1.5 rounded-full bg-primary-foreground" />
                  </span>

                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icone className="size-3.5 text-muted-foreground" />
                        <Badge variant="outline" className="capitalize text-xs">
                          {c.canal}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {data.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {c.mensagem && (
                      <p className="mt-2 line-clamp-3 text-xs italic text-muted-foreground">
                        “{c.mensagem}”
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {cobrancas.length > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            {cobrancas.length} cobrança(s) registrada(s)
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
