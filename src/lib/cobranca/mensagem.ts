// ============================================================================
// GERADOR DE MENSAGENS DE COBRANÇA + LINK WHATSAPP
// ============================================================================
// Cria mensagens personalizadas para cada situação (vencendo, atrasada, etc.)
// e gera o link wa.me oficial do WhatsApp (dentro dos termos de uso).

import { formatarMoeda, formatarData } from "@/lib/constants";

// --------------------------------------------------------------------------
// LIMPA TELEFONE — remove tudo que não é dígito e adiciona código do Brasil
// --------------------------------------------------------------------------
// " (11) 99999-9999 " → "5511999999999"
export function limparTelefone(telefone: string): string {
  if (!telefone) return "";
  const digitos = telefone.replace(/\D/g, "");

  // Se já tem código do país (55), mantém
  if (digitos.startsWith("55") && digitos.length >= 12) return digitos;

  // Se é 11 ou 10 dígitos (DDD + número brasileiro), adiciona 55 na frente
  if (digitos.length === 11 || digitos.length === 10) {
    return "55" + digitos;
  }

  // Outros casos: retorna como está
  return digitos;
}

// --------------------------------------------------------------------------
// GERA O LINK wa.me OFICIAL
// --------------------------------------------------------------------------
// Ex: https://wa.me/5511999999999?text=Olá!...
export function gerarLinkWhatsApp(
  telefone: string,
  mensagem: string,
): string {
  const tel = limparTelefone(telefone);
  const texto = encodeURIComponent(mensagem);
  return `https://wa.me/${tel}?text=${texto}`;
}

// --------------------------------------------------------------------------
// GERA A MENSAGEM DE COBRANÇA
// --------------------------------------------------------------------------
// Estilo automático: amigável para quem está em dia / firme para atrasados.

export interface DadosParaMensagem {
  nomeCliente: string;
  numeroParcela: number;
  totalParcelas: number;
  valor: number; // valor da parcela
  valorPago?: number; // se já pagou parte
  vencimento: string; // ISO date
  status: "pendente" | "atrasada" | "parcial";
}

export function gerarMensagemCobranca(dados: DadosParaMensagem): string {
  const vencimentoFormatado = formatarData(dados.vencimento);
  const eAtrasada = dados.status === "atrasada";
  const eParcial = dados.status === "parcial";

  const linhaValor = eParcial
    ? `Valor da parcela: ${formatarMoeda(dados.valor)}\nJá pago: ${formatarMoeda(
        dados.valorPago || 0,
      )}\nFaltam: ${formatarMoeda(dados.valor - (dados.valorPago || 0))}`
    : `Valor: ${formatarMoeda(dados.valor)}`;

  // Saudação
  const saudacao = `Olá ${dados.nomeCliente}! Tudo bem?`;

  // Corpo conforme situação
  if (eAtrasada) {
    return (
      `${saudacao}\n\n` +
      `Estou passando para lembrar que a parcela ${dados.numeroParcela}/${dados.totalParcelas} do empréstimo está em atraso.\n` +
      `Vencimento era dia ${vencimentoFormatado}.\n${linhaValor}\n\n` +
      `Quando puder efetuar o pagamento, me avise. Se tiver alguma dificuldade, podemos conversar. 🙏`
    );
  }

  if (eParcial) {
    return (
      `${saudacao}\n\n` +
      `Sua parcela ${dados.numeroParcela}/${dados.totalParcelas} vence em ${vencimentoFormatado}.\n` +
      `${linhaValor}\n\n` +
      `Se já efetuou o pagamento, pode desconsiderar este aviso. Obrigado! 🙏`
    );
  }

  // Pendente (ainda não venceu ou vence hoje)
  return (
    `${saudacao}\n\n` +
    `Lembrete amigável: sua parcela ${dados.numeroParcela}/${dados.totalParcelas} vence em ${vencimentoFormatado}.\n` +
    `${linhaValor}\n\n` +
    `Se já pagou, pode ignorar. Qualquer coisa, me avise! 🙏`
  );
}

// --------------------------------------------------------------------------
// DESCRIÇÃO CURTA DO INTERVALO DA ÚLTIMA COBRANÇA
// --------------------------------------------------------------------------
// "há 2 dias", "há 3 horas", "nunca"
export function descreverUltimaCobranca(
  ultimaCobranca: string | null | undefined,
): string {
  if (!ultimaCobranca) return "nunca cobrada";

  const agora = new Date();
  const ultima = new Date(ultimaCobranca);
  const diffMs = agora.getTime() - ultima.getTime();
  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDias = Math.floor(diffHoras / 24);

  if (diffHoras < 1) return "há poucos minutos";
  if (diffHoras < 24) return `há ${diffHoras}h`;
  if (diffDias === 1) return "ontem";
  if (diffDias < 7) return `há ${diffDias} dias`;
  if (diffDias < 30) return `há ${Math.floor(diffDias / 7)} semana(s)`;
  return `há ${Math.floor(diffDias / 30)} mês(es)`;
}
