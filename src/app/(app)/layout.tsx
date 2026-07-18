// ============================================================================
// LAYOUT DAS ROTAS PROTEGIDAS — (app)
// ============================================================================
// Este layout envolve TODAS as páginas internas (dashboard, caixa,
// empréstimos, etc). Aqui verificamos se o usuário está logado.
// Se NÃO estiver, redirecionamos para /login.
//
// Os parênteses no nome "(app)" significam: route group. Não afeta o
// endereço web — a página continua sendo /caixa, não /(app)/caixa.

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AppLayout } from "@/components/app-layout";

export default async function AppLayoutGroup({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server Component: a verificação roda no servidor, segura.
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <AppLayout userEmail={user.email}>{children}</AppLayout>;
}
