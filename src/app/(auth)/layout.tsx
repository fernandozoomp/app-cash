// ============================================================================
// LAYOUT DAS ROTAS PÚBLICAS — (auth)
// ============================================================================
// Layout minimalista para login e cadastro (sem sidebar, sem cabeçalho).
// Apenas centraliza o conteúdo no meio da tela.

import { Wallet } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Se já estiver logado, manda para o dashboard.
  // (Import dinâmico para não poluir este arquivo.)
  const { getCurrentUser } = await import("@/lib/auth/session");
  const { redirect } = await import("next/navigation");
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-background p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
          <Wallet className="size-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{APP_NAME}</h1>
          <p className="text-sm text-muted-foreground">
            Controle financeiro dos seus empreendimentos
          </p>
        </div>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
