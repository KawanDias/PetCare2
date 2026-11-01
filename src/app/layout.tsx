import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { InstallPrompt } from "@/components/InstallPrompt";
import { AuthProvider } from "@/components/AuthProvider";
import { BookingProvider } from "@/components/BookingProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
export const metadata: Metadata = {
  title: "PetCare | Adoção responsável",
  description: "Encontre seu novo melhor amigo.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-petcare.png",
    shortcut: "/logo-petcare.png",
    apple: "/logo-petcare.png"
  }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className={inter.variable}><AuthProvider><BookingProvider><main>{children}</main></BookingProvider></AuthProvider></body></html>;
}
