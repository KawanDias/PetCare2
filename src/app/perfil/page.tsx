"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, Camera, Check, ChevronRight, Clock3, Heart, Home, LogOut, MapPin, Shield, Star, UserRound } from "lucide-react";
import { useAuth, type UserAddress } from "@/components/AuthProvider";
import { useBookings, type LocalBooking, type ReminderOption } from "@/components/BookingProvider";
import { whatsappLink } from "@/lib/business";
import { formatPrice } from "@/lib/catalog-data";

type Tab = "data" | "access" | "address" | "favorites" | "appointments" | "security" | "history";
const tabs: Array<[Tab, string, typeof UserRound]> = [["data", "Meus Dados", UserRound], ["access", "Meus Acessos", Shield], ["address", "Endereço", MapPin], ["favorites", "Favoritos", Heart], ["appointments", "Meus Agendamentos", CalendarDays], ["security", "Segurança", Shield], ["history", "Histórico", CalendarDays]];
const emptyAddress: UserAddress = { cep: "", street: "", number: "", neighborhood: "", city: "", reference: "" };
const reminderLabels: Record<ReminderOption, string> = { "15m": "15 minutos antes", "25m": "25 minutos antes", "40m": "40 minutos antes", "1h": "1 hora antes", "2h": "2 horas antes" };
function maskPhone(value: string) { const digits = value.replace(/\D/g, "").slice(0, 11); if (digits.length <= 2) return digits.length ? `(${digits}` : ""; if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`; return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`; }

function appointmentDate(booking: LocalBooking) { return new Date(`${booking.date}T${booking.time}:00`); }
function statusLabel(status: LocalBooking["status"]) { return { pending: "Pendente", confirmed: "Confirmado", completed: "Concluído", cancelled: "Cancelado" }[status]; }
function statusClass(status: LocalBooking["status"]) { return { pending: "bg-amber-500/15 text-amber-300", confirmed: "bg-green-500/15 text-green-300", completed: "bg-white/10 text-white/60", cancelled: "bg-red-500/15 text-red-300" }[status]; }

export default function ProfilePage() {
  const { user, loading, updateProfile, changePassword, logout } = useAuth();
  const router = useRouter();
  const { bookings, cancelBooking, setReminder, rateBooking } = useBookings();
  const [tab, setTab] = useState<Tab>("data");
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState({ name: "", phone: "", cpf: "", birthDate: "" });
  const [address, setAddress] = useState<UserAddress>(emptyAddress);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) return;
    setProfile({ name: user.displayName, phone: user.phone ?? "", cpf: user.cpf ?? "", birthDate: user.birthDate ?? "" });
    setAddress(user.address ?? emptyAddress);
    setAvatar(user.photoURL);
  }, [user]);

  const userBookings = useMemo(() => bookings.filter((booking) => booking.customerId === user?.uid), [bookings, user]);
  const active = userBookings.filter((booking) => (booking.status === "pending" || booking.status === "confirmed") && appointmentDate(booking) > new Date());
  const history = userBookings.filter((booking) => booking.status === "completed" || booking.status === "cancelled" || appointmentDate(booking) <= new Date());

  if (loading) return <main className="grid min-h-screen place-items-center">Carregando...</main>;
  if (!user) return <main className="grid min-h-screen place-items-center p-5">Redirecionando...</main>;

  function showNotice(message: string) { setNotice(message); window.setTimeout(() => setNotice(""), 3500); }
  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ displayName: profile.name.trim(), phone: profile.phone, cpf: profile.cpf, birthDate: profile.birthDate });
      window.location.reload();
    } catch (error) {
      console.error("Erro ao salvar dados do perfil:", error);
      window.alert("Erro ao salvar dados. Tente novamente.");
    } finally {
      setSavingProfile(false);
    }
  }
  async function saveAddress(event: FormEvent) {
    event.preventDefault();
    try {
      await updateProfile({ address });
      showNotice("Endereço salvo com sucesso.");
    } catch {
      showNotice("Não foi possível salvar o endereço.");
    }
  }
  function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showNotice("Selecione um arquivo de imagem."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const photoURL = String(reader.result);
      setAvatar(photoURL);
      updateProfile({ photoURL });
      showNotice("Foto de perfil atualizada.");
    };
    reader.readAsDataURL(file);
  }
  async function logoutWithConfirmation() {
    if (window.confirm("Deseja realmente sair da sua conta?")) await logout();
  }

  return <main className="min-h-screen px-5 py-8 pb-20">
    {notice && <div role="status" className="fixed bottom-6 right-5 z-50 flex items-center gap-2 rounded-xl border border-green-400/30 bg-green-950 px-4 py-3 text-sm text-green-200 shadow-xl"><Check size={17} />{notice}</div>}
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between"><Link href="/" className="inline-flex items-center gap-2 text-sm text-gold"><Home size={16} /> Início</Link><button type="button" onClick={logoutWithConfirmation} className="inline-flex items-center gap-2 text-sm text-red-300"><LogOut size={16} /> Sair</button></div>
      <section className="mt-7 flex flex-wrap items-center gap-4 rounded-3xl border border-white/10 bg-panel p-5">
        <label className="relative cursor-pointer"><div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-gold text-3xl font-bold text-ink">{avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : user.displayName.charAt(0).toUpperCase()}</div><span className="absolute bottom-0 right-0 rounded-full bg-gold p-2 text-ink"><Camera size={15} /></span><input type="file" accept="image/*" className="sr-only" onChange={uploadAvatar} /></label>
        <div><h1 className="text-2xl font-bold">{user.displayName}</h1><p className="text-sm text-white/50">{user.email}</p></div>
      </section>
      <div className="mt-5 grid gap-5 lg:grid-cols-[230px_1fr]">
        <nav className="overflow-hidden rounded-3xl border border-white/10 bg-panel">{tabs.map(([id, label, Icon]) => <button key={id} type="button" onClick={() => setTab(id)} className={`flex w-full items-center gap-3 border-b border-white/10 px-4 py-3 text-left text-sm last:border-0 ${tab === id ? "bg-gold/15 text-gold" : "text-white/75"}`}><Icon size={17} /><span>{label}</span><ChevronRight size={15} className="ml-auto opacity-40" /></button>)}</nav>
        <section className="rounded-3xl border border-white/10 bg-panel p-5 md:p-7">
          {tab === "data" && <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2"><SectionTitle title="Meus Dados" /><label>Nome completo<input className="field mt-2" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required /></label><label>Telefone / WhatsApp<input className="field mt-2" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: maskPhone(e.target.value) })} placeholder="(42) 99999-9999" /></label><label>CPF (opcional)<input className="field mt-2" value={profile.cpf} onChange={(e) => setProfile({ ...profile, cpf: e.target.value })} /></label><label>Data de nascimento<input type="date" className="field mt-2" value={profile.birthDate} onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })} /></label><button disabled={savingProfile} className="rounded-xl bg-gold px-5 py-3 font-bold text-ink disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2">{savingProfile ? "Salvando..." : profileSaved ? "Salvo com sucesso!" : "Salvar Alterações"}</button></form>}
          {tab === "access" && <AccessPanel user={user} onLogout={logoutWithConfirmation} />}
          {tab === "security" && <SecurityPanel onChange={changePassword} onNotice={showNotice} />}
          {tab === "address" && <AddressPanel address={address} setAddress={setAddress} onSave={saveAddress} onNotice={showNotice} />}
          {tab === "favorites" && <FavoritesPanel user={user} />}
          {tab === "appointments" && <AppointmentsList bookings={active} onCancel={cancelBooking} onReminder={setReminder} onNotice={showNotice} />}
          {tab === "history" && <HistoryList bookings={history} onRate={rateBooking} />}
        </section>
      </div>
    </div>
  </main>;
}

function SectionTitle({ title }: { title: string }) { return <div className="sm:col-span-2"><h2 className="text-2xl font-bold">{title}</h2><div className="mt-2 h-px bg-white/10" /></div>; }
function AccessPanel({ user, onLogout }: { user: ReturnType<typeof useAuth>["user"]; onLogout: () => void }) { return <div className="space-y-5"><SectionTitle title="Meus Acessos" /><div className="rounded-xl border border-white/10 p-4"><p className="font-semibold">E-mail e senha</p><p className="mt-1 text-sm text-white/50">Método ativo · {user?.lastLoginAt ? `último acesso em ${new Date(user.lastLoginAt).toLocaleString("pt-BR")}` : "sessão local"}</p></div><div className="rounded-xl border border-white/10 p-4"><p className="font-semibold">Google</p><p className="mt-1 text-sm text-white/50">Não vinculado · disponível em breve</p></div><button type="button" onClick={onLogout} className="rounded-xl border border-red-400/30 px-4 py-3 text-red-300">Sair da Conta</button></div>; }
function SecurityPanel({ onChange, onNotice }: { onChange: (current: string, next: string) => void; onNotice: (message: string) => void }) { const [values, setValues] = useState({ current: "", next: "", confirm: "" }); function submit(event: FormEvent) { event.preventDefault(); if (values.next !== values.confirm) { onNotice("A confirmação da nova senha não confere."); return; } try { onChange(values.current, values.next); setValues({ current: "", next: "", confirm: "" }); onNotice("Senha alterada com sucesso."); } catch (error) { onNotice(error instanceof Error && error.message === "INVALID_CURRENT_PASSWORD" ? "A senha atual está incorreta." : "A nova senha deve ter pelo menos 6 caracteres."); } } return <form onSubmit={submit} className="grid gap-4"><SectionTitle title="Segurança" /><label>Senha atual<input type="password" className="field mt-2" value={values.current} onChange={(e) => setValues({ ...values, current: e.target.value })} required /></label><label>Nova senha<input type="password" className="field mt-2" value={values.next} onChange={(e) => setValues({ ...values, next: e.target.value })} minLength={6} required /></label><label>Confirmar nova senha<input type="password" className="field mt-2" value={values.confirm} onChange={(e) => setValues({ ...values, confirm: e.target.value })} minLength={6} required /></label><button className="rounded-xl bg-gold px-5 py-3 font-bold text-ink">Alterar senha</button></form>; }
function AddressPanel({ address, setAddress, onSave, onNotice }: { address: UserAddress; setAddress: (address: UserAddress) => void; onSave: (event: FormEvent) => void; onNotice: (message: string) => void }) { async function lookupCep() { const cep = address.cep.replace(/\D/g, ""); if (cep.length !== 8) { onNotice("Digite um CEP com 8 números."); return; } try { const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`); if (!response.ok) throw new Error("CEP_LOOKUP_FAILED"); const data = await response.json(); if (data.erro) throw new Error("CEP_NOT_FOUND"); setAddress({ ...address, cep, street: data.logradouro ?? "", neighborhood: data.bairro ?? "", city: data.localidade ?? "" }); } catch { onNotice("Não foi possível consultar o CEP. Preencha o endereço manualmente."); } } return <form onSubmit={onSave} className="grid gap-4 sm:grid-cols-2"><SectionTitle title="Endereço" /><label>CEP<div className="mt-2 flex gap-2"><input className="field" value={address.cep} onChange={(e) => setAddress({ ...address, cep: e.target.value })} /><button type="button" onClick={lookupCep} className="rounded-xl border border-gold px-3 text-sm text-gold">Buscar</button></div></label><label>Rua<input className="field mt-2" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} /></label><label>Número<input className="field mt-2" value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} /></label><label>Bairro<input className="field mt-2" value={address.neighborhood} onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })} /></label><label>Cidade<input className="field mt-2" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} /></label><label>Ponto de referência<input className="field mt-2" value={address.reference} onChange={(e) => setAddress({ ...address, reference: e.target.value })} /></label><button className="rounded-xl bg-gold px-5 py-3 font-bold text-ink sm:col-span-2">Salvar Endereço</button></form>; }
function FavoritesPanel({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) { return <div><SectionTitle title="Favoritos" />{user.favorites.length === 0 ? <p className="mt-5 text-white/50">Você ainda não favoritou nenhum item.</p> : <div className="mt-5 grid gap-3">{user.favorites.map((item) => <article key={`${item.type}-${item.id}`} className="flex items-center gap-3 rounded-xl border border-white/10 p-3"><img src={item.imageUrl} alt="" className="h-14 w-14 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="font-semibold">{item.name}</p><p className="text-sm text-price">{formatPrice(item.priceCents)}</p></div>{item.type === "portfolio" ? <Link href={`/agendar?service=${item.serviceId ?? ""}`} className="rounded-lg bg-gold px-3 py-2 text-xs font-bold text-ink">Agendar</Link> : <a href={whatsappLink(`Olá! Quero comprar: ${item.name}.`)} className="rounded-lg bg-gold px-3 py-2 text-xs font-bold text-ink">Comprar</a>}</article>)}</div>}</div>; }
function AppointmentsList({ bookings, onCancel, onReminder, onNotice }: { bookings: LocalBooking[]; onCancel: (id: string) => void; onReminder: (id: string, reminder: ReminderOption) => void; onNotice: (message: string) => void }) { const cancellationMessage = "Cancelamentos só podem ser feitos com no mínimo 2 horas de antecedência. Entre em contato com a barbearia via WhatsApp para alterar."; function cancel(booking: LocalBooking) { if (window.confirm("Cancelar este agendamento?")) onCancel(booking.id); } return <div><SectionTitle title="Meus Agendamentos" />{bookings.length === 0 ? <p className="mt-5 text-white/50">Você não possui agendamentos ativos.</p> : <div className="mt-5 space-y-4">{bookings.map((booking) => { const canCancel = (appointmentDate(booking).getTime() - Date.now()) / 3600000 >= 2; return <article key={booking.id} className="rounded-2xl border border-white/10 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-lg font-bold">{booking.serviceName}</p><p className="mt-1 flex items-center gap-2 text-sm text-white/60"><CalendarDays size={15} /> {new Date(`${booking.date}T12:00:00`).toLocaleDateString("pt-BR")} · <Clock3 size={15} /> {booking.time}</p><p className="mt-2 text-price">{formatPrice(booking.priceCents)} · {booking.paymentStatus === "paid" ? "Pago" : "Pagamento no local"}</p></div><span className={`rounded-full px-3 py-1 text-xs ${statusClass(booking.status)}`}>{statusLabel(booking.status)}</span></div><div className="mt-4 flex flex-wrap items-center gap-2"><select aria-label="Programar lembrete" value={booking.reminder ?? ""} onChange={(e) => e.target.value && onReminder(booking.id, e.target.value as ReminderOption)} className="field max-w-xs text-sm"><option value="">Programar Lembrete</option>{Object.entries(reminderLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{booking.reminder && <span className="text-xs text-gold">Lembrete: {reminderLabels[booking.reminder]}</span>}<button type="button" disabled={!canCancel} onClick={() => cancel(booking)} className="ml-auto rounded-lg border border-red-400/30 px-3 py-2 text-xs text-red-300 disabled:cursor-not-allowed disabled:opacity-40">Cancelar Agendamento</button></div>{!canCancel && <p className="mt-3 text-xs text-white/40">{cancellationMessage} <a className="text-gold" href={whatsappLink("Olá! Preciso alterar um agendamento com menos de 2 horas de antecedência.")}>Abrir WhatsApp</a></p>}</article>; })}</div>}</div>; }
function HistoryList({ bookings, onRate }: { bookings: LocalBooking[]; onRate: (id: string, rating: number, review: string) => void }) { const [reviews, setReviews] = useState<Record<string, string>>({}); return <div><SectionTitle title="Histórico" />{bookings.length === 0 ? <p className="mt-5 text-white/50">Nenhum agendamento no histórico.</p> : <div className="mt-5 space-y-4">{bookings.map((booking) => <article key={booking.id} className="rounded-2xl border border-white/10 p-4"><div className="flex justify-between gap-3"><div><p className="font-bold">{booking.serviceName}</p><p className="text-sm text-white/50">{booking.date} · {booking.time} · {booking.professionalName}</p></div><span className={`rounded-full px-3 py-1 text-xs ${statusClass(booking.status)}`}>{statusLabel(booking.status)}</span></div><Link href={`/agendar?service=${booking.serviceId}`} className="mt-4 inline-block rounded-lg bg-gold px-3 py-2 text-xs font-bold text-ink">Agendar Novamente</Link>{booking.status !== "cancelled" && <div className="mt-4"><div className="flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" onClick={() => onRate(booking.id, star, reviews[booking.id] ?? booking.review ?? "")} className={star <= (booking.rating ?? 0) ? "text-gold" : "text-white/30"}><Star size={20} fill="currentColor" /></button>)}<span className="self-center text-xs text-white/50">{booking.rating ? "Obrigado pela avaliação!" : "Avaliar Serviço"}</span></div><textarea value={reviews[booking.id] ?? booking.review ?? ""} onChange={(event) => setReviews({ ...reviews, [booking.id]: event.target.value })} maxLength={240} placeholder="Comentário curto (opcional)" className="field mt-3 min-h-20" /></div>}</article>)}</div>}</div>; }
