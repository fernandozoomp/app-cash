-- ============================================================================
-- MIGRATION: CONTAS BANCÁRIAS + EXTRATOS + CONCILIAÇÃO
-- ============================================================================
-- 2 tabelas: contas_bancarias (cadastro) e extrato_itens (itens importados).
--
-- Como executar: Supabase → SQL Editor → New query → cole → Run
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABELA 1: contas_bancarias
-- ----------------------------------------------------------------------------
create table if not exists public.contas_bancarias (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  nome          text not null,
  banco         text default 'outros' check (banco in (
    'itau', 'nubank', 'bradesco', 'bb', 'inter', 'santander', 'caixa', 'outros'
  )),
  agencia       text,
  conta         text,
  saldo_inicial numeric(12,2) not null default 0,
  cor           text default '#10b981',
  ativa         boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_contas_user on public.contas_bancarias(user_id);

create trigger trg_contas_updated_at
  before update on public.contas_bancarias
  for each row execute function public.atualizar_updated_at();

alter table public.contas_bancarias enable row level security;
create policy "ver proprias contas"    on public.contas_bancarias for select using (auth.uid() = user_id);
create policy "criar proprias contas"  on public.contas_bancarias for insert with check (auth.uid() = user_id);
create policy "editar proprias contas" on public.contas_bancarias for update using (auth.uid() = user_id);
create policy "apagar proprias contas" on public.contas_bancarias for delete using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- TABELA 2: extrato_itens
-- ----------------------------------------------------------------------------
-- Cada linha = 1 lançamento importado do banco (OFX/CSV/JSON).
-- transacao_id = null significa "não conciliado" (ainda não foi vinculado).
-- hash_unico evita importar o mesmo lançamento 2x.

create table if not exists public.extrato_itens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  conta_id      uuid not null references public.contas_bancarias(id) on delete cascade,
  data          date not null,
  descricao     text,
  valor         numeric(12,2) not null,  -- positivo = entrada, negativo = saída
  conciliado    boolean not null default false,
  transacao_id  uuid references public.transacoes(id) on delete set null,
  origem        text default 'csv' check (origem in ('ofx', 'csv', 'json', 'manual')),
  hash_unico    text not null,
  created_at    timestamptz not null default now(),
  unique(conta_id, hash_unico)
);

create index if not exists idx_extrato_user on public.extrato_itens(user_id);
create index if not exists idx_extrato_conta on public.extrato_itens(conta_id);
create index if not exists idx_extrato_conciliado on public.extrato_itens(conciliado);

alter table public.extrato_itens enable row level security;
create policy "ver proprios extratos"    on public.extrato_itens for select using (auth.uid() = user_id);
create policy "criar proprios extratos"  on public.extrato_itens for insert with check (auth.uid() = user_id);
create policy "editar proprios extratos" on public.extrato_itens for update using (auth.uid() = user_id);
create policy "apagar proprios extratos" on public.extrato_itens for delete using (auth.uid() = user_id);


do $$
begin
  raise notice '✅ Migration de contas aplicada!';
  raise notice '   - contas_bancarias criada com RLS';
  raise notice '   - extrato_itens criada com RLS + constraint unique(conta_id, hash_unico)';
end
$$;
