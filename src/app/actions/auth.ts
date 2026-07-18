// ============================================================================
// SERVER ACTIONS — AUTENTICAÇÃO
// ============================================================================

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// --------------------------------------------------------------------------
// CADASTRAR (criar conta)
// --------------------------------------------------------------------------
export async function cadastrar(input: {
  email: string;
  senha: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.senha,
  });

  if (error) {
    return { error: traduzirErroAuth(error.message) };
  }

  // Em projetos novos o Supabase pode exigir confirmação de e-mail.
  // Nesse caso, retornamos uma mensagem para o usuário confirmar.
  if (data.user && !data.session) {
    return {
      sucesso: true,
      mensagem:
        "Conta criada! Verifique seu e-mail (inclusive o spam) para confirmar antes de entrar.",
    };
  }

  revalidatePath("/");
  redirect("/");
}

// --------------------------------------------------------------------------
// ENTRAR (login)
// --------------------------------------------------------------------------
export async function entrar(input: { email: string; senha: string }) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim().toLowerCase(),
    password: input.senha,
  });

  if (error) {
    return { error: traduzirErroAuth(error.message) };
  }

  if (!data.session) {
    return { error: "Não foi possível entrar. Tente novamente." };
  }

  revalidatePath("/");
  redirect("/");
}

// --------------------------------------------------------------------------
// SAIR (logout)
// --------------------------------------------------------------------------
export async function sair() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/login");
}

// --------------------------------------------------------------------------
// RECUPERAR SENHA (envia e-mail com link de redefinição)
// --------------------------------------------------------------------------
export async function recuperarSenha(input: { email: string }) {
  const supabase = await createSupabaseServerClient();

  // Constrói a URL de redirecionamento após o clique no e-mail.
  // Em produção usamos a URL da Vercel; em dev, localhost.
  const origem =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://app-cash-ten.vercel.app"
      : "http://localhost:3000");

  const { error } = await supabase.auth.resetPasswordForEmail(
    input.email.trim().toLowerCase(),
    { redirectTo: `${origem}/atualizar-senha` },
  );

  if (error) {
    return { error: traduzirErroAuth(error.message) };
  }

  return {
    sucesso: true,
    mensagem:
      "Se o e-mail existir na nossa base, você receberá um link para redefinir a senha. Olhe também no spam.",
  };
}

// --------------------------------------------------------------------------
// ATUALIZAR SENHA (após clicar no link do e-mail)
// --------------------------------------------------------------------------
export async function atualizarSenha(input: { senha: string }) {
  const supabase = await createSupabaseServerClient();

  if (input.senha.length < 8) {
    return { error: "A senha precisa ter pelo menos 8 caracteres." };
  }

  const { error } = await supabase.auth.updateUser({
    password: input.senha,
  });

  if (error) {
    return { error: traduzirErroAuth(error.message) };
  }

  return { sucesso: true };
}

// --------------------------------------------------------------------------
// TRADUÇÃO DE ERROS COMUNS DO SUPABASE AUTH
// --------------------------------------------------------------------------
function traduzirErroAuth(mensagem: string): string {
  const mapa: Record<string, string> = {
    "Invalid login credentials":
      "E-mail ou senha incorretos. Verifique e tente novamente.",
    "User already registered":
      "Este e-mail já está cadastrado. Tente entrar em vez de cadastrar.",
    "Password should be at least 6 characters.":
      "A senha deve ter pelo menos 8 caracteres.",
    "Password should be at least 8 characters.":
      "A senha deve ter pelo menos 8 caracteres.",
    "Email not confirmed":
      "Você precisa confirmar seu e-mail antes de entrar. Verifique sua caixa de entrada e o spam.",
  };
  return mapa[mensagem] || `Erro: ${mensagem}`;
}
