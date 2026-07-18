"use client";

// ============================================================================
// TELA DE LOGIN — visual moderno (fintech)
// ============================================================================
// Cantos suaves, sombra elegante, tipografia Inter, espaçamento generoso.

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";

import { entrar } from "@/app/actions/auth";
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

export default function LoginPage() {
  const [carregando, setCarregando] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);

    const resultado = await entrar({ email, senha });

    // Se chegou aqui, houve erro (entrar() faz redirect em caso de sucesso).
    setCarregando(false);
    if (resultado?.error) {
      toast.error(resultado.error);
    }
  }

  return (
    <Card className="border-muted/60 shadow-lg shadow-primary/5">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Bom te ver de novo 👋
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Entre com seu e-mail e senha para continuar.
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              disabled={carregando}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="senha" className="text-sm font-medium">
                Senha
              </Label>
              <Link
                href="/recuperar-senha"
                className="text-xs font-medium text-primary hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            <div className="relative">
              <Input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="current-password"
                disabled={carregando}
                className="h-12 pr-12"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((m) => !m)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                tabIndex={-1}
              >
                {mostrarSenha ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-4">
          <Button
            type="submit"
            className="h-12 w-full text-base font-medium"
            disabled={carregando}
          >
            {carregando ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                Entrar
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link
              href="/cadastro"
              className="font-medium text-primary hover:underline"
            >
              Criar agora
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
