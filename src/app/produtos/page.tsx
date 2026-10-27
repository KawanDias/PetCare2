"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { CatalogCard } from "@/components/CatalogCard";
import { Header } from "@/components/Header";
import { fallbackProducts, Product } from "@/lib/catalog-data";
import { db } from "@/lib/firebase";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  useEffect(() => { if (!db) return; void getDocs(collection(db, "products")).then((snapshot) => { if (snapshot.size) setProducts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Product))); }); }, []);
  const categories = ["Todas", ...Array.from(new Set(products.map((item) => item.category)))];
  const filtered = useMemo(() => products.filter((item) => (category === "Todas" || item.category === category) && item.name.toLowerCase().includes(search.toLowerCase())), [products, search, category]);
  return <><Header /><main className="mx-auto min-w-0 min-h-screen max-w-6xl px-5 py-12"><p className="text-sm uppercase tracking-widest text-gold">Catálogo completo</p><h1 className="mt-2 font-sans text-4xl uppercase sm:text-5xl">Produtos do Pongo</h1><div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]"><input className="field min-w-0" placeholder="Buscar produto..." value={search} onChange={(event) => setSearch(event.target.value)} /><select className="field min-w-0" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((product) => <CatalogCard key={product.id} product={product} />)}</div></main></>;
}
