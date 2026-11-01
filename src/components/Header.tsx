"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { motion } from "framer-motion";
import { NotificationBell } from "@/components/NotificationBell";

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, role } = useAuth();
  const links = [["Início", "/"], ["Pets para adoção", "/pets"], ["Como funciona", "/#como-funciona"], ["Sobre / Contato", "/#contato"]] as const;
  return <header className="sticky top-0 z-40 border-b border-stone-200 bg-cream/95 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3"><Link href="/" aria-label="PetCare - início" className="shrink-0"><Image src="/logo-petcare.png" alt="PetCare Logo" width={150} height={54} priority className="h-12 w-auto object-contain" /></Link><div className="flex items-center gap-2"><NotificationBell /><button aria-label="Abrir menu" className="shrink-0 transition-colors hover:text-amber-400 md:hidden" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div><nav className={`${open ? "absolute left-0 right-0 top-full grid border-b border-stone-200 bg-cream p-5" : "hidden"} gap-4 md:static md:flex md:items-center md:border-0 md:bg-transparent md:p-0`}>{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="text-sm text-stone-600 transition-colors hover:text-amber-400">{label}</Link>)}<Link href={user ? "/perfil" : "/login"} onClick={() => setOpen(false)} className="inline-flex w-fit max-w-full items-center gap-2 rounded-xl border border-gold/50 px-3 py-2 text-sm text-gold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/20"><UserRound size={16} />{user ? "Meu perfil" : "Entrar"}</Link>{role === "admin" && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Link href="/admin" onClick={() => setOpen(false)} className="text-sm text-gold transition-colors hover:text-amber-400">Painel Admin</Link></motion.div>}</nav></div></header>;
}
