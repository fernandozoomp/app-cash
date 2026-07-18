"use client";

// ============================================================================
// TELA: ATUALIZAR SENHA (após clicar no link do e-mail)
// ============================================================================
// O usuário chega aqui após clicar no link de recuperação enviado por e-mail.
// O token de sessão já vem na URL (cuidado do Supabase).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

import { atualizarSenha } from "@/app/actions/auth";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AtualizarSenhaPage() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrar, setMostrar] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (senha.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      toast.error("As senhas não conferem.");
      return;
    }

    setCarregando(true);
    const resultado = await atualizarSenha({ senha });
    setCarregando(false);

    if (resultado?.error) {
      toast.error(resultado.error);
      return;
    }

    toast.success("Senha atualizada! Entre com a nova senha.");
    router.push("/login");
  }

  return (
    <Card className="shadow-xl shadow-primary/5">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Criar nova senha</CardTitle>
        <p className="text-sm text-muted-foreground">
          Escolha uma senha que você não use em outros lugares.
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senha">Nova senha</Label>
            <div className="relative">
              <Input
                id="senha"
                type={mostrar ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoFocus
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setMostrar((m) => !m)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
                tabIndex={-1}
              >
                {mostrar ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmar">Confirmar nova senha</Label>
            <Input
              id="confirmar"
              type={mostrar ? "text" : "password"}
              placeholder="Repita a nova senha"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="mt-6">
          <Button type="submit" className="w-full" disabled={carregando}>
            {carregando ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              "Salvar nova senha"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
