"use client";

import Link from "next/link";
import { CalendarDays, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";

export default function AppointmentsPage() {
  const { user, loading } = useAuth();
  const [appointments, setAppointments] = useState<Array<{ id: string; serviceName?: string; priceCents?: number; date?: string; time?: string }>>([]);
  useEffect(() => { if (!user || !db) return; void getDocs(query(collection(db, "bookings"), where("customerId", "==", user.uid))).then((snapshot) => setAppointments(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))); }, [user]);
  if (loading) return <main className="p-5">Carregando...</main>;
  if (!user) return <main className="p-5"><Link href="/login" className="text-gold">Entre para ver seus agendamentos</Link></main>;
  return <main className="min-h-screen px-5 py-10"><div className="mx-auto min-w-0 max-w-2xl"><Link href="/conta" className="text-sm text-gold">← Minha conta</Link><h1 className="mt-8 font-sans text-4xl uppercase sm:text-5xl">Meus agendamentos</h1>{appointments.length === 0 ? <p className="mt-8 text-white/50">Você ainda não tem agendamentos.</p> : appointments.map((appointment) => <article key={appointment.id} className="mt-5 rounded-3xl border border-white/10 bg-panel p-5"><div className="flex items-start justify-between"><div><p className="text-xs tracking-widest text-gold">A BARBEARIA DO PONGO</p><p className="mt-3 text-2xl font-bold text-price">R$ {((appointment.priceCents ?? 0) / 100).toFixed(2).replace(".", ",")}</p></div><div className="rounded-xl bg-gold p-3 text-center text-ink"><CalendarDays size={19}/><strong className="mt-1 block text-lg">{appointment.date?.slice(-2)}</strong><span className="text-xs">{appointment.date?.slice(5, 7)}</span></div></div><div className="mt-5 flex items-center gap-2 text-white/60"><Clock3 size={17}/> Itens: {appointment.serviceName} · {appointment.time}</div><button className="mt-5 rounded-xl border border-red-400/30 px-4 py-2 text-sm text-red-300">Cancelar agendamento</button></article>)}</div></main>;
}
