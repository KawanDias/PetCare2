"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pet } from "@/lib/catalog-data";
import { PetCard } from "@/components/PetCard";
import { apiFetch } from "@/lib/api";

export function Catalog() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { void apiFetch<Pet[]>("/api/pets").then((items) => setPets(items.filter((item) => item.emDestaque))).catch((error) => console.error("Erro ao carregar pets em destaque.", error)).finally(() => setLoading(false)); }, []);
  return <section className="mx-auto max-w-6xl px-5 py-16"><div className="flex items-end justify-between gap-4"><div><p className="font-semibold uppercase tracking-widest text-gold">Encontre um amigo</p><h2 className="mt-2 font-sans text-4xl uppercase">Pets em destaque</h2></div><Link href="/pets" className="text-sm text-gold">Ver todos →</Link></div>{loading ? <div className="mt-8 grid gap-4 sm:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl bg-stone-200" />)}</div> : <div className="mt-8 grid gap-4 sm:grid-cols-3">{pets.slice(0, 3).map((pet) => <PetCard key={pet.id} pet={pet} />)}</div>}{!loading && pets.length === 0 && <p className="mt-8 text-stone-600">Nenhum pet em destaque no momento.</p>}</section>;
}
