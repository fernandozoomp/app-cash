"use client";

// ============================================================================
// CONFIRM DIALOG — Confirmação bonita (substitui o confirm() do navegador)
// ============================================================================
// O confirm() do navegador é feio, não estilizável, e diferente em cada
// sistema operacional. Este componente oferece a mesma função com visual
// consistente ao app. Resolve U6 do diagnóstico.
//
// USO:
//   const confirmar = useConfirm();
//   if (await confirmar({ titulo: "Apagar?", descricao: "Não dá pra desfazer" })) {
//     // usuário confirmou
//   }

import { useState, useCallback, createContext, useContext } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

type OpcoesConfirm = {
  titulo: string;
  descricao?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  perigoso?: boolean; // true = botão vermelho (exclusão)
};

type ConfirmContextValue = (opcoes: OpcoesConfirm) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue>(() =>
  Promise.resolve(false),
);

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<{
    aberto: boolean;
    opcoes: OpcoesConfirm;
    resolver?: (valor: boolean) => void;
    carregando: boolean;
  }>({
    aberto: false,
    opcoes: { titulo: "" },
    carregando: false,
  });

  const confirmar = useCallback((opcoes: OpcoesConfirm) => {
    return new Promise<boolean>((resolve) => {
      setEstado({ aberto: true, opcoes, resolver: resolve, carregando: false });
    });
  }, []);

  function fechar(valor: boolean) {
    estado.resolver?.(valor);
    setEstado((s) => ({ ...s, aberto: false }));
  }

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      <Dialog
        open={estado.aberto}
        onOpenChange={(o) => !o && fechar(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            {estado.opcoes.perigoso && (
              <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="size-6 text-destructive" />
              </div>
            )}
            <DialogTitle>{estado.opcoes.titulo}</DialogTitle>
            {estado.opcoes.descricao && (
              <DialogDescription>{estado.opcoes.descricao}</DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => fechar(false)}>
              {estado.opcoes.textoCancelar || "Cancelar"}
            </Button>
            <Button
              variant={estado.opcoes.perigoso ? "destructive" : "default"}
              onClick={() => fechar(true)}
              disabled={estado.carregando}
            >
              {estado.carregando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                estado.opcoes.textoConfirmar || "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
