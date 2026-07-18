// ============================================================================
// TIPOS DO BANCO DE DADOS
// ============================================================================
// O TypeScript usa estes tipos para "saber" o formato de cada tabela.
// Assim, quando você digita `transacao.valor`, ele autocompleta e avisa
// se você errar o nome de um campo.

export type Empreendimento = "adega" | "emprestimos" | "sucatas";
export type TipoTransacao = "entrada" | "saida";
export type FormaPagamento = "pix" | "dinheiro" | "cartao" | "fiado";
export type SistemaJuros = "price" | "simples";
export type StatusEmprestimo = "ativo" | "quitado" | "atrasado";
export type StatusParcela = "pendente" | "paga" | "atrasada" | "parcial";
export type TipoSucata = "compra" | "venda";
export type CanalCobranca = "whatsapp" | "presencial" | "telefone" | "outros";

export interface Transacao {
  id: string;
  user_id: string;
  data: string; // ISO date
  tipo: TipoTransacao;
  empreendimento: Empreendimento;
  categoria: string;
  descricao: string | null;
  valor: number;
  forma_pagamento: FormaPagamento;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  user_id: string;
  nome: string;
  telefone: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Emprestimo {
  id: string;
  user_id: string;
  cliente_id: string | null;
  valor_principal: number;
  taxa_juros: number; // % ao mês
  num_parcelas: number;
  data_inicio: string;
  sistema_juros: SistemaJuros;
  valor_parcela: number | null;
  valor_total: number | null;
  status: StatusEmprestimo;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Parcela {
  id: string;
  emprestimo_id: string;
  numero: number;
  valor: number;
  vencimento: string;
  status: StatusParcela;
  data_pagamento: string | null;
  // Campos de cobrança (adicionados pela migration)
  valor_pago?: number; // quanto já foi pago (parcial)
  ultima_cobranca?: string | null; // data do último lembrete
  cobrancas_count?: number; // quantas vezes cobramos
  created_at: string;
  updated_at: string;
}

// Nova tabela: histórico de cobranças
export interface Cobranca {
  id: string;
  user_id: string;
  parcela_id: string;
  data: string;
  canal: CanalCobranca;
  mensagem: string | null;
  created_at: string;
}

// Tabela: templates de mensagem WhatsApp
export type CategoriaTemplate =
  | "cobranca"
  | "lembrete"
  | "aviso"
  | "agradecimento"
  | "conclusao"
  | "outros";

export interface TemplateMensagem {
  id: string;
  user_id: string | null; // null = template global do sistema
  nome: string;
  categoria: CategoriaTemplate;
  conteudo: string;
  icone: string;
  ativo: boolean;
  criado_pelo_sistema: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProdutoAdega {
  id: string;
  user_id: string;
  nome: string;
  preco_custo: number;
  preco_venda: number;
  estoque: number;
  created_at: string;
  updated_at: string;
}

export interface VendaAdega {
  id: string;
  user_id: string;
  data: string;
  total: number;
  forma_pagamento: FormaPagamento;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MovimentacaoSucata {
  id: string;
  user_id: string;
  data: string;
  tipo: TipoSucata;
  material: string;
  peso_kg: number;
  preco_por_kg: number;
  valor_total: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

// Para facilitar joins (empréstimo + cliente + parcelas)
export interface EmprestimoComCliente extends Emprestimo {
  clientes: Pick<Cliente, "nome" | "telefone"> | null;
}

export interface ParcelaComEmprestimo extends Parcela {
  emprestimos: Pick<Emprestimo, "valor_principal"> &
    { clientes: Pick<Cliente, "nome"> | null } | null;
}
