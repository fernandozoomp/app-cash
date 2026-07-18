-- ============================================================================
-- MIGRATION: AGENDA (eventos manuais: follow-ups, reuniões, etc)
-- ============================================================================
-- Vencimentos de parcelas NÃO vão nesta tabela — são gerados dinamicamente.
-- Aqui ficam só os eventos manuais criados pelo operador.
--
-- Como executar: Supabase → SQL Editor → New query → cole → Run
-- ============================================================================

create table if not exists public.eventos_agenda (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  titulo        text not null,
  descricao     text,
  data          date not null,
  hora          time,
  tipo          text not null default 'outros' check (tipo in (
    'vencimento', 'followup', 'reuniao', 'pagamento', 'outros'
  )),
  entidade_tipo text,
  entidade_id   uuid,
  concluido     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_eventos_user on public.eventos_agenda(user_id);
create index if not exists idx_eventos_data on public.eventos_agenda(data);
create index if not exists idx_eventos_tipo on public.eventos_agenda(tipo);

create trigger trg_eventos_updated_at
  before update on public.eventos_agenda
  for each row execute function public.atualizar_updated_at();

alter table public.eventos_agenda enable row level security;

create policy "ver proprios eventos"    on public.eventos_agenda for select using (auth.uid() = user_id);
create policy "criar proprios eventos"  on public.eventos_agenda for insert with check (auth.uid() = user_id);
create policy "editar proprios eventos" on public.eventos_agenda for update using (auth.uid() = user_id);
create policy "apagar proprios eventos" on public.eventos_agenda for delete using (auth.uid() = user_id);

do $$
begin
  raise notice '✅ Migration de agenda aplicada! Tabela "eventos_agenda" criada com RLS.';
end
$$;
