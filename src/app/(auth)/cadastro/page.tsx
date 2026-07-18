"use client";

// ============================================================================
// TELA DE CADASTRO — visual moderno (fintech)
// ============================================================================

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Check, X, ArrowRight } from "lucide-react";

import { cadastrar } from "@/app/actions/auth";
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

// Calcula força da senha de 0 a 4.
function forcaSenha(senha: string): {
  nivel: 0 | 1 | 2 | 3 | 4;
  cor: string;
  texto: string;
} {
  let pontos = 0;
  if (senha.length >= 6) pontos++;
  if (senha.length >= 10) pontos++;
  if (/[A-Z]/.test(senha) && /[a-z]/.test(senha)) pontos++;
  if (/[0-9]/.test(senha) || /[^A-Za-z0-9]/.test(senha)) pontos++;

  const mapas: Array<{
    nivel: 0 | 1 | 2 | 3 | 4;
    cor: string;
    texto: string;
  }> = [
    { nivel: 0, cor: "bg-muted", texto: "" },
    { nivel: 1, cor: "bg-rose-500", texto: "Fraca" },
    { nivel: 2, cor: "bg-amber-500", texto: "Razoável" },
    { nivel: 3, cor: "bg-blue-500", texto: "Boa" },
    { nivel: 4, cor: "bg-emerald-500", texto: "Forte" },
  ];
  return mapas[pontos];
}

export default function CadastroPage() {
  const [carregando, setCarregando] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const forca = useMemo(() => forcaSenha(senha), [senha]);
  const senhasIguais = senha.length > 0 && senha === confirmar;
  const senhasDiferentes = confirmar.length > 0 && senha !== confirmar;

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
    const resultado = await cadastrar({ email, senha });
    setCarregando(false);

    if (resultado?.error) {
      toast.error(resultado.error);
      return;
    }

    if (resultado?.sucesso) {
      toast.success("Conta criada! Cheque seu e-mail para confirmar.", {
        description: "Não esqueça de olhar a pasta de spam.",
        duration: 6000,
      });
      setTimeout(() => (window.location.href = "/login"), 4000);
    }
  }

  return (
    <Card className="border-muted/60 shadow-lg shadow-primary/5">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Criar minha conta
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Leva menos de um minuto. É grátis.
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
            <Label htmlFor="senha" className="text-sm font-medium">
              Senha
            </Label>
            <div className="relative">
              <Input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="new-password"
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
            {/* Barra de força da senha */}
            {senha.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i <= forca.nivel ? forca.cor : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                {forca.texto && (
                  <p className="text-xs text-muted-foreground">
                    Força: <span className="font-medium">{forca.texto}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmar" className="text-sm font-medium">
              Confirmar senha
            </Label>
            <div className="relative">
              <Input
                id="confirmar"
                type={mostrarSenha ? "text" : "password"}
                placeholder="Digite a senha novamente"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
                autoComplete="new-password"
                disabled={carregando}
                className={`h-12 pr-12 ${
                  senhasDiferentes
                    ? "border-rose-500 focus-visible:ring-rose-500"
                    : senhasIguais
                      ? "border-emerald-500 focus-visible:ring-emerald-500"
                      : ""
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {senhasIguais ? (
                  <Check className="size-5 text-emerald-500" />
                ) : senhasDiferentes ? (
                  <X className="size-5 text-rose-500" />
                ) : null}
              </div>
            </div>
            {senhasDiferentes && (
              <p className="text-xs text-rose-500">As senhas não conferem.</p>
            )}
          </div>

          <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            📧 Vamos enviar um e-mail de confirmação. Olhe também no spam,
            pode cair lá na primeira vez.
          </p>
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-4">
          <Button
            type="submit"
            className="h-12 w-full text-base font-medium"
            disabled={carregando || !senhasIguais}
          >
            {carregando ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Criando conta...
              </>
            ) : (
              <>
                Criar minha conta
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Entrar
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
