"use client";

import Link from "next/link";
import { FormEvent, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/api";
import { Pet } from "@/lib/catalog-data";

export default function AdoptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/login?redirect=/pets/${encodeURIComponent(id)}/adocao`);
  }, [authLoading, id, router, user]);

  useEffect(() => {
    void apiFetch<Pet>(`/api/pets/${encodeURIComponent(id)}`)
      .then(setPet)
      .catch(() => setPet(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pet) return;
    setSending(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      await apiFetch("/api/adoptions", {
        method: "POST",
        body: JSON.stringify({
          petId: pet.id,
          petName: pet.name,
          imageUrl: pet.imageUrls?.[0] ?? pet.image ?? "",
          fullName: String(data.get("fullName") ?? ""),
          cpf: String(data.get("cpf") ?? ""),
          phone: String(data.get("phone") ?? ""),
          address: String(data.get("address") ?? ""),
          motivation: String(data.get("motivation") ?? "")
        })
      });
      router.push("/perfil");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar a solicitação.");
    } finally {
      setSending(false);
    }
  }

  if (authLoading || loading) return <main className="mx-auto min-h-screen max-w-2xl px-5 py-12"><p className="text-stone-600">Carregando formulário...</p></main>;
  if (!user || !pet) return <main className="mx-auto min-h-screen max-w-2xl px-5 py-12"><Link href="/pets" className="text-gold">← Voltar aos pets</Link><p className="mt-8 text-stone-600">Não foi possível carregar este pet.</p></main>;

  return <main className="min-h-screen bg-cream px-5 py-10"><div className="mx-auto max-w-2xl"><Link href={`/pets/${pet.id}`} className="text-sm text-gold">← Voltar aos detalhes</Link><section className="mt-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8"><p className="text-xs uppercase tracking-widest text-gold">Adoção responsável</p><h1 className="mt-2 text-3xl font-bold text-stone-800">Solicitar adoção de {pet.name}</h1><p className="mt-2 text-sm text-stone-600">Preencha seus dados. A solicitação será enviada para nossa equipe por e-mail.</p>{message && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</p>}<form onSubmit={submit} className="mt-6 grid gap-4"><label className="text-sm text-stone-700">Nome completo<input name="fullName" className="field mt-2 w-full" defaultValue={user.displayName} required /></label><label className="text-sm text-stone-700">CPF<input name="cpf" inputMode="numeric" className="field mt-2 w-full" placeholder="000.000.000-00" minLength={11} required /></label><label className="text-sm text-stone-700">Telefone / WhatsApp<input name="phone" type="tel" className="field mt-2 w-full" defaultValue={user.phone ?? ""} required /></label><label className="text-sm text-stone-700">Endereço completo<textarea name="address" className="field mt-2 min-h-24 w-full" required /></label><label className="text-sm text-stone-700">Justificativa / motivação<textarea name="motivation" className="field mt-2 min-h-32 w-full" required /></label><button disabled={sending} className="rounded-xl bg-gold px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{sending ? "Enviando solicitação..." : "Enviar solicitação de adoção"}</button></form></section></div></main>;
}
