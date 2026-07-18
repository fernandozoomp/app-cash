// ============================================================
// APP LAYOUT — A "MOLDURA" DAS PÁGINAS INTERNAS
// ============================================================
// Este componente envolve o conteúdo de cada página:
//   [Sidebar] | [Topo + Conteúdo]
// Recebe o email do usuário para mostrar na sidebar.

import { Sidebar } from "@/components/sidebar";

export function AppLayout({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string | null;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar userEmail={userEmail} />

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <div className="pl-12 md:pl-0">{/* espaço p/ botão menu mobile */}</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden sm:inline">Bem-vindo 👋</span>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
