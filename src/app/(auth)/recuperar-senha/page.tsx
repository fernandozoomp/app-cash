"use client";

// ============================================================================
// TELA: RECUPERAR SENHA — visual moderno (fintech)
// ============================================================================

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, MailCheck, ArrowRight } from "lucide-react";

import { recuperarSenha } from "@/app/actions/auth";
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

export default function RecuperarSenhaPage() {
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);

    const resultado = await recuperarSenha({ email });

    setCarregando(false);

    // Por segurança, mostramos a mesma mensagem independente do resultado
    if (resultado?.sucesso || resultado?.error) {
      toast.success("Se o e-mail existir, o link foi enviado.", {
        description: "Confira sua caixa de entrada e o spam.",
      });
      setEnviado(true);
    }
  }

  if (enviado) {
    return (
      <Card className="border-muted/60 shadow-lg shadow-primary/5">
        <CardContent className="flex flex-col items-center gap-5 pt-10 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-verde-100">
            <MailCheck className="size-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Cheque seu e-mail</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Enviamos um link de recuperação para{" "}
              <strong className="text-foreground">{email}</strong>. O link
              expira em 1 hora.
            </p>
          </div>
          <Button asChild variant="outline" className="mt-2 h-11">
            <Link href="/login">Voltar para o login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-muted/60 shadow-lg shadow-primary/5">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Esqueci minha senha
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sem problema. Informe seu e-mail e enviamos um link para você criar
          uma senha nova.
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
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
                Enviando...
              </>
            ) : (
              <>
                Enviar link
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Lembrou a senha?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Voltar para o login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
