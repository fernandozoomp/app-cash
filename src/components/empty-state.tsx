// ============================================================================
// EMPTY STATE — Estado vazio amigável
// ============================================================================
// Quando uma lista não tem itens, mostramos uma mensagem acolhedora em vez
// de um "Nenhum registro" frio. Resolve D3 do diagnóstico.
// Inspirado no content-humanizer: específico, empático, com próxima ação.

import {
  Wallet,
  Users,
  HandCoins,
  Calendar,
  Recycle,
  type LucideIcon,
} from "lucide-react";

const ICONES: Record<string, LucideIcon> = {
  wallet: Wallet,
  users: Users,
  "hand-coins": HandCoins,
  calendar: Calendar,
  recycle: Recycle,
};

interface Props {
  titulo: string;
  descricao?: string;
  icone?: keyof typeof ICONES | string;
  acao?: React.ReactNode;
  /** Compacto = para uso dentro de cards. Default = destaque maior. */
  compacto?: boolean;
}

export function EmptyState({
  titulo,
  descricao,
  icone = "wallet",
  acao,
  compacto = false,
}: Props) {
  const Icone = ICONES[icone as string] || Wallet;

  if (compacto) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <Icone className="size-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
        {descricao && (
          <p className="max-w-xs text-xs text-muted-foreground/70">{descricao}</p>
        )}
      </div>
    );
  }

  return (
    <div className="animate-in-soft flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <Icone className="size-8 text-muted-foreground/60" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold">{titulo}</p>
        {descricao && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {descricao}
          </p>
        )}
      </div>
      {acao && <div className="mt-2">{acao}</div>}
    </div>
  );
}
