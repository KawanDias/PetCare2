"use client";

import Link from "next/link";
import { FormEvent, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/api";
import { Pet } from "@/lib/catalog-data";

function onlyDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function formatCpf(value: string) {
  const digits = onlyDigits(value, 11);
  return digits.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function formatPhone(value: string) {
  const digits = onlyDigits(value, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function formatCep(value: string) {
  const digits = onlyDigits(value, 8);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

type AddressData = {
  cep: string;
  street: string;
  neighborhood: string;
  number: string;
  city: string;
  state: string;
};

export default function AdoptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState<AddressData>({ cep: "", street: "", neighborhood: "", number: "", city: "", state: "" });
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    if (user?.phone) setPhone(formatPhone(user.phone));
  }, [user?.phone]);

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/login?redirect=/pets/${encodeURIComponent(id)}/adocao`);
  }, [authLoading, id, router, user]);

  useEffect(() => {
    void apiFetch<Pet>(`/api/pets/${encodeURIComponent(id)}`)
      .then(setPet)
      .catch(() => setPet(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function searchCep(value: string) {
    const cep = onlyDigits(value, 8);
    if (cep.length !== 8) return;
    setCepLoading(true);
    setMessage("");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) throw new Error("Não foi possível consultar o CEP.");
      const result = await response.json() as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (result.erro) throw new Error("CEP não encontrado.");
      setAddress((current) => ({ ...current, street: result.logradouro ?? "", neighborhood: result.bairro ?? "", city: result.localidade ?? "", state: result.uf ?? "" }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível consultar o CEP.");
    } finally {
      setCepLoading(false);
    }
  }

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
          cpf,
          phone,
          address: `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city}/${address.state} - CEP ${address.cep}`,
          cep: address.cep,
          street: address.street,
          neighborhood: address.neighborhood,
          number: address.number,
          city: address.city,
          state: address.state,
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

  return <main className="min-h-screen bg-cream px-5 py-10"><div className="mx-auto max-w-2xl"><Link href={`/pets/${pet.id}`} className="text-sm text-gold">← Voltar aos detalhes</Link><section className="mt-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8"><p className="text-xs uppercase tracking-widest text-gold">Adoção responsável</p><h1 className="mt-2 text-3xl font-bold text-stone-800">Solicitar adoção de {pet.name}</h1><p className="mt-2 text-sm text-stone-600">Preencha seus dados. A solicitação será enviada para nossa equipe por e-mail.</p>{message && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</p>}<form onSubmit={submit} className="mt-6 grid gap-4"><label className="text-sm text-stone-700">Nome completo<input name="fullName" className="field mt-2 w-full" defaultValue={user.displayName} required /></label><label className="text-sm text-stone-700">CPF<input value={cpf} onChange={(event) => setCpf(formatCpf(event.target.value))} inputMode="numeric" className="field mt-2 w-full" placeholder="000.000.000-00" maxLength={14} required /></label><label className="text-sm text-stone-700">Telefone / WhatsApp<input value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} type="tel" inputMode="tel" className="field mt-2 w-full" placeholder="(00) 0 0000-0000" maxLength={16} required /></label><fieldset className="grid gap-4 rounded-2xl border border-stone-200 p-4"><legend className="px-2 text-sm font-medium text-stone-700">Endereço</legend>  <label className="text-sm text-stone-700">CEP<input value={formatCep(address.cep)} onChange={(event) => { const cep = onlyDigits(event.target.value, 8); setAddress({ ...address, cep }); if (cep.length === 8) void searchCep(cep); }} onBlur={() => void searchCep(address.cep)} inputMode="numeric" className="field mt-2 w-full" placeholder="00000-000" maxLength={9} required /><span className="mt-1 block text-xs text-stone-500">{cepLoading ? "Consultando CEP..." : "Digite os 8 números para preencher o endereço."}</span></label><div className="grid gap-4 sm:grid-cols-[1fr_130px]"><label className="text-sm text-stone-700">Rua / Logradouro<input value={address.street} onChange={(event) => setAddress({ ...address, street: event.target.value })} className="field mt-2 w-full" required /></label><label className="text-sm text-stone-700">Número<input value={address.number} onChange={(event) => setAddress({ ...address, number: event.target.value })} className="field mt-2 w-full" required /></label></div><label className="text-sm text-stone-700">Bairro<input value={address.neighborhood} onChange={(event) => setAddress({ ...address, neighborhood: event.target.value })} className="field mt-2 w-full" required /></label><div className="grid gap-4 sm:grid-cols-[1fr_80px]"><label className="text-sm text-stone-700">Cidade<input value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} className="field mt-2 w-full" required /></label><label className="text-sm text-stone-700">UF<input value={address.state} onChange={(event) => setAddress({ ...address, state: event.target.value.toUpperCase().slice(0, 2) })} className="field mt-2 w-full" maxLength={2} required /></label></div></fieldset><label className="text-sm text-stone-700">Justificativa / motivação<textarea name="motivation" className="field mt-2 min-h-32 w-full" required /></label><button disabled={sending} className="rounded-xl bg-gold px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{sending ? "Enviando solicitação..." : "Enviar solicitação de adoção"}</button></form></section></div></main>;
}
