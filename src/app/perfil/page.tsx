"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Check, ChevronRight, Heart, Home, LogOut, MapPin, Shield, UserRound } from "lucide-react";
import { useAuth, type UserAddress } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/api";

type Tab = "data" | "address" | "favorites" | "adoptions" | "security";
type AdoptionRequest = { id: string; petId: string; petName: string; imageUrl?: string; status: "pending" | "approved" | "completed" | "cancelled"; createdAt: string };
const tabs: Array<[Tab, string, typeof UserRound]> = [["data", "Meus Dados", UserRound], ["address", "Endereço", MapPin], ["favorites", "Pets Favoritos", Heart], ["adoptions", "Minhas Adoções", Heart], ["security", "Segurança", Shield]];
const emptyAddress: UserAddress = { cep: "", street: "", number: "", neighborhood: "", city: "", reference: "" };
const statusLabel = (status: AdoptionRequest["status"]) => ({ pending: "Em análise", approved: "Aprovado", completed: "Concluído", cancelled: "Cancelado" }[status]);

export default function ProfilePage() {
  const { user, loading, updateProfile, changePassword, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("data");
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState({ name: "", phone: "", cpf: "", birthDate: "" });
  const [address, setAddress] = useState<UserAddress>(emptyAddress);
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);

  useEffect(() => {
    if (!user) return;
    setProfile({ name: user.displayName, phone: user.phone ?? "", cpf: user.cpf ?? "", birthDate: user.birthDate ?? "" });
    setAddress(user.address ?? emptyAddress);
    void apiFetch<AdoptionRequest[]>("/api/adoptions").then(setRequests).catch((error) => { console.error("Erro ao carregar solicitações de adoção.", error); setNotice("Não foi possível carregar suas adoções."); });
  }, [user]);

  if (loading) return <main className="grid min-h-screen place-items-center">Carregando...</main>;
  if (!user) return <main className="grid min-h-screen place-items-center p-5"><Link href="/login" className="text-gold">Entre para acessar seu perfil.</Link></main>;
  const showNotice = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 3500); };
  async function saveProfile(event: FormEvent) { event.preventDefault(); await updateProfile({ displayName: profile.name.trim(), phone: profile.phone, cpf: profile.cpf, birthDate: profile.birthDate }); showNotice("Dados salvos com sucesso."); }
  async function saveAddress(event: FormEvent) { event.preventDefault(); await updateProfile({ address }); showNotice("Endereço salvo com sucesso."); }
  async function savePassword(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); const next = String(data.get("next")); if (next !== String(data.get("confirm"))) { showNotice("As senhas não conferem."); return; } try { await changePassword(String(data.get("current")), next); event.currentTarget.reset(); showNotice("Senha alterada com sucesso."); } catch { showNotice("Não foi possível alterar a senha."); } }

  return <main className="min-h-screen px-5 py-8 pb-20"><div className="mx-auto max-w-5xl"><div className="flex items-center justify-between"><Link href="/" className="inline-flex items-center gap-2 text-sm text-gold"><Home size={16} /> Início</Link><button type="button" onClick={() => void logout()} className="inline-flex items-center gap-2 text-sm text-red-700"><LogOut size={16} /> Sair</button></div>
    {notice && <div role="status" className="fixed bottom-6 right-5 z-50 flex items-center gap-2 rounded-xl border border-green-300 bg-white px-4 py-3 text-sm text-green-700 shadow-xl"><Check size={17} />{notice}</div>}
    <section className="mt-7 flex items-center gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"><div className="grid h-20 w-20 place-items-center rounded-full bg-gold text-3xl font-bold text-white">{user.displayName.charAt(0).toUpperCase()}</div><div><h1 className="text-2xl font-bold">{user.displayName}</h1><p className="text-sm text-stone-500">{user.email}</p></div></section>
    <div className="mt-5 grid gap-5 lg:grid-cols-[230px_1fr]"><nav className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">{tabs.map(([id, label, Icon]) => <button key={id} type="button" onClick={() => setTab(id)} className={`flex w-full items-center gap-3 border-b border-stone-200 px-4 py-3 text-left text-sm last:border-0 ${tab === id ? "bg-gold/15 text-gold" : "text-stone-700"}`}><Icon size={17} /><span>{label}</span><ChevronRight size={15} className="ml-auto opacity-40" /></button>)}</nav>
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:p-7">
        {tab === "data" && <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2"><Title text="Meus Dados" /><label>Nome completo<input className="field mt-2" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required /></label><label>Telefone / WhatsApp<input className="field mt-2" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></label><label>CPF<input className="field mt-2" value={profile.cpf} onChange={(e) => setProfile({ ...profile, cpf: e.target.value })} /></label><label>Data de nascimento<input type="date" className="field mt-2" value={profile.birthDate} onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })} /></label><button className="rounded-xl bg-gold px-5 py-3 font-bold text-white sm:col-span-2">Salvar alterações</button></form>}
        {tab === "address" && <AddressPanel address={address} setAddress={setAddress} onSave={saveAddress} />}
        {tab === "favorites" && <FavoritesPanel user={user} />}
        {tab === "adoptions" && <RequestsPanel title="Minhas Adoções" requests={requests.filter((request) => request.status === "pending" || request.status === "approved")} empty="Você ainda não iniciou nenhum processo de adoção." />}
        {tab === "security" && <form onSubmit={savePassword} className="grid gap-4"><Title text="Segurança" /><label>Senha atual<input name="current" type="password" className="field mt-2" required /></label><label>Nova senha<input name="next" type="password" minLength={6} className="field mt-2" required /></label><label>Confirmar nova senha<input name="confirm" type="password" minLength={6} className="field mt-2" required /></label><button className="rounded-xl bg-gold px-5 py-3 font-bold text-white">Alterar senha</button></form>}
      </section>
    </div>
    <section className="mt-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:p-7"><RequestsPanel title="Histórico de Adoções" requests={requests.filter((request) => request.status === "completed" || request.status === "cancelled")} empty="Nenhum processo concluído ou encerrado." /></section>
  </div></main>;
}

function Title({ text }: { text: string }) { return <div className="sm:col-span-2"><h2 className="text-2xl font-bold">{text}</h2><div className="mt-2 h-px bg-stone-100" /></div>; }
function AddressPanel({ address, setAddress, onSave }: { address: UserAddress; setAddress: (value: UserAddress) => void; onSave: (event: FormEvent) => void }) { return <form onSubmit={onSave} className="grid gap-4 sm:grid-cols-2"><Title text="Endereço para adoção responsável" />{(["cep", "street", "number", "neighborhood", "city", "reference"] as const).map((field) => <label key={field}>{({ cep: "CEP", street: "Rua", number: "Número", neighborhood: "Bairro", city: "Cidade", reference: "Ponto de referência" }[field])}<input className="field mt-2" value={address[field]} onChange={(e) => setAddress({ ...address, [field]: e.target.value })} /></label>)}<button className="rounded-xl bg-gold px-5 py-3 font-bold text-white sm:col-span-2">Salvar endereço</button></form>; }
function FavoritesPanel({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) { return <div><Title text="Pets Favoritos" />{user.favorites.length === 0 ? <p className="mt-5 text-stone-500">Você ainda não salvou nenhum pet.</p> : <div className="mt-5 grid gap-3">{user.favorites.map((item) => <Link key={`${item.type}-${item.id}`} href={item.type === "pet" ? `/pets/${item.id}` : "#"} className="flex items-center gap-3 rounded-xl border border-stone-200 p-3"><img src={item.imageUrl} alt="" className="h-14 w-14 rounded-lg object-cover" /><span className="font-semibold">{item.name}</span><ChevronRight className="ml-auto text-stone-400" size={17} /></Link>)}</div>}</div>; }
function RequestsPanel({ title, requests, empty }: { title: string; requests: AdoptionRequest[]; empty: string }) { return <div><Title text={title} />{requests.length === 0 ? <p className="mt-5 text-stone-500">{empty}</p> : <div className="mt-5 space-y-3">{requests.map((request) => <article key={request.id} className="flex gap-4 rounded-2xl border border-stone-200 p-4"><img src={request.imageUrl ?? "/samples/placeholder.svg"} alt="" className="h-16 w-16 rounded-xl object-cover" /><div className="flex-1"><div className="flex justify-between gap-2"><p className="font-bold">{request.petName}</p><span className="rounded-full bg-gold/15 px-2 py-1 text-xs text-gold">{statusLabel(request.status)}</span></div><p className="mt-1 text-xs text-stone-500">Solicitado em {new Date(request.createdAt).toLocaleDateString("pt-BR")}</p></div></article>)}</div>}</div>; }
