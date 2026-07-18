-- ============================================================================
-- MEU CAIXA — SCRIPT DE CRIAÇÃO DO BANCO DE DADOS
-- ============================================================================
-- Este script cria TODAS as tabelas do seu app no Supabase.
-- Como executar (explicado no chat):
--   1. Entre no painel do Supabase
--   2. Vá em "SQL Editor" no menu lateral
--   3. Clique em "New query"
--   4. Cole TODO este arquivo
--   5. Clique em "Run" (botão verde)
--
-- Pode rodar quantas vezes quiser: o comando "drop table if exists"
-- no final apaga tabelas antigas antes de recriar (útil em desenvolvimento).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- PASSO 1: FUNÇÕES AUXILIARES
-- ----------------------------------------------------------------------------
-- Esta função atualiza a coluna "updated_at" automaticamente sempre que uma
-- linha é modificada. Assim você sempre sabe quando um registro foi alterado.

create or replace function public.atualizar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ----------------------------------------------------------------------------
-- PASSO 2: TABELA "transacoes" (fluxo de caixa geral)
-- ----------------------------------------------------------------------------
-- Todas as entradas e saídas de dinheiro dos 3 empreendimentos.

create table if not exists public.transacoes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  data            date not null default current_date,
  tipo            text not null check (tipo in ('entrada', 'saida')),
  empreendimento  text not null check (empreendimento in ('adega', 'emprestimos', 'sucatas')),
  categoria       text not null default 'outros',
  descricao       text,
  valor           numeric(12,2) not null check (valor >= 0),
  forma_pagamento text default 'dinheiro',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_transacoes_user_id on public.transacoes(user_id);
create index if not exists idx_transacoes_data on public.transacoes(data);
create index if not exists idx_transacoes_empreendimento on public.transacoes(empreendimento);

create trigger trg_transacoes_updated_at
  before update on public.transacoes
  for each row execute function public.atualizar_updated_at();


-- ----------------------------------------------------------------------------
-- PASSO 3: TABELA "clientes"
-- ----------------------------------------------------------------------------
-- Pessoas que pegam empréstimo (ou compram fiado).

create table if not exists public.clientes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  nome        text not null,
  telefone    text,
  observacoes text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_clientes_user_id on public.clientes(user_id);

create trigger trg_clientes_updated_at
  before update on public.clientes
  for each row execute function public.atualizar_updated_at();


-- ----------------------------------------------------------------------------
-- PASSO 4: TABELA "emprestimos"
-- ----------------------------------------------------------------------------
-- Cada empréstimo concedido. "sistema_juros" define como o juro é calculado:
--   'price'    → parcelas iguais (Tabela Price)
--   'simples'  → juros simples (valor fixo por parcela)

create table if not exists public.emprestimos (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  cliente_id      uuid references public.clientes(id) on delete set null,
  valor_principal numeric(12,2) not null check (valor_principal > 0),
  taxa_juros      numeric(6,2) not null default 0 check (taxa_juros >= 0),
  num_parcelas    integer not null check (num_parcelas > 0),
  data_inicio     date not null default current_date,
  sistema_juros   text not null default 'price' check (sistema_juros in ('price', 'simples')),
  valor_parcela   numeric(12,2),  -- calculado automaticamente
  valor_total     numeric(12,2),  -- calculado automaticamente
  status          text not null default 'ativo' check (status in ('ativo', 'quitado', 'atrasado')),
  observacoes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_emprestimos_user_id on public.emprestimos(user_id);
create index if not exists idx_emprestimos_cliente on public.emprestimos(cliente_id);
create index if not exists idx_emprestimos_status on public.emprestimos(status);

create trigger trg_emprestimos_updated_at
  before update on public.emprestimos
  for each row execute function public.atualizar_updated_at();


-- ----------------------------------------------------------------------------
-- PASSO 5: TABELA "parcelas"
-- ----------------------------------------------------------------------------
-- As parcelas de cada empréstimo (geradas automaticamente quando o empréstimo
-- é criado). "on delete cascade" significa: se apagar o empréstimo, apaga
-- todas as parcelas junto (faz sentido).

create table if not exists public.parcelas (
  id             uuid primary key default gen_random_uuid(),
  emprestimo_id  uuid not null references public.emprestimos(id) on delete cascade,
  numero         integer not null,  -- 1, 2, 3...
  valor          numeric(12,2) not null,
  vencimento     date not null,
  status         text not null default 'pendente' check (status in ('pendente', 'paga', 'atrasada')),
  data_pagamento date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_parcelas_emprestimo on public.parcelas(emprestimo_id);
create index if not exists idx_parcelas_vencimento on public.parcelas(vencimento);
create index if not exists idx_parcelas_status on public.parcelas(status);

create trigger trg_parcelas_updated_at
  before update on public.parcelas
  for each row execute function public.atualizar_updated_at();


-- ----------------------------------------------------------------------------
-- PASSO 6: TABELA "produtos_adega"
-- ----------------------------------------------------------------------------
-- Cadastro de produtos da adega (estoque).

create table if not exists public.produtos_adega (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  nome        text not null,
  preco_custo numeric(12,2) not null default 0,
  preco_venda numeric(12,2) not null default 0,
  estoque     integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_produtos_adega_user_id on public.produtos_adega(user_id);

create trigger trg_produtos_adega_updated_at
  before update on public.produtos_adega
  for each row execute function public.atualizar_updated_at();


-- ----------------------------------------------------------------------------
-- PASSO 7: TABELA "vendas_adega"
-- ----------------------------------------------------------------------------
-- Registro de cada venda realizada na adega.

create table if not exists public.vendas_adega (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  data            timestamptz not null default now(),
  total           numeric(12,2) not null,
  forma_pagamento text default 'dinheiro',
  observacoes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_vendas_adega_user_id on public.vendas_adega(user_id);
create index if not exists idx_vendas_adega_data on public.vendas_adega(data);

create trigger trg_vendas_adega_updated_at
  before update on public.vendas_adega
  for each row execute function public.atualizar_updated_at();


-- ----------------------------------------------------------------------------
-- PASSO 8: TABELA "movimentacao_sucatas"
-- ----------------------------------------------------------------------------
-- Compra e venda de sucatas por peso.

create table if not exists public.movimentacao_sucatas (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  data           date not null default current_date,
  tipo           text not null check (tipo in ('compra', 'venda')),
  material       text not null,           -- ex: cobre, alumínio, ferro
  peso_kg        numeric(10,2) not null check (peso_kg > 0),
  preco_por_kg   numeric(10,2) not null check (preco_por_kg >= 0),
  valor_total    numeric(12,2) not null,  -- calculado: peso × preço
  observacoes    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_sucatas_user_id on public.movimentacao_sucatas(user_id);
create index if not exists idx_sucatas_data on public.movimentacao_sucatas(data);
create index if not exists idx_sucatas_material on public.movimentacao_sucatas(material);

create trigger trg_sucatas_updated_at
  before update on public.movimentacao_sucatas
  for each row execute function public.atualizar_updated_at();


-- ============================================================================
-- PASSO 9: SEGURANÇA — ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- RLS é o recurso mais importante do Supabase. Ele faz o banco recusar
-- QUALQUER acesso que não venha do dono dos dados.
--
-- Como funciona:
--   - Cada linha tem um "user_id" (dono).
--   - Quando você (logado) pede algo ao banco, o Supabase envia seu ID.
--   - O banco só devolve/edita linhas onde user_id = o SEU ID.
--   - Se outra pessoa tentar acessar, o banco responde: "não tem nada aqui".
--
-- Mesmo que alguém descubra sua URL do Supabase, não consegue ver seus dados.
-- ============================================================================

-- Primeiro: ativar RLS em todas as tabelas
alter table public.transacoes           enable row level security;
alter table public.clientes             enable row level security;
alter table public.emprestimos          enable row level security;
alter table public.parcelas             enable row level security;
alter table public.produtos_adega       enable row level security;
alter table public.vendas_adega         enable row level security;
alter table public.movimentacao_sucatas enable row level security;


-- ----------------------------------------------------------------------------
-- PASSO 10: POLÍTICAS DE ACESSO (quem pode fazer o quê)
-- ----------------------------------------------------------------------------
-- Para cada tabela criamos 4 políticas:
--   1. SELECT → pode LER suas próprias linhas
--   2. INSERT → pode CRIAR novas linhas (desde que sejam dele)
--   3. UPDATE → pode EDITAR suas próprias linhas
--   4. DELETE → pode APAGAR suas próprias linhas
--
-- Tabelas "filhas" (parcelas) usam o ID do dono obtido via JOIN no pai.

-- transacoes
create policy "ver proprias transacoes"   on public.transacoes for select using (auth.uid() = user_id);
create policy "criar proprias transacoes" on public.transacoes for insert with check (auth.uid() = user_id);
create policy "editar proprias transacoes" on public.transacoes for update using (auth.uid() = user_id);
create policy "apagar proprias transacoes" on public.transacoes for delete using (auth.uid() = user_id);

-- clientes
create policy "ver proprios clientes"   on public.clientes for select using (auth.uid() = user_id);
create policy "criar proprios clientes" on public.clientes for insert with check (auth.uid() = user_id);
create policy "editar proprios clientes" on public.clientes for update using (auth.uid() = user_id);
create policy "apagar proprios clientes" on public.clientes for delete using (auth.uid() = user_id);

-- emprestimos
create policy "ver proprios emprestimos"   on public.emprestimos for select using (auth.uid() = user_id);
create policy "criar proprios emprestimos" on public.emprestimos for insert with check (auth.uid() = user_id);
create policy "editar proprios emprestimos" on public.emprestimos for update using (auth.uid() = user_id);
create policy "apagar proprios emprestimos" on public.emprestimos for delete using (auth.uid() = user_id);

-- parcelas (acesso via JOIN com emprestimos para saber quem é o dono)
create policy "ver proprias parcelas"   on public.parcelas for select using (
  exists (select 1 from public.emprestimos e where e.id = parcelas.emprestimo_id and e.user_id = auth.uid())
);
create policy "criar proprias parcelas" on public.parcelas for insert with check (
  exists (select 1 from public.emprestimos e where e.id = parcelas.emprestimo_id and e.user_id = auth.uid())
);
create policy "editar proprias parcelas" on public.parcelas for update using (
  exists (select 1 from public.emprestimos e where e.id = parcelas.emprestimo_id and e.user_id = auth.uid())
);
create policy "apagar proprias parcelas" on public.parcelas for delete using (
  exists (select 1 from public.emprestimos e where e.id = parcelas.emprestimo_id and e.user_id = auth.uid())
);

-- produtos_adega
create policy "ver proprios produtos"   on public.produtos_adega for select using (auth.uid() = user_id);
create policy "criar proprios produtos" on public.produtos_adega for insert with check (auth.uid() = user_id);
create policy "editar proprios produtos" on public.produtos_adega for update using (auth.uid() = user_id);
create policy "apagar proprios produtos" on public.produtos_adega for delete using (auth.uid() = user_id);

-- vendas_adega
create policy "ver proprias vendas"   on public.vendas_adega for select using (auth.uid() = user_id);
create policy "criar proprias vendas" on public.vendas_adega for insert with check (auth.uid() = user_id);
create policy "editar proprias vendas" on public.vendas_adega for update using (auth.uid() = user_id);
create policy "apagar proprias vendas" on public.vendas_adega for delete using (auth.uid() = user_id);

-- movimentacao_sucatas
create policy "ver proprias sucatas"   on public.movimentacao_sucatas for select using (auth.uid() = user_id);
create policy "criar proprias sucatas" on public.movimentacao_sucatas for insert with check (auth.uid() = user_id);
create policy "editar proprias sucatas" on public.movimentacao_sucatas for update using (auth.uid() = user_id);
create policy "apagar proprias sucatas" on public.movimentacao_sucatas for delete using (auth.uid() = user_id);


-- ============================================================================
-- PRONTO! 🎉
-- ============================================================================
-- Suas 7 tabelas estão criadas e seguras. Para conferir:
--   - Vá em "Table Editor" no menu do Supabase
--   - Você verá as 7 tabelas na coluna da esquerda
--
-- Importante: por enquanto as tabelas estão VAZIAS. Quando você começar a usar
-- o app, os dados aparecerão aqui.
-- ============================================================================
