"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

function authMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code.includes("auth/invalid-credential") || code.includes("auth/user-not-found") || code.includes("auth/wrong-password")) return "E-mail ou senha inválidos.";
  if (code.includes("auth/too-many-requests")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  return "Não foi possível entrar. Tente novamente.";
}

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email")).trim().toLowerCase();
    const password = String(data.get("password"));
    try {
      await signIn(email, password);
      router.replace("/");
    } catch (loginError) {
      setError(authMessage(loginError));
    } finally {
      setLoading(false);
    }
  }

  return <main className="grid min-h-screen place-items-center px-5">
    <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-stone-100 p-8">
      <Link href="/" className="text-sm text-gold">← Voltar</Link>
      <h1 className="mt-8 font-sans text-4xl uppercase sm:text-5xl">Entrar</h1>
      <form onSubmit={submit} className="mt-8 grid gap-3">
        <input className="field" name="email" type="email" required autoComplete="email" placeholder="E-mail" />
        <input className="field" name="password" type="password" required autoComplete="current-password" placeholder="Senha" />
        <button disabled={loading} className="rounded-xl bg-gold px-4 py-3 font-bold text-stone-900 transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Entrando..." : "Entrar"}</button>
      </form>
      {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
      <Link href="/cadastro" className="mt-6 block text-sm text-gold transition-colors hover:text-amber-400">Ainda não tenho uma conta</Link>
    </div>
  </main>;
}
