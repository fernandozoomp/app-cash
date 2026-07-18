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
  Upload,
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

// Formata data por extenso: "quinta-feira, 17 de julho de 2026"
export const formatarDataExtenso = (data: string | Date): string =>
  new Date(data).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// Formata telefone brasileiro: "(11) 99999-9999"
export const formatarTelefone = (valor: string): string => {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return valor;
};

// ------------------------------------------------------------
// TRADUÇÃO HUMANA DE CATEGORIAS (acaba com snake_case)
// ------------------------------------------------------------
// Mapeia códigos internos (em inglês) para textos em português
// amigáveis. Resolver D1/F1 do diagnóstico.
export const CATEGORIAS_TRADUZIDAS: Record<string, string> = {
  // Transações gerais
  venda: "Venda",
  compra_estoque: "Compra de estoque",
  despesa: "Despesa",
  outros: "Outros",
  // Empréstimos
  emprestimo_concedido: "Empréstimo concedido",
  recebimento_parcela: "Recebimento de parcela",
  juros: "Juros",
  // Sucatas
  venda_sucata: "Venda de sucata",
  compra_sucata: "Compra de sucata",
};

// Função helper: traduz categoria ou retorna o original
export const traduzirCategoria = (categoria: string): string =>
  CATEGORIAS_TRADUZIDAS[categoria] || categoria.replace(/_/g, " ");

// ------------------------------------------------------------
// EMPTY STATES (estados vazios amigáveis)
// ------------------------------------------------------------
// Quando uma lista está vazia, mostramos uma mensagem acolhedora
// em vez de só "Nenhum registro encontrado".
export const EMPTY_STATES = {
  transacoes: {
    titulo: "Ainda não há movimentações por aqui",
    descricao: "Que tal registrar sua primeira venda ou despesa? Leva menos de 30 segundos.",
    icone: "wallet",
  },
  clientes: {
    titulo: "Sem clientes cadastrados",
    descricao: "Cadastre seu primeiro cliente para começar a registrar empréstimos.",
    icone: "users",
  },
  emprestimos: {
    titulo: "Nenhum empréstimo registrado",
    descricao: "Crie um empréstimo e o sistema calcula as parcelas automaticamente.",
    icone: "hand-coins",
  },
  parcelas: {
    titulo: "Sem parcelas geradas",
    descricao: "As parcelas aparecem aqui quando você cria um empréstimo.",
    icone: "calendar",
  },
  sucatas: {
    titulo: "Nenhuma movimentação de sucata",
    descricao: "Registre sua primeira compra ou venda para acompanhar o lucro.",
    icone: "recycle",
  },
} as const;

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
  { titulo: "Importar", href: "/importar", icone: Upload },
  { titulo: "Empréstimos", href: "/emprestimos", icone: HandCoins },
  { titulo: "Clientes", href: "/clientes", icone: Users },
  { titulo: "Adega", href: "/adega", icone: Wine },
  { titulo: "Sucatas", href: "/sucatas", icone: Recycle },
  { titulo: "Relatórios", href: "/relatorios", icone: FileBarChart },
];
