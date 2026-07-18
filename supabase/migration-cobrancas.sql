-- ============================================================================
// MIGRATION: SISTEMA DE COBRANÇAS
// ============================================================================
// Adiciona campos de cobrança à tabela "parcelas" e cria a tabela
// "cobrancas" para histórico de lembretes enviados.
//
// COMPATÍVEL COM DADOS EXISTENTES:
//   Todas as colunas são adicionadas com default null/0, então seus
//   empréstimos e parcelas atuais NÃO são afetados.
//
// Como executar:
//   1. Supabase → SQL Editor → New query
//   2. Cole TODO este arquivo
//   3. Clique em Run
// ============================================================================


-- ----------------------------------------------------------------------------
-- PARTE 1: ADICIONAR COLUNAS NA TABELA "parcelas"
-- ----------------------------------------------------------------------------
-- valor_pago: quanto já foi pago (para pagamentos parciais)
-- ultima_cobranca: data do último lembrete via WhatsApp
-- cobrancas_count: quantas vezes já cobramos

alter table public.parcelas
  add column if not exists valor_pago numeric(12,2) default 0;

alter table public.parcelas
  add column if not exists ultima_cobranca timestamptz;

alter table public.parcelas
  add column if not exists cobrancas_count integer default 0;

-- Atualiza o CHECK de status para incluir "parcial"
-- (parcela que teve pagamento parcial mas não foi totalmente quitada)
alter table public.parcelas
  drop constraint if exists parcelas_status_check;

alter table public.parcelas
  add constraint parcelas_status_check
  check (status in ('pendente', 'paga', 'atrasada', 'parcial'));


-- ----------------------------------------------------------------------------
-- PARTE 2: CRIAR TABELA "cobrancas" (histórico de lembretes)
-- ----------------------------------------------------------------------------
-- Cada linha = 1 lembrete enviado para 1 parcela.

create table if not exists public.cobrancas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  parcela_id  uuid not null references public.parcelas(id) on delete cascade,
  data        timestamptz not null default now(),
  canal       text not null default 'whatsapp'
              check (canal in ('whatsapp', 'presencial', 'telefone', 'outros')),
  mensagem    text,
  created_at  timestamptz not null default now()
);

-- Índices para consultas rápidas
create index if not exists idx_cobrancas_user_id on public.cobrancas(user_id);
create index if not exists idx_cobrancas_parcela on public.cobrancas(parcela_id);
create index if not exists idx_cobrancas_data on public.cobrancas(data);


-- ----------------------------------------------------------------------------
-- PARTE 3: ATIVAR RLS NA TABELA "cobrancas"
-- ----------------------------------------------------------------------------
-- Mesma proteção das outras tabelas: só o dono acessa suas cobranças.

alter table public.cobrancas enable row level security;

-- Políticas completas (SELECT, INSERT, UPDATE, DELETE)
create policy "ver proprias cobrancas"
  on public.cobrancas for select
  using (auth.uid() = user_id);

create policy "criar proprias cobrancas"
  on public.cobrancas for insert
  with check (auth.uid() = user_id);

create policy "editar proprias cobrancas"
  on public.cobrancas for update
  using (auth.uid() = user_id);

create policy "apagar proprias cobrancas"
  on public.cobrancas for delete
  using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- PARTE 4: CONFIRMAÇÃO
-- ----------------------------------------------------------------------------
do $$
begin
  raise notice '✅ Migration de cobranças aplicada com sucesso!';
  raise notice '   - 3 colunas adicionadas em "parcelas" (valor_pago, ultima_cobranca, cobrancas_count)';
  raise notice '   - Status "parcial" agora é aceito';
  raise notice '   - Tabela "cobrancas" criada com RLS';
  raise notice '   - 4 políticas RLS aplicadas';
end
$$;
