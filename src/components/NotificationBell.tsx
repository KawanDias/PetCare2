"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { database } from "@/lib/firebase";

export function NotificationBell() {
  const { role } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (role !== "admin") {
      setPendingCount(0);
      return;
    }
    const unsubscribe = onValue(ref(database, "solicitacoes"), (snapshot) => {
      const value = snapshot.val() as Record<string, { status?: string }> | null;
      const count = Object.values(value ?? {}).filter((request) => request.status === "pending" || request.status === "pendente").length;
      setPendingCount(count);
    }, (error) => {
      console.error("Não foi possível acompanhar as notificações de adoção.", error);
      setPendingCount(0);
    });
    return unsubscribe;
  }, [role]);

  if (role !== "admin") return null;
  return <Link href="/admin?tab=adoptions" aria-label={`Notificações: ${pendingCount} pendentes`} className="relative inline-flex rounded-xl border border-stone-200 bg-white p-3 text-stone-600 shadow-sm transition hover:text-gold"><Bell size={22} />{pendingCount > 0 && <span className="absolute -right-2 -top-2 grid min-h-6 min-w-6 place-items-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">{pendingCount > 99 ? "99+" : pendingCount}</span>}</Link>;
}
