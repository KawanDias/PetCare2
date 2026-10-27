"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { Header } from "@/components/Header";
import { PortfolioCard } from "@/components/PortfolioCard";
import { PortfolioItem } from "@/lib/catalog-data";
import { database } from "@/lib/firebase";

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  useEffect(() => onValue(ref(database, "gallery"), (snapshot) => {
    const value = snapshot.val() as Record<string, Omit<PortfolioItem, "id">> | null;
    setItems(Object.entries(value ?? {}).map(([id, item]) => ({ id, ...item })));
  }), []);
  return <><Header /><main className="mx-auto min-w-0 min-h-screen max-w-6xl px-5 py-12"><p className="text-sm uppercase tracking-widest text-gold">Portfólio completo</p><h1 className="mt-2 font-sans text-4xl uppercase sm:text-5xl">Cortes do Pongo</h1><div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">{items.map((item) => <PortfolioCard key={item.id} item={item} />)}</div>{items.length === 0 && <p className="mt-8 text-white/60">Nenhum corte cadastrado.</p>}</main></>;
}
