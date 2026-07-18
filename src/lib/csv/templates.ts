// ============================================================================
// TEMPLATES DE PLANILHAS CSV — para o usuário baixar e preencher
// ============================================================================
// Cada template é uma string CSV pronta para download. O usuário abre no
// Excel/Google Sheets, preenche, salva como CSV e faz upload no app.

export type TipoTemplate = "clientes" | "caixa" | "sucatas" | "emprestimos";

interface DefinicaoTemplate {
  tipo: TipoTemplate;
  titulo: string;
  descricao: string;
  icone: string; // emoji
  // CSV completo com cabeçalho + 2 linhas de exemplo
  csv: string;
  // Explicação de cada coluna para o usuário
  colunas: Array<{ nome: string; obrigatorio: boolean; explicacao: string }>;
}

export const TEMPLATES: Record<TipoTemplate, DefinicaoTemplate> = {
  // --------------------------------------------------------------
  // CLIENTES
  // --------------------------------------------------------------
  clientes: {
    tipo: "clientes",
    titulo: "Cadastro de Clientes",
    descricao: "Importa vários clientes de uma vez",
    icone: "👥",
    csv: `nome,telefone,observacoes
João Silva,(11) 99999-9999,Bom pagador
Maria Oliveira,(11) 98888-8888,Referência: Pedro
Carlos Santos,,`,
    colunas: [
      { nome: "nome", obrigatorio: true, explicacao: "Nome completo do cliente" },
      {
        nome: "telefone",
        obrigatorio: false,
        explicacao: "Telefone com DDD (opcional)",
      },
      {
        nome: "observacoes",
        obrigatorio: false,
        explicacao: "Anotações livres sobre o cliente",
      },
    ],
  },

  // --------------------------------------------------------------
  // CAIXA (vendas/despesas)
  // --------------------------------------------------------------
  caixa: {
    tipo: "caixa",
    titulo: "Movimentações de Caixa",
    descricao: "Vendas, despesas, entradas e saídas",
    icone: "💵",
    csv: `data,tipo,empreendimento,categoria,descricao,valor,forma_pagamento
17/07/2026,entrada,adega,venda,Venda de cervejas,150.00,pix
18/07/2026,saida,adega,compra_estoque,Compra na distribuidora,500.00,dinheiro
19/07/2026,saida,adega,despesa,Conta de luz,180.50,pix
20/07/2026,entrada,sucatas,venda_sucata,Venda de cobre,300.00,dinheiro`,
    colunas: [
      { nome: "data", obrigatorio: true, explicacao: "DD/MM/AAAA ou AAAA-MM-DD" },
      {
        nome: "tipo",
        obrigatorio: true,
        explicacao: '"entrada" ou "saida"',
      },
      {
        nome: "empreendimento",
        obrigatorio: true,
        explicacao: '"adega", "emprestimos" ou "sucatas"',
      },
      {
        nome: "categoria",
        obrigatorio: false,
        explicacao: "venda, despesa, compra_estoque, etc (opcional)",
      },
      {
        nome: "descricao",
        obrigatorio: false,
        explicacao: "Descrição livre do que aconteceu",
      },
      {
        nome: "valor",
        obrigatorio: true,
        explicacao: "Valor em reais (ex: 150.00 ou 150,00)",
      },
      {
        nome: "forma_pagamento",
        obrigatorio: false,
        explicacao: "pix, dinheiro, cartao ou fiado (padrão: dinheiro)",
      },
    ],
  },

  // --------------------------------------------------------------
  // SUCATAS
  // --------------------------------------------------------------
  sucatas: {
    tipo: "sucatas",
    titulo: "Movimentações de Sucatas",
    descricao: "Compra e venda de materiais por peso",
    icone: "♻️",
    csv: `data,tipo,material,peso_kg,preco_por_kg,observacoes
17/07/2026,compra,Cobre,10,30,Lote do ferrenho
17/07/2026,venda,Alumínio,5,8,
18/07/2026,compra,Ferro,50,1.5,
18/07/2026,venda,Cobre,8,32,Venda do lote antigo`,
    colunas: [
      { nome: "data", obrigatorio: true, explicacao: "DD/MM/AAAA ou AAAA-MM-DD" },
      {
        nome: "tipo",
        obrigatorio: true,
        explicacao: '"compra" ou "venda"',
      },
      {
        nome: "material",
        obrigatorio: true,
        explicacao: "Nome do material (Cobre, Alumínio, Ferro...)",
      },
      {
        nome: "peso_kg",
        obrigatorio: true,
        explicacao: "Peso em quilos (ex: 10 ou 10.5)",
      },
      {
        nome: "preco_por_kg",
        obrigatorio: true,
        explicacao: "Preço por quilo em reais (ex: 30 ou 30.50)",
      },
      {
        nome: "observacoes",
        obrigatorio: false,
        explicacao: "Anotações livres",
      },
    ],
  },

  // --------------------------------------------------------------
  // EMPRÉSTIMOS (com criação automática de cliente)
  // --------------------------------------------------------------
  emprestimos: {
    tipo: "emprestimos",
    titulo: "Empréstimos em Lote",
    descricao: "Cria clientes (se preciso) + empréstimos + parcelas",
    icone: "🤝",
    csv: `cliente_nome,cliente_telefone,valor_principal,taxa_juros,num_parcelas,data_inicio,sistema_juros,observacoes
João Silva,(11) 99999-9999,1000,5,10,01/07/2026,price,Garantia: moto
Maria Oliveira,,500,3,5,15/07/2026,simples,
Carlos Santos,,2000,4,12,01/08/2026,price,Cliente antigo`,
    colunas: [
      {
        nome: "cliente_nome",
        obrigatorio: true,
        explicacao: "Nome do cliente (se não existir, é criado automaticamente)",
      },
      {
        nome: "cliente_telefone",
        obrigatorio: false,
        explicacao: "Telefone do cliente (usado se for criá-lo)",
      },
      {
        nome: "valor_principal",
        obrigatorio: true,
        explicacao: "Valor emprestado em reais (ex: 1000)",
      },
      {
        nome: "taxa_juros",
        obrigatorio: false,
        explicacao: "Juros ao mês em % (ex: 5 para 5%). Padrão: 0",
      },
      {
        nome: "num_parcelas",
        obrigatorio: true,
        explicacao: "Número de parcelas (ex: 10)",
      },
      {
        nome: "data_inicio",
        obrigatorio: true,
        explicacao: "DD/MM/AAAA ou AAAA-MM-DD",
      },
      {
        nome: "sistema_juros",
        obrigatorio: false,
        explicacao: '"price" (parcelas iguais) ou "simples". Padrão: price',
      },
      {
        nome: "observacoes",
        obrigatorio: false,
        explicacao: "Anotações sobre o empréstimo",
      },
    ],
  },
};

// --------------------------------------------------------------------------
// Gera o conteúdo CSV para download (apenas o template, sem comentários)
// --------------------------------------------------------------------------
export function baixarTemplate(tipo: TipoTemplate): void {
  const template = TEMPLATES[tipo];
  if (!template) return;

  // Adiciona BOM (Byte Order Mark) para Excel reconhecer UTF-8
  const bom = "\uFEFF";
  const conteudo = bom + template.csv;

  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `modelo-${tipo}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
