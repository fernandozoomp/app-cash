// ============================================================================
// LAYOUT DAS ROTAS PÚBLICAS — (auth)
// ============================================================================
// Visual moderno inspirado em fintechs brasileiras (Nubank, Inter, C6):
// - Cantos arredondados generosos (radius 1rem = 16px)
// - Sombras quase imperceptíveis (profundidade sutil)
// - Fonte Inter para texto, números em Geist
// - Espaçamentos generosos, respiro branco

import { redirect } from "next/navigation";
import { Wallet, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/constants";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Se já estiver logado, manda direto para o dashboard.
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-verde-50 via-background to-verde-100/40">
      {/* Blobs decorativos sutis no fundo (estilo fintech) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-primary/5 blur-3xl"
      />

      {/* Conteúdo centralizado */}
      <div className="relative flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
        {/* Logo / identidade */}
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Wallet className="size-9" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
            <p className="text-sm text-muted-foreground">
              Seu dinheiro, seus três negócios, no mesmo lugar.
            </p>
          </div>
        </div>

        {/* Formulário (card com cantos suaves e sombra elegante) */}
        <div className="w-full max-w-md">{children}</div>

        {/* Selo de segurança no rodapé */}
        <p className="mt-10 flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          Dados protegidos com criptografia ponta-a-ponta.
        </p>
      </div>
    </div>
  );
}
