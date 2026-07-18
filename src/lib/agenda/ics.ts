// ============================================================================
// GERADOR DE ARQUIVO .ics (iCalendar — RFC 5545)
// ============================================================================
// Um único arquivo .ics é aceito por Google Calendar, Outlook, Apple Calendar,
// Yahoo, etc. Não precisamos de integração específica — só gerar o formato.

import type { EventoCalendario } from "@/app/actions/agenda";

// --------------------------------------------------------------------------
// Formata data no padrão iCalendar: YYYYMMDDTHHMMSSZ (UTC)
// --------------------------------------------------------------------------
function formatarICSData(dataISO: string, hora?: string | null): string {
  const data = new Date(dataISO + "T" + (hora || "09:00") + ":00");
  // Converte para UTC
  return (
    data.getUTCFullYear() +
    String(data.getUTCMonth() + 1).padStart(2, "0") +
    String(data.getUTCDate()).padStart(2, "0") +
    "T" +
    String(data.getUTCHours()).padStart(2, "0") +
    String(data.getUTCMinutes()).padStart(2, "0") +
    "00Z"
  );
}

// Escapa texto para ICS (vírgulas, ponto-e-vírgula, quebras de linha)
function escaparICS(texto: string): string {
  return (texto || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// --------------------------------------------------------------------------
// Gera o conteúdo completo do arquivo .ics a partir de eventos
// --------------------------------------------------------------------------
export function gerarICS(eventos: EventoCalendario[]): string {
  const agora = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  const linhas: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Meu Caixa//Agenda//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Meu Caixa - Cobranças e Vencimentos",
    "X-WR-TIMEZONE:America/Sao_Paulo",
  ];

  for (const ev of eventos) {
    const inicio = formatarICSData(ev.data, ev.hora);
    // Duração padrão: 30 minutos
    const dataFim = new Date(ev.data + "T" + (ev.hora || "09:00") + ":00");
    dataFim.setMinutes(dataFim.getMinutes() + 30);
    const fim =
      dataFim.getUTCFullYear() +
      String(dataFim.getUTCMonth() + 1).padStart(2, "0") +
      String(dataFim.getUTCDate()).padStart(2, "0") +
      "T" +
      String(dataFim.getUTCHours()).padStart(2, "0") +
      String(dataFim.getUTCMinutes()).padStart(2, "0") +
      "00Z";

    linhas.push(
      "BEGIN:VEVENT",
      `UID:${ev.id}@meucaixa`,
      `DTSTAMP:${agora}`,
      `DTSTART:${inicio}`,
      `DTEND:${fim}`,
      `SUMMARY:${escaparICS(ev.titulo)}`,
    );

    if (ev.descricao) {
      linhas.push(`DESCRIPTION:${escaparICS(ev.descricao)}`);
    }

    linhas.push("END:VEVENT");
  }

  linhas.push("END:VCALENDAR");
  return linhas.join("\r\n");
}

// --------------------------------------------------------------------------
// Dispara o download do arquivo no navegador
// --------------------------------------------------------------------------
export function baixarICS(conteudo: string, nomeArquivo = "agenda-meu-caixa.ics") {
  const blob = new Blob([conteudo], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
