"use client";

// ============================================================
// BARRA LATERAL (SIDEBAR)
// ============================================================
// Este componente é o menu lateral que aparece em todas as
// páginas. No celular ele fica escondido e abre ao tocar no
// botão de menu (≡). No computador ele aparece fixo.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Menu, Wallet, X, LogOut, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { APP_NAME, ITENS_MENU } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { sair } from "@/app/actions/auth";

export function Sidebar({ userEmail }: { userEmail?: string | null }) {
  // usePathname() nos dá o endereço atual (ex: "/caixa").
  // Usamos para destacar qual item do menu está ativo.
  const pathname = usePathname();

  // No celular a sidebar começa fechada. Este estado controla
  // se ela está aberta (true) ou fechada (false).
  const [aberta, setAberta] = useState(false);
  const [pendente, startTransition] = useTransition();

  function handleSair() {
    startTransition(async () => {
      await sair();
    });
  }

  return (
    <>
      {/* ---------------------------------------------------
          BOTÃO DE MENU (só aparece no celular)
          As classes "md:hidden" significam: mostre só em
          telas menores que 768px (celular). Em telas maiores,
          a sidebar fica sempre visível.
         --------------------------------------------------- */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={() => setAberta(true)}
        aria-label="Abrir menu"
      >
        <Menu className="size-6" />
      </Button>

      {/* ---------------------------------------------------
          OVERLAY (fundo escuro no celular quando o menu abre)
          Aparece só quando "aberta" é true. Ao tocar, fecha.
         --------------------------------------------------- */}
      {aberta && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setAberta(false)}
        />
      )}

      {/* ---------------------------------------------------
          A SIDEBAR EM SI
          - No celular: desliza da esquerda quando "aberta"
          - No computador (md:): fixa na esquerda sempre visível
         --------------------------------------------------- */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform duration-200 md:translate-x-0",
          aberta ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* LOGO / NOME DO APP */}
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Wallet className="size-5 text-emerald-600" />
            <span className="text-lg">{APP_NAME}</span>
          </Link>
          {/* Botão de fechar (só no celular) */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setAberta(false)}
            aria-label="Fechar menu"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* LISTA DE ITENS DO MENU */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {ITENS_MENU.map((item) => {
            const Icone = item.icone;
            // Item está ativo se o endereço atual começa com o
            // href do item. A home ("/") é caso especial para
            // não destacar sempre que estiver em qualquer lugar.
            const ativo =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAberta(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  ativo
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <Icone className="size-4 shrink-0" />
                <span>{item.titulo}</span>
              </Link>
            );
          })}
        </nav>

        {/* RODAPÉ DA SIDEBAR */}
        <div className="border-t p-4 space-y-3">
          {userEmail && (
            <div className="px-2 text-xs">
              <p className="text-sidebar-foreground/60">Logado como</p>
              <p className="truncate font-medium text-sidebar-foreground">
                {userEmail}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSair}
            disabled={pendente}
            className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {pendente ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            Sair
          </Button>
          <p className="px-2 text-[11px] text-sidebar-foreground/40">
            v0.1 • Meu Caixa
          </p>
        </div>
      </aside>
    </>
  );
}
