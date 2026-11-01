"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { PetCard } from "@/components/PetCard";
import { Pet } from "@/lib/catalog-data";
import { onValue, ref } from "firebase/database";
import { database } from "@/lib/firebase";

function normalizePets(value: unknown): Pet[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.keys(value).map((id) => {
    const pet = (value as Record<string, Partial<Pet> | null>)[id] ?? {};
    return { ...pet, id, status: pet.status || "disponivel" } as Pet;
  });
}

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("Todas");
  useEffect(() => {
    const petsRef = ref(database, "pets");
    const unsubscribe = onValue(petsRef, (snapshot) => {
      setPets(normalizePets(snapshot.val()));
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar pets diretamente do Firebase.", error);
      setPets([]);
      setLoading(false);
    });
    return unsubscribe;
  }, []);
  const filtered = useMemo(() => pets.filter((pet) => (!pet.status || pet.status.toLocaleLowerCase() !== "adotado") && (species === "Todas" || pet.species === species) && `${pet.name} ${pet.breed} ${pet.temperament}`.toLowerCase().includes(search.toLowerCase())), [pets, search, species]);
  return <><Header /><main className="mx-auto min-h-screen max-w-6xl px-5 py-12"><p className="text-sm uppercase tracking-widest text-gold">Adoção responsável</p><h1 className="mt-2 font-sans text-4xl uppercase sm:text-5xl">Pets esperando por você</h1><p className="mt-4 max-w-2xl text-stone-600">Conheça cada animal, sua história e seus cuidados antes de dar o próximo passo.</p><div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]"><input className="field" placeholder="Buscar por nome, raça ou personalidade..." value={search} onChange={(event) => setSearch(event.target.value)} /><select className="field" value={species} onChange={(event) => setSpecies(event.target.value)}><option>Todas</option><option>Cachorro</option><option>Gato</option><option>Aves</option><option>Outros</option></select></div>{loading ? <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl bg-stone-200" />)}</div> : <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((pet) => <PetCard key={pet.id} pet={pet} />)}</div>}{!loading && filtered.length === 0 && <p className="mt-8 text-stone-600">Nenhum pet disponível no momento.</p>}</main></>;
}
