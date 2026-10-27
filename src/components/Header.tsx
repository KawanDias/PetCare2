"use client";

import Link from "next/link";
import { Menu, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { motion } from "framer-motion";

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, role } = useAuth();
  const links = [["Início", "/"], ["Serviços / Agendar", "/#agendar"], ["Portfólio", "/portfolio"], ["Produtos", "/produtos"], ["Sobre / Localização", "/#localizacao"]] as const;
  return <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Link href="/" className="shrink-0 font-bold tracking-widest text-white transition-colors hover:text-amber-400">PONGO<span className="text-gold">.</span></Link><button aria-label="Abrir menu" className="shrink-0 transition-colors hover:text-amber-400 md:hidden" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button><nav className={`${open ? "absolute left-0 right-0 top-full grid border-b border-white/10 bg-ink p-5" : "hidden"} gap-4 md:static md:flex md:items-center md:border-0 md:bg-transparent md:p-0`}>{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="text-sm text-white/70 transition-colors hover:text-amber-400">{label}</Link>)}<Link href={user ? "/perfil" : "/login"} onClick={() => setOpen(false)} className="inline-flex w-fit max-w-full items-center gap-2 rounded-xl border border-gold/50 px-3 py-2 text-sm text-gold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/20"><UserRound size={16} />{user ? "Meu perfil" : "Entrar"}</Link>{role === "admin" && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Link href="/admin" onClick={() => setOpen(false)} className="text-sm text-gold transition-colors hover:text-amber-400">Painel Admin</Link></motion.div>}</nav></div></header>;
}
