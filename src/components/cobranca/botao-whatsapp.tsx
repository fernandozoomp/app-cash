"use client";

// ============================================================================
// BOTÃO WHATSAPP — abre editor de mensagem antes de enviar
// ============================================================================
// Fluxo atualizado (com templates):
//   1. Clica no botão
//   2. Abre DialogMensagem com template pré-selecionado
//   3. Usuário edita a mensagem se quiser
//   4. Clica em "Enviar WhatsApp"
//   5. WhatsApp abre + registra cobrança

import { useState } from "react";
import { MessageCircle, PhoneOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogMensagem } from "@/components/cobranca/dialog-mensagem";
import { descreverUltimaCobranca } from "@/lib/cobranca/mensagem";
import type { DadosVariaveis } from "@/lib/cobranca/templates";

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
  size?: "default" | "sm";
  // Categoria sugerida para pré-selecionar template (ex: "aviso" se atrasada)
  templateCategoriaSugerida?: "cobranca" | "lembrete" | "aviso";
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
  const [aberto, setAberto] = useState(false);
  const semTelefone = !telefone;

  // Dados para substituir as variáveis do template
  const dados: DadosVariaveis = {
    nome: nomeCliente,
    parcela: numeroParcela,
    total_parcelas: totalParcelas,
    valor,
    valor_pago: valorPago,
    vencimento,
  };

  return (
    <>
      <Button
        type="button"
        size={size}
        onClick={() => setAberto(true)}
        disabled={semTelefone}
        className="bg-emerald-600 text-white hover:bg-emerald-700"
        title={
          semTelefone
            ? "Cliente sem telefone"
            : `Última cobrança: ${descreverUltimaCobranca(ultimaCobranca)}`
        }
      >
        {semTelefone ? (
          <PhoneOff className="size-4" />
        ) : (
          <MessageCircle className="size-4" />
        )}
        <span className="hidden sm:inline">Cobrar</span>
      </Button>

      <DialogMensagem
        aberto={aberto}
        onFechar={() => setAberto(false)}
        parcelaId={parcelaId}
        nomeCliente={nomeCliente}
        telefone={telefone}
        dados={dados}
      />
    </>
  );
}
