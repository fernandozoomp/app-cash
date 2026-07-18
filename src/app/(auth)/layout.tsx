// ============================================================================
// LAYOUT DAS ROTAS PÚBLICAS — (auth)
// ============================================================================
// Layout minimalista para login e cadastro (sem sidebar, sem cabeçalho).
// Visual acolhedor com gradiente e identidade do app.

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
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-verde-50 via-background to-verde-100/50">
      {/* Conteúdo centralizado verticalmente */}
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        {/* Logo / identidade */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Wallet className="size-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Seu dinheiro, seus três negócios, no mesmo lugar.
            </p>
          </div>
        </div>

        {/* Formulário */}
        <div className="w-full max-w-md">{children}</div>

        {/* Selo de segurança no rodapé */}
        <p className="mt-8 flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          Dados protegidos com criptografia ponta-a-ponta.
        </p>
      </div>
    </div>
  );
}
