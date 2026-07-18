-- ============================================================================
-- MIGRATION: SISTEMA DE NOTAS (polimórfico)
-- ============================================================================
-- Uma única tabela serve para anotar qualquer entidade (cliente, empréstimo,
-- transação, parcela, conta). Cada nota tem tipo: nota, lembrete ou alerta.
--
-- Como executar: Supabase → SQL Editor → New query → cole → Run
-- ============================================================================

create table if not exists public.notas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  entidade_tipo text not null check (entidade_tipo in (
    'cliente', 'emprestimo', 'transacao', 'parcela', 'conta', 'evento'
  )),
  entidade_id   uuid not null,
  conteudo      text not null,
  tipo          text not null default 'nota' check (tipo in ('nota', 'lembrete', 'alerta')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Índices para consultas rápidas por entidade
create index if not exists idx_notas_user on public.notas(user_id);
create index if not exists idx_notas_entidade on public.notas(entidade_tipo, entidade_id);
create index if not exists idx_notas_created on public.notas(created_at desc);

-- Trigger de updated_at
create trigger trg_notas_updated_at
  before update on public.notas
  for each row execute function public.atualizar_updated_at();

-- RLS
alter table public.notas enable row level security;

create policy "ver proprias notas"    on public.notas for select using (auth.uid() = user_id);
create policy "criar proprias notas"  on public.notas for insert with check (auth.uid() = user_id);
create policy "editar proprias notas" on public.notas for update using (auth.uid() = user_id);
create policy "apagar proprias notas" on public.notas for delete using (auth.uid() = user_id);

do $$
begin
  raise notice '✅ Migration de notas aplicada! Tabela "notas" criada com RLS.';
end
$$;
