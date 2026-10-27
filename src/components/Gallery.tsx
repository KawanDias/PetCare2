"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { PortfolioItem } from "@/lib/catalog-data";
import { database } from "@/lib/firebase";
import { PortfolioCard } from "@/components/PortfolioCard";

export function Gallery() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  useEffect(() => onValue(ref(database, "gallery"), (snapshot) => {
    const value = snapshot.val() as Record<string, Omit<PortfolioItem, "id">> | null;
    setItems(Object.entries(value ?? {}).map(([id, item]) => ({ id, ...item })).filter((item) => item.emDestaque));
  }), []);
  return <section className="bg-ink px-5 py-16 text-white"><div className="mx-auto max-w-6xl"><div className="flex items-end justify-between gap-4"><div><p className="font-semibold uppercase tracking-widest text-gold">Portfólio</p><h2 className="mt-2 font-sans text-4xl uppercase">Nossos trabalhos</h2></div><Link href="/portfolio" className="text-sm text-gold">Ver tudo →</Link></div><div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">{items.slice(0, 4).map((item) => <PortfolioCard key={item.id} item={item} />)}</div>{items.length === 0 && <p className="mt-8 text-white/60">Nenhum corte cadastrado.</p>}</div></section>;
}
