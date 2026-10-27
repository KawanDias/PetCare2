"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Header } from "@/components/Header";
import { PortfolioCard } from "@/components/PortfolioCard";
import { fallbackPortfolio, PortfolioItem } from "@/lib/catalog-data";
import { db } from "@/lib/firebase";

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>(fallbackPortfolio);
  useEffect(() => { if (!db) return; void getDocs(collection(db, "gallery")).then((snapshot) => { if (snapshot.size) setItems(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as PortfolioItem))); }); }, []);
  return <><Header /><main className="mx-auto min-w-0 min-h-screen max-w-6xl px-5 py-12"><p className="text-sm uppercase tracking-widest text-gold">Portfólio completo</p><h1 className="mt-2 font-sans text-4xl uppercase sm:text-5xl">Cortes do Pongo</h1><div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">{items.map((item) => <PortfolioCard key={item.id} item={item} />)}</div></main></>;
}
