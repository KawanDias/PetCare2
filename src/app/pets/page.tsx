"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { PetCard } from "@/components/PetCard";
import { Pet } from "@/lib/catalog-data";
import { apiFetch } from "@/lib/api";

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("Todas");
  useEffect(() => { void apiFetch<Pet[]>("/api/pets").then(setPets).catch((error) => console.error("Erro ao carregar pets.", error)); }, []);
  const filtered = useMemo(() => pets.filter((pet) => (species === "Todas" || pet.species === species) && `${pet.name} ${pet.breed} ${pet.temperament}`.toLowerCase().includes(search.toLowerCase())), [pets, search, species]);
  return <><Header /><main className="mx-auto min-h-screen max-w-6xl px-5 py-12"><p className="text-sm uppercase tracking-widest text-gold">Adoção responsável</p><h1 className="mt-2 font-sans text-4xl uppercase sm:text-5xl">Pets esperando por você</h1><p className="mt-4 max-w-2xl text-stone-600">Conheça cada animal, sua história e seus cuidados antes de dar o próximo passo.</p><div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]"><input className="field" placeholder="Buscar por nome, raça ou personalidade..." value={search} onChange={(event) => setSearch(event.target.value)} /><select className="field" value={species} onChange={(event) => setSpecies(event.target.value)}><option>Todas</option><option>Cachorro</option><option>Gato</option><option>Aves</option><option>Outros</option></select></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((pet) => <PetCard key={pet.id} pet={pet} />)}</div>{filtered.length === 0 && <p className="mt-8 text-stone-600">Nenhum pet disponível no momento.</p>}</main></>;
}
