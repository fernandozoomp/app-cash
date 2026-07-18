-- ============================================================================
// CORREÇÃO: Adiciona a política de INSERT que faltava na tabela "parcelas"
// ============================================================================
// Problema: ao criar um empréstimo, o app inseria as parcelas e o banco
// recusava com: "new row violates row-level security policy for table parcelas"
//
// Causa: com RLS ativo, TODA operação precisa de uma política. O script
// original criou SELECT/UPDATE/DELETE, mas esqueceu o INSERT.
//
// Solução: esta política permite INSERT apenas quando o "emprestimo_id"
// aponta para um empréstimo que pertence ao usuário logado.
// ============================================================================

-- Política de INSERT para parcelas
-- "WITH CHECK" valida a linha DEPOIS de inserida (deve pertencer ao usuário)
create policy "criar proprias parcelas"
  on public.parcelas for insert
  with check (
    exists (
      select 1 from public.emprestimos e
      where e.id = parcelas.emprestimo_id
      and e.user_id = auth.uid()
    )
  );

-- Mensagem de confirmação (aparece no output do SQL Editor)
do $$
begin
  raise notice '✅ Política de INSERT criada com sucesso! Agora dá pra criar empréstimos.';
end
$$;
