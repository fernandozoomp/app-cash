// ============================================================================
// ATALHOS RÁPIDOS — botões grandes para ações comuns
// ============================================================================
// Grid de 4 atalhos grandes e tocáveis (estilo app mobile).
// Cada um leva direto à ação mais comum, reduzindo cliques.

import Link from "next/link";
import { PlusCircle, HandCoins, UserPlus, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Atalho {
  titulo: string;
  descricao: string;
  href: string;
  icone: React.ElementType;
  cor: string; // classes tailwind para fundo + texto do ícone
}

const ATALHOS: Atalho[] = [
  {
    titulo: "Nova venda",
    descricao: "Lançar no caixa",
    href: "/caixa",
    icone: PlusCircle,
    cor: "bg-emerald-100 text-emerald-700",
  },
  {
    titulo: "Novo empréstimo",
    descricao: "Cliente + parcelas",
    href: "/emprestimos",
    icone: HandCoins,
    cor: "bg-amber-100 text-amber-700",
  },
  {
    titulo: "Novo cliente",
    descricao: "Cadastrar",
    href: "/clientes",
    icone: UserPlus,
    cor: "bg-blue-100 text-blue-700",
  },
  {
    titulo: "Importar",
    descricao: "Planilha CSV",
    href: "/importar",
    icone: Upload,
    cor: "bg-violet-100 text-violet-700",
  },
];

export function AtalhosRapidos() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ATALHOS.map((atalho) => {
        const Icone = atalho.icone;
        return (
          <Link key={atalho.href} href={atalho.href} className="group">
            <Card className="h-full border-muted/60 transition-all hover:border-primary/40 hover:shadow-md">
              <CardContent className="flex flex-col items-start gap-3 p-4">
                <div
                  className={`flex size-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${atalho.cor}`}
                >
                  <Icone className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{atalho.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {atalho.descricao}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
