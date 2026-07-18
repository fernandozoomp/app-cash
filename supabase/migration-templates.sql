-- ============================================================================
-- MIGRATION: TEMPLATES DE MENSAGEM WHATSAPP
-- ============================================================================
-- Cria a tabela "templates_mensagem" + 5 templates padrão (seed).
-- Cada usuário terá seus próprios templates + os 5 do sistema.
--
-- Como executar:
--   1. Supabase → SQL Editor → New query
--   2. Cole TODO este arquivo
--   3. Clique em Run
-- ============================================================================


-- ----------------------------------------------------------------------------
-- PARTE 1: CRIAR A TABELA "templates_mensagem"
-- ----------------------------------------------------------------------------
-- user_id pode ser null para templates globais do sistema (seed).
-- Para templates do usuário, user_id = auth.uid().

create table if not exists public.templates_mensagem (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade,
  nome                text not null,
  categoria           text not null default 'outros'
                      check (categoria in (
                        'cobranca', 'lembrete', 'aviso',
                        'agradecimento', 'conclusao', 'outros'
                      )),
  conteudo            text not null,
  icone               text default '💬',
  ativo               boolean default true,
  criado_pelo_sistema boolean default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_templates_user_id on public.templates_mensagem(user_id);
create index if not exists idx_templates_categoria on public.templates_mensagem(categoria);

-- Trigger de updated_at (reaproveita a função do schema.sql principal)
create trigger trg_templates_updated_at
  before update on public.templates_mensagem
  for each row execute function public.atualizar_updated_at();


-- ----------------------------------------------------------------------------
-- PARTE 2: ATIVAR RLS
-- ----------------------------------------------------------------------------
-- Regra: o usuário vê SEUS templates (user_id = auth.uid()) + os do sistema
-- (user_id is null). Mas só edita/apaga os próprios.

alter table public.templates_mensagem enable row level security;

-- SELECT: ver os próprios + os do sistema
create policy "ver templates acessiveis"
  on public.templates_mensagem for select
  using (user_id = auth.uid() or user_id is null);

-- INSERT: só pode criar para si mesmo
create policy "criar proprios templates"
  on public.templates_mensagem for insert
  with check (user_id = auth.uid());

-- UPDATE: só pode editar os próprios (nunca os do sistema)
create policy "editar proprios templates"
  on public.templates_mensagem for update
  using (user_id = auth.uid());

-- DELETE: só pode apagar os próprios (nunca os do sistema)
create policy "apagar proprios templates"
  on public.templates_mensagem for delete
  using (user_id = auth.uid());


-- ----------------------------------------------------------------------------
-- PARTE 3: SEED — 5 TEMPLATES PADRÃO (GLOBAIS)
-- ----------------------------------------------------------------------------
-- user_id = null → disponível para todos os usuários.
-- criado_pelo_sistema = true → intocáveis (não edita, não apaga).
--
-- Variáveis disponíveis:
--   {{nome}}           → nome do cliente
--   {{parcela}}        → número da parcela atual
--   {{total_parcelas}} → total de parcelas do empréstimo
--   {{valor}}          → valor da parcela (ex: R$ 129,50)
--   {{valor_pago}}     → quanto já foi pago (ex: R$ 60,00)
--   {{saldo_devedor}}  → quanto falta pagar (ex: R$ 69,50)
--   {{vencimento}}     → data de vencimento (ex: 22/07/2026)
-- ----------------------------------------------------------------------------

insert into public.templates_mensagem (user_id, nome, categoria, conteudo, icone, ativo, criado_pelo_sistema)
values
  (
    null,
    'Cobrança amigável',
    'cobranca',
    'Olá {{nome}}! Tudo bem?

Lembrete amigável: sua parcela {{parcela}}/{{total_parcelas}} vence em {{vencimento}}.
Valor: {{valor}}

Se já pagou, pode ignorar. Qualquer coisa, me avise! 🙏',
    '🔔',
    true,
    true
  ),
  (
    null,
    'Lembrete de vencimento',
    'lembrete',
    'Oi {{nome}}! Passando pra lembrar que sua parcela {{parcela}} vence {{vencimento}} ({{valor}}).

Qualquer dúvida, tô à disposição. Abraço!',
    '⏰',
    true,
    true
  ),
  (
    null,
    'Aviso de atraso',
    'aviso',
    'Olá {{nome}}, tudo bem?

Notei que a parcela {{parcela}}/{{total_parcelas}} ({{valor}}) vencia em {{vencimento}} e ainda não foi quitada.

Quando puder efetuar o pagamento, me avise. Se tiver alguma dificuldade, podemos conversar. 🙏',
    '⚠️',
    true,
    true
  ),
  (
    null,
    'Agradecimento por pagamento',
    'agradecimento',
    '{{nome}}, recebi seu pagamento. Muito obrigado! 🙏

Qualquer coisa, tô aqui. Bom dia/bom trabalho!',
    '🙏',
    true,
    true
  ),
  (
    null,
    'Conclusão do empréstimo',
    'conclusao',
    '{{nome}}, parabéns! 🎉

Você quitou todas as parcelas do seu empréstimo. Foi um prazer trabalhar com você.

Quando precisar de novo, pode me chamar. Abraço!',
    '✅',
    true,
    true
  )
on conflict do nothing;


-- ----------------------------------------------------------------------------
-- PARTE 4: CONFIRMAÇÃO
-- ----------------------------------------------------------------------------
do $$
begin
  raise notice '✅ Migration de templates aplicada!';
  raise notice '   - Tabela templates_mensagem criada com RLS';
  raise notice '   - 5 templates padrão inseridos (globais, intocáveis)';
  raise notice '   - 6 categorias: cobranca, lembrete, aviso, agradecimento, conclusao, outros';
end
$$;
