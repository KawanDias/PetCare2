"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PortfolioItem } from "@/lib/catalog-data";
import { PortfolioCard } from "@/components/PortfolioCard";
import { apiFetch } from "@/lib/api";

export function Gallery() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  useEffect(() => { void apiFetch<PortfolioItem[]>("/api/content/gallery").then((items) => setItems(items.filter((item) => item.emDestaque))).catch((error) => console.error("Erro ao carregar galeria.", error)); }, []);
  return <section className="bg-cream px-5 py-16 text-stone-800"><div className="mx-auto max-w-6xl"><div className="flex items-end justify-between gap-4"><div><p className="font-semibold uppercase tracking-widest text-gold">Portfólio</p><h2 className="mt-2 font-sans text-4xl uppercase">Nossos trabalhos</h2></div><Link href="/portfolio" className="text-sm text-gold">Ver tudo →</Link></div><div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">{items.slice(0, 4).map((item) => <PortfolioCard key={item.id} item={item} />)}</div>{items.length === 0 && <p className="mt-8 text-stone-600">Nenhum corte cadastrado.</p>}</div></section>;
}
