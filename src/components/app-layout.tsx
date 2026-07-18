// ============================================================
// APP LAYOUT — A "MOLDURA" DAS PÁGINAS INTERNAS
// ============================================================
// Recebe o email do usuário para mostrar na sidebar.
// Inclui:
//   - Skip link (acessibilidade WCAG 2.4.1): navegação por teclado
//   - Sidebar com logout
//   - Cabeçalho com boas-vindas
//   - Conteúdo principal com âncora para o skip link

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
      {/* Skip link: usuários de teclado/padrão podem pular direto pro
          conteúdo sem precisar tabular por toda a sidebar. */}
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>

      <Sidebar userEmail={userEmail} />

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <div className="pl-12 md:pl-0" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden sm:inline">Bem-vindo 👋</span>
          </div>
        </header>

        {/* id="conteudo" é o destino do skip link acima */}
        <main id="conteudo" className="mx-auto max-w-7xl p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
