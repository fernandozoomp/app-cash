// ============================================================
// PAGE HEADER — TÍTULO PADRÃO NO TOPO DE CADA PÁGINA
// ============================================================
// Em vez de repetir a mesma estrutura de título em todas as
// páginas, criamos este componente. Todas as páginas internas
// começam com <PageHeader titulo="..." descricao="..." />.

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  titulo: string;
  descricao?: string;
  // "ações" são botões/elementos que ficam à direita do título
  // (ex: botão "Novo empréstimo"). Opcional.
  acoes?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  titulo,
  descricao,
  acoes,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {titulo}
        </h1>
        {descricao && (
          <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
        )}
      </div>
      {acoes && <div className="flex items-center gap-2">{acoes}</div>}
    </div>
  );
}
