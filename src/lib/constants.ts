// ============================================================
// CONFIGURAÇÕES GLOBAIS DO APP
// ============================================================
// Este arquivo centraliza nomes, cores e itens de menu.
// Se quiser mudar o nome do app ou adicionar um novo módulo,
// é só editar aqui — todo o site se atualiza.

import {
  LayoutDashboard,
  Wallet,
  HandCoins,
  Users,
  Wine,
  Recycle,
  FileBarChart,
  type LucideIcon,
} from "lucide-react";

// ------------------------------------------------------------
// IDENTIDADE DO APP
// ------------------------------------------------------------
export const APP_NAME = "Meu Caixa"; // Nome que aparece no topo e na aba do navegador
export const APP_OWNER = "Fernando"; // Nome do usuário logado (vamos conectar ao login depois)

// ------------------------------------------------------------
// OS 3 EMPREENDIMENTOS
// ------------------------------------------------------------
// Usamos um "tipo" (type) para o TypeScript saber que só
// existem essas três opções. Isso evita erros de digitação.
export type Empreendimento = "adega" | "emprestimos" | "sucatas";

export const EMPREENDIMENTOS: Record<
  Empreendimento,
  { label: string; cor: string }
> = {
  adega: { label: "Adega", cor: "text-rose-600" },
  emprestimos: { label: "Empréstimos", cor: "text-amber-600" },
  sucatas: { label: "Sucatas", cor: "text-emerald-600" },
};

// ------------------------------------------------------------
// FORMATAÇÃO EM PORTUGUÊS-BR
// ------------------------------------------------------------
// Funções utilitárias para mostrar dinheiro e datas do jeito
// que estamos acostumados no Brasil.
export const formatarMoeda = (valor: number): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0);

export const formatarData = (data: string | Date): string =>
  new Date(data).toLocaleDateString("pt-BR");

// ------------------------------------------------------------
// ITENS DO MENU LATERAL
// ------------------------------------------------------------
// Cada item tem: o ícone (do pacote lucide-react), o texto e
// o endereço (href). A sidebar vai percorrer esta lista.
export type ItemMenu = {
  titulo: string;
  href: string;
  icone: LucideIcon;
};

export const ITENS_MENU: ItemMenu[] = [
  { titulo: "Início", href: "/", icone: LayoutDashboard },
  { titulo: "Caixa", href: "/caixa", icone: Wallet },
  { titulo: "Empréstimos", href: "/emprestimos", icone: HandCoins },
  { titulo: "Clientes", href: "/clientes", icone: Users },
  { titulo: "Adega", href: "/adega", icone: Wine },
  { titulo: "Sucatas", href: "/sucatas", icone: Recycle },
  { titulo: "Relatórios", href: "/relatorios", icone: FileBarChart },
];
