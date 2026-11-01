import Image from "next/image";
import { ArrowRight, MapPin, MessageCircle } from "lucide-react";
import { Catalog } from "@/components/Catalog";
import { business, whatsappLink } from "@/lib/business";
import { Header } from "@/components/Header";
import { FadeIn } from "@/components/Motion";
import { InstallPrompt } from "@/components/InstallPrompt";

export default function Home() {
  return <div className="bg-cream">
    <header className="bg-cream text-stone-800"><Header />
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-12 md:grid-cols-2 md:items-center md:pt-24"><FadeIn><p className="mb-4 font-semibold uppercase tracking-[.25em] text-gold">Adoção • Cuidado • Conexão</p><h1 className="font-sans text-5xl uppercase leading-[.95] sm:text-6xl md:text-8xl">Um amigo espera por você.</h1><p className="mt-6 max-w-md text-lg text-stone-600">Conheça pets que precisam de um lar e dê o próximo passo para uma adoção responsável.</p><div className="mt-8 flex flex-wrap gap-3"><a href="/pets" className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-3 font-bold text-white transition-colors hover:bg-amber-800">Conhecer pets <ArrowRight size={18} /></a><a href={whatsappLink()} className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-4 py-3 text-stone-700 transition-colors hover:border-gold hover:text-gold"><MessageCircle size={18} /> Falar via WhatsApp</a></div></FadeIn><FadeIn className="flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] border border-stone-100 bg-white p-2 shadow-lg shadow-black/5"><Image src="/logo-petcare.png" alt="PetCare Logo" width={620} height={620} priority className="h-full w-full scale-125 object-contain" /></FadeIn></section>
    </header>
    <FadeIn><section id="como-funciona" className="border-y border-stone-200 bg-white px-5 py-16"><div className="mx-auto max-w-6xl"><p className="font-semibold uppercase tracking-widest text-gold">Como funciona</p><h2 className="mt-2 font-sans text-4xl uppercase">Adoção responsável</h2><p className="mt-4 max-w-2xl text-stone-600">Veja os pets disponíveis, leia suas histórias e características e fale conosco pelo WhatsApp. Nossa equipe ajuda a conectar você ao animal ideal.</p></div></section></FadeIn>
    <FadeIn><section id="contato" className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-2"><div><p className="font-semibold uppercase tracking-widest text-gold">Fale com a gente</p><h2 className="mt-2 font-sans text-4xl uppercase">Pronto para adotar?</h2><p className="mt-4 flex gap-2 text-stone-600"><MapPin className="shrink-0 text-gold" />{business.address}</p><a className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-3 font-bold text-white transition-colors hover:bg-amber-800" href={whatsappLink()}>Falar via WhatsApp</a></div></section></FadeIn>
    <Catalog />
    <footer className="bg-cream px-5 py-8 text-center text-sm text-stone-600"><p>© {new Date().getFullYear()} PetCare · Adoção responsável</p><InstallPrompt /></footer>
  </div>;
}
