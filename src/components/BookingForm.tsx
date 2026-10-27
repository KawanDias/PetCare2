"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { onValue, ref } from "firebase/database";
import { database } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { useBookings } from "@/components/BookingProvider";

export function BookingForm({ initialServiceId }: { initialServiceId?: string }) {
  const { user } = useAuth();
  const { createBooking } = useBookings();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  useEffect(() => onValue(ref(database, "services"), (snapshot) => {
    const value = snapshot.val() as Record<string, Omit<Service, "id">> | null;
    setServices(Object.entries(value ?? {}).map(([id, item]) => ({ id, ...item })));
  }), []);
  const availableDays = getAvailableDays();
  const [selectedDate, setSelectedDate] = useState(availableDays[0]?.value ?? "");
  const [isDraggingDays, setIsDraggingDays] = useState(false);
  const daysScrollerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ active: false, startX: 0, startScrollLeft: 0, moved: false });
  function scrollDays(direction: number) {
    daysScrollerRef.current?.scrollBy({ left: direction * 260, behavior: "smooth" });
  }
  function handleDragStart(event: MouseEvent<HTMLDivElement>) {
    if (event.button !== 0 || !daysScrollerRef.current) return;
    dragState.current = { active: true, startX: event.clientX, startScrollLeft: daysScrollerRef.current.scrollLeft, moved: false };
    setIsDraggingDays(true);
  }
  function handleDragMove(event: MouseEvent<HTMLDivElement>) {
    if (!dragState.current.active || !daysScrollerRef.current) return;
    const distance = event.clientX - dragState.current.startX;
    if (Math.abs(distance) > 4) dragState.current.moved = true;
    daysScrollerRef.current.scrollLeft = dragState.current.startScrollLeft - distance;
  }
  function handleDragEnd() {
    dragState.current.active = false;
    setIsDraggingDays(false);
  }
  function selectDay(value: string) {
    if (dragState.current.moved) {
      dragState.current.moved = false;
      return;
    }
    setSelectedDate(value);
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setMessage("");
    const data = new FormData(e.currentTarget);
    const service = services.find((item) => item.id === data.get("service"));
    if (!service) { setMessage("Nenhum serviço disponível para agendamento."); setLoading(false); return; }
    if (!user) { setMessage("Entre na sua conta para reservar e acompanhar o agendamento."); setLoading(false); return; }
    try {
      const paymentStatus = String(data.get("payment")) as "pending" | "paid";
      const booking = createBooking({
        customerId: user.uid, customerName: String(data.get("name") || user.displayName || ""), customerPhone: String(data.get("phone")),
        customerEmail: String(data.get("email") || ""), serviceId: service.id, serviceName: service.name,
        date: String(data.get("date")), time: String(data.get("time")), priceCents: service.priceCents,
        durationMinutes: service.durationMinutes, professionalId: String(data.get("professional") || "fernando"),
        professionalName: "Fernando", paymentStatus
      });
      setMessage(paymentStatus === "paid" ? `Agendamento ${booking.id} confirmado e pagamento simulado como pago.` : `Agendamento ${booking.id} reservado. O pagamento será feito no local.`);
      e.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível reservar o horário.");
    } finally { setLoading(false); }
  }
  return <form onSubmit={submit} className="grid min-w-0 gap-3 rounded-3xl border border-white/10 bg-panel p-4 shadow-xl sm:p-5 md:grid-cols-2">
    <input name="name" required placeholder="Seu nome" className="field" />
    <input name="phone" required placeholder="WhatsApp" className="field" />
    <input name="email" type="email" placeholder="E-mail (opcional)" className="field" />
    <select name="service" defaultValue={initialServiceId} className="field" required disabled={services.length === 0}><option value="">{services.length ? "Selecione um serviço" : "Nenhum serviço disponível"}</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name} - R$ {(s.priceCents / 100).toFixed(2)} ({s.durationMinutes} min)</option>)}</select>
    <select name="professional" className="field"><option value="fernando">Fernando · Especialista</option></select>
    <div className="min-w-0 md:col-span-2">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
        <label className="text-sm font-semibold text-white/80">Escolha o dia</label>
        <span className="text-xs text-white/50">Dias disponíveis para atendimento</span>
      </div>
      <input name="date" type="hidden" value={selectedDate} required />
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Dias anteriores" onClick={() => scrollDays(-1)} className="hidden shrink-0 rounded-full border border-white/10 bg-ink p-2 text-white/60 transition hover:border-gold hover:text-gold md:inline-flex">
          <ChevronLeft size={18} />
        </button>
        <div
          ref={daysScrollerRef}
          className={`flex w-full max-w-full min-w-0 space-x-3 overflow-x-auto overscroll-x-contain pb-2 no-scrollbar md:cursor-grab ${isDraggingDays ? "md:cursor-grabbing" : ""}`}
          aria-label="Dias disponíveis"
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
        {availableDays.map((day) => (
          <button
            key={day.value}
            type="button"
            onClick={() => selectDay(day.value)}
            className={`w-20 min-w-[75px] flex-shrink-0 rounded-2xl border px-3 py-3 text-center transition-all duration-300 ${
              selectedDate === day.value
                ? "border-gold bg-gold text-ink shadow-lg shadow-amber-500/20"
                : "border-white/10 bg-ink text-white/70 hover:border-gold/60 hover:text-gold"
            }`}
          >
            <span className="block text-[11px] uppercase tracking-wider">{day.weekday}</span>
            <strong className="mt-1 block text-2xl">{day.day}</strong>
            <span className="block text-[11px] uppercase">{day.month}</span>
          </button>
        ))}
        </div>
        <button type="button" aria-label="Próximos dias" onClick={() => scrollDays(1)} className="hidden shrink-0 rounded-full border border-white/10 bg-ink p-2 text-white/60 transition hover:border-gold hover:text-gold md:inline-flex">
          <ChevronRight size={18} />
        </button>
      </div>
      {selectedDate && <p className="mt-2 text-xs text-gold">Dia selecionado: {formatSelectedDate(selectedDate)}</p>}
    </div>
    <select name="time" required className="field">{["09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00","18:00"].map((time) => <option key={time}>{time}</option>)}</select>
    <fieldset className="min-w-0 md:col-span-2 grid gap-2 sm:grid-cols-2">
      <legend className="mb-1 text-sm text-white/60">Forma de pagamento</legend>
      <label className="flex min-w-0 items-start gap-2 rounded-xl border border-white/10 p-3 text-sm"><input type="radio" name="payment" value="pending" defaultChecked className="mt-0.5 shrink-0" /><span>Agendar e Pagar no Local</span></label>
      <label className="flex min-w-0 items-start gap-2 rounded-xl border border-white/10 p-3 text-sm"><input type="radio" name="payment" value="paid" className="mt-0.5 shrink-0" /><span>Pagar Agora (Antecipado)</span></label>
    </fieldset>
    <button disabled={loading || !selectedDate} className="md:col-span-2 rounded-xl bg-gold px-5 py-3 font-bold text-ink transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Reservando..." : "Confirmar agendamento"}</button>
    {message && <p role="status" className="md:col-span-2 text-sm text-white/70">{message}</p>}
  </form>;
}

type Service = { id: string; name: string; priceCents: number; durationMinutes: number; category: string };

function getAvailableDays() {
  const days: Array<{ value: string; weekday: string; day: string; month: string }> = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  while (days.length < 14) {
    const weekDay = cursor.getDay();
    if (weekDay >= 2 && weekDay <= 6) {
      const value = [
        cursor.getFullYear(),
        String(cursor.getMonth() + 1).padStart(2, "0"),
        String(cursor.getDate()).padStart(2, "0")
      ].join("-");
      days.push({
        value,
        weekday: cursor.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        day: String(cursor.getDate()),
        month: cursor.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function formatSelectedDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  });
}
