"use client";

// ============================================================================
// BOTÃO WHATSAPP — abre conversa com mensagem pronta + registra cobrança
// ============================================================================
// Ao clicar:
//   1. Gera o link wa.me com a mensagem personalizada
//   2. Abre o WhatsApp em nova aba
//   3. Chama a Server Action registrarCobranca (silenciosamente)
//   4. Mostra confirmação visual
//
// Se o cliente não tem telefone, desabilita e avisa.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageCircle, PhoneOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  gerarLinkWhatsApp,
  gerarMensagemCobranca,
  descreverUltimaCobranca,
} from "@/lib/cobranca/mensagem";
import { registrarCobranca } from "@/app/actions/cobrancas";

interface Props {
  parcelaId: string;
  nomeCliente: string;
  telefone: string | null;
  numeroParcela: number;
  totalParcelas: number;
  valor: number;
  valorPago?: number;
  vencimento: string;
  status: "pendente" | "atrasada" | "parcial";
  ultimaCobranca?: string | null;
  // Tamanho do botão: "default" para uso em tabelas, "sm" para cards compactos
  size?: "default" | "sm";
}

export function BotaoWhatsApp({
  parcelaId,
  nomeCliente,
  telefone,
  numeroParcela,
  totalParcelas,
  valor,
  valorPago = 0,
  vencimento,
  status,
  ultimaCobranca,
  size = "sm",
}: Props) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const semTelefone = !telefone;

  // Gera a mensagem UMA vez ao montar (não muda entre renders)
  const mensagem = gerarMensagemCobranca({
    nomeCliente,
    numeroParcela,
    totalParcelas,
    valor,
    valorPago,
    vencimento,
    status,
  });

  function handleClick() {
    if (semTelefone) {
      toast.error("Este cliente não tem telefone cadastrado.", {
        description: "Edite o cliente para adicionar um WhatsApp.",
      });
      return;
    }

    const link = gerarLinkWhatsApp(telefone!, mensagem);

    // Abre o WhatsApp em nova aba
    window.open(link, "_blank", "noopener,noreferrer");

    // Registra a cobrança silenciosamente
    startTransition(async () => {
      const r = await registrarCobranca({
        parcela_id: parcelaId,
        canal: "whatsapp",
        mensagem,
      });
      if (!r.error) {
        toast.success("Cobrança registrada", {
          description: `Última cobrança atualizada.`,
          duration: 2500,
        });
        router.refresh();
      }
    });
  }

  return (
    <Button
      type="button"
      size={size}
      onClick={handleClick}
      disabled={pendente || semTelefone}
      className="bg-emerald-600 text-white hover:bg-emerald-700"
      title={
        semTelefone
          ? "Cliente sem telefone"
          : `Última cobrança: ${descreverUltimaCobranca(ultimaCobranca)}`
      }
    >
      {pendente ? (
        <Loader2 className="size-4 animate-spin" />
      ) : semTelefone ? (
        <PhoneOff className="size-4" />
      ) : (
        <MessageCircle className="size-4" />
      )}
      <span className="hidden sm:inline">Cobrar</span>
    </Button>
  );
}
