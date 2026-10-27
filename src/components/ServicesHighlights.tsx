"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "@/lib/firebase";

type Service = { id: string; name: string; priceCents: number; durationMinutes: number; category: string };

export function ServicesHighlights() {
  const [services, setServices] = useState<Service[]>([]);
  useEffect(() => onValue(ref(database, "services"), (snapshot) => {
    const value = snapshot.val() as Record<string, Omit<Service, "id">> | null;
    setServices(Object.entries(value ?? {}).map(([id, item]) => ({ id, ...item })));
  }), []);

  return <section className="mx-auto max-w-6xl px-5 py-16"><div className="mb-8"><p className="font-semibold uppercase tracking-widest text-gold">O que fazemos</p><h2 className="mt-2 font-sans text-4xl uppercase">Serviços</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{services.slice(0, 4).map((service) => <article key={service.id} className="rounded-2xl border border-white/10 bg-panel p-5"><h3 className="font-bold">{service.name}</h3><p className="mt-2 text-sm text-white/60">{service.category} · {service.durationMinutes} min</p><p className="mt-5 font-sans text-2xl text-price">R$ {(service.priceCents / 100).toFixed(2).replace(".", ",")}</p></article>)}</div>{services.length === 0 && <p className="text-white/60">Nenhum serviço disponível.</p>}</section>;
}
