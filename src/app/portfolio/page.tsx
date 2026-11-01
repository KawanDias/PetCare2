"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { PortfolioCard } from "@/components/PortfolioCard";
import { PortfolioItem } from "@/lib/catalog-data";
import { apiFetch } from "@/lib/api";

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  useEffect(() => { void apiFetch<PortfolioItem[]>("/api/content/gallery").then(setItems).catch((error) => console.error("Erro ao carregar portfólio.", error)); }, []);
  return <><Header /><main className="mx-auto min-w-0 min-h-screen max-w-6xl px-5 py-12"><p className="text-sm uppercase tracking-widest text-gold">Portfólio completo</p><h1 className="mt-2 font-sans text-4xl uppercase sm:text-5xl">Cortes do Pongo</h1><div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">{items.map((item) => <PortfolioCard key={item.id} item={item} />)}</div>{items.length === 0 && <p className="mt-8 text-stone-600">Nenhum corte cadastrado.</p>}</main></>;
}
