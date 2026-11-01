"use client";

import Link from "next/link";
import { Pet } from "@/lib/catalog-data";
import { PLACEHOLDER_IMAGE } from "@/lib/mockData";

export function PetCard({ pet }: { pet: Pet }) {
  const image = pet.imageUrls?.[0] ?? pet.images?.[0] ?? pet.image ?? PLACEHOLDER_IMAGE;
  return <Link href={`/pets/${pet.id}`} className="group overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-400/40">
    <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-panel to-gold/20"><img src={image} alt={pet.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
    <div className="p-5"><p className="text-xs uppercase tracking-widest text-gold">{pet.species} · {pet.size}</p><h3 className="mt-2 text-xl font-bold">{pet.name}</h3><p className="mt-1 text-sm text-stone-600">{pet.breed} · {pet.age}</p><p className="mt-4 text-sm text-stone-600">{pet.temperament}</p></div>
  </Link>;
}
