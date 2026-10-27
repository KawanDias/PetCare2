import { Header } from "@/components/Header";
import { BookingForm } from "@/components/BookingForm";

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const params = await searchParams;
  return <><Header /><main className="mx-auto min-w-0 min-h-screen max-w-5xl px-5 py-12"><p className="text-sm uppercase tracking-widest text-gold">Sua vez</p><h1 className="mt-2 font-sans text-4xl uppercase sm:text-5xl">Agende online</h1><p className="mt-3 text-white/60">Escolha profissional, data e horário. O serviço selecionado no portfólio já aparece abaixo.</p><div className="mt-8"><BookingForm initialServiceId={params.service} /></div></main></>;
}
