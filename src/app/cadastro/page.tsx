"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

function signupMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code.includes("auth/email-already-in-use")) return "Este e-mail já possui uma conta. Faça login.";
  if (code.includes("auth/invalid-email")) return "Digite um e-mail válido.";
  if (code.includes("auth/weak-password")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (code === "NAME_REQUIRED") return "Digite seu nome.";
  if (code === "WEAK_PASSWORD") return "A senha precisa ter pelo menos 6 caracteres.";
  return "Não foi possível criar sua conta. Tente novamente.";
}

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name")).trim();
    const email = String(data.get("email")).trim().toLowerCase();
    const password = String(data.get("password"));
    if (!name) { setError("Digite seu nome."); return; }
    setLoading(true);
    try {
      await signUp(name, email, password);
      router.push("/perfil");
    } catch (signupError) {
      setError(signupMessage(signupError));
    } finally {
      setLoading(false);
    }
  }

  return <main className="grid min-h-screen place-items-center px-5">
    <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-stone-100 p-8">
      <Link href="/" className="text-sm text-gold">← Voltar</Link>
      <h1 className="mt-8 font-sans text-4xl uppercase sm:text-5xl">Criar conta</h1>
      <p className="mt-3 text-sm text-stone-600">Cadastre-se com nome, e-mail e uma senha de no mínimo 6 caracteres.</p>
      <form onSubmit={submit} className="mt-8 grid gap-3">
        <input className="field" name="name" required autoComplete="name" placeholder="Nome completo" />
        <input className="field" name="email" type="email" required autoComplete="email" placeholder="E-mail" />
        <input className="field" name="password" type="password" required minLength={6} autoComplete="new-password" placeholder="Senha (mínimo 6 caracteres)" />
        <button disabled={loading} className="rounded-xl bg-gold px-4 py-3 font-bold text-stone-900 transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Criando conta..." : "Cadastrar"}</button>
      </form>
      {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
      <Link href="/login" className="mt-6 block text-sm text-gold transition-colors hover:text-amber-400">Já tenho uma conta</Link>
    </div>
  </main>;
}
