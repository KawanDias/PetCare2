"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { CatalogCard } from "@/components/CatalogCard";
import { Product } from "@/lib/catalog-data";
import { database } from "@/lib/firebase";

export function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => onValue(ref(database, "products"), (snapshot) => {
    const value = snapshot.val() as Record<string, Omit<Product, "id">> | null;
    setProducts(Object.entries(value ?? {}).map(([id, item]) => ({ id, ...item })).filter((item) => item.emDestaque));
  }), []);
  return <section className="mx-auto max-w-6xl px-5 py-16"><div className="flex items-end justify-between gap-4"><div><p className="font-semibold uppercase tracking-widest text-gold">Na bancada</p><h2 className="mt-2 font-sans text-4xl uppercase">Produtos do Pongo</h2></div><Link href="/produtos" className="text-sm text-gold">Ver todos →</Link></div><div className="mt-8 grid gap-4 sm:grid-cols-3">{products.slice(0, 3).map((product) => <CatalogCard key={product.id} product={product} />)}</div>{products.length === 0 && <p className="mt-8 text-white/60">Nenhum produto cadastrado.</p>}</section>;
}
