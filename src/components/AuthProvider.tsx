"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
  updatePassword,
  type User as FirebaseUser
} from "firebase/auth";
import { get, ref, set, update } from "firebase/database";
import { auth, database, type UserRole } from "@/lib/firebase";

export const ADMIN_EMAIL = "barbeariapongo@gmail.com";

export type UserAddress = {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  reference: string;
};

export type FavoriteItem = {
  id: string;
  type: "product" | "portfolio";
  name: string;
  imageUrl: string;
  priceCents: number;
  serviceId?: string;
};

export type LocalUser = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  phone?: string;
  cpf?: string;
  birthDate?: string;
  address?: UserAddress;
  favorites: FavoriteItem[];
  lastLoginAt?: string;
};

type UserProfile = Partial<Omit<LocalUser, "uid" | "email">> & {
  uid: string;
  email: string;
  nome?: string;
  telefone?: string;
  dataNascimento?: string;
  role?: UserRole;
};

type AuthContextValue = {
  user: LocalUser | null;
  role: UserRole | null;
  loading: boolean;
  loginEmail: (email: string, password: string) => Promise<void>;
  signupEmail: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (changes: Partial<Omit<LocalUser, "uid" | "email" | "favorites">>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  toggleFavorite: (item: FavoriteItem) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
function isAdmin(email: string | null) {
  return email?.toLowerCase() === ADMIN_EMAIL;
}

function toLocalUser(firebaseUser: FirebaseUser, profile: UserProfile | undefined): LocalUser {
  return {
    uid: firebaseUser.uid,
    displayName: profile?.displayName ?? profile?.nome ?? firebaseUser.displayName ?? "Cliente Pongo",
    email: firebaseUser.email ?? profile?.email ?? "",
    photoURL: profile?.photoURL ?? firebaseUser.photoURL ?? null,
    phone: profile?.phone ?? profile?.telefone,
    cpf: profile?.cpf,
    birthDate: profile?.birthDate ?? profile?.dataNascimento,
    address: profile?.address,
    favorites: profile?.favorites ?? [],
    lastLoginAt: profile?.lastLoginAt
  };
}

async function readProfile(firebaseUser: FirebaseUser) {
  const snapshot = await get(ref(database, `users/${firebaseUser.uid}`));
  return snapshot.exists() ? snapshot.val() as UserProfile : undefined;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<LocalUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      const resolvedRole: UserRole = isAdmin(firebaseUser.email) ? "admin" : "cliente";
      setUser(toLocalUser(firebaseUser, undefined));
      setRole(resolvedRole);
      setLoading(false);

      void (async () => {
        try {
          const profile = await readProfile(firebaseUser);
          const lastLoginAt = new Date().toISOString();
          const profileRole: UserRole = isAdmin(firebaseUser.email) ? "admin" : profile?.role ?? "cliente";
          const nextProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? "",
            displayName: profile?.displayName ?? profile?.nome ?? firebaseUser.displayName ?? "Cliente Pongo",
            photoURL: profile?.photoURL ?? firebaseUser.photoURL ?? "",
            favorites: profile?.favorites ?? [],
            lastLoginAt,
            role: profileRole
          };
          await update(ref(database, `users/${firebaseUser.uid}`), nextProfile);
          if (auth.currentUser?.uid !== firebaseUser.uid) return;
          setUser(toLocalUser(firebaseUser, { ...profile, ...nextProfile }));
          setRole(profileRole);
        } catch (error) {
          console.error("Não foi possível carregar o perfil do Firebase.", error);
        }
        console.log("Firebase Auth conectado com sucesso!");
      })();
    });

    return unsubscribe;
  }, []);

  const signup = async (name: string, email: string, password: string, phone = "") => {
    if (!name.trim()) throw new Error("NAME_REQUIRED");
    const credentials = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    await updateFirebaseProfile(credentials.user, { displayName: name.trim() });
    await set(ref(database, `users/${credentials.user.uid}`), {
      uid: credentials.user.uid,
      nome: name.trim(),
      displayName: name.trim(),
      email: credentials.user.email,
      telefone: phone,
      phone,
      fotoURL: "",
      photoURL: null,
      favorites: [],
      role: "cliente",
      createdAt: new Date().toISOString()
    });
    setUser({
      uid: credentials.user.uid,
      displayName: name.trim(),
      email: credentials.user.email ?? email,
      photoURL: null,
      phone,
      favorites: [],
      lastLoginAt: new Date().toISOString()
    });
    setRole("cliente");
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    role,
    loading,
    loginEmail: async (email, password) => {
      const credentials = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      setUser(toLocalUser(credentials.user, undefined));
      setRole(isAdmin(credentials.user.email) ? "admin" : "cliente");
      setLoading(false);
    },
    signupEmail: signup,
    signIn: async (email, password) => {
      const credentials = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      setUser(toLocalUser(credentials.user, undefined));
      setRole(isAdmin(credentials.user.email) ? "admin" : "cliente");
      setLoading(false);
    },
    signUp: async (name, email, password, phone = "") => {
      await signup(name, email, password, phone);
    },
    loginGoogle: async () => {
      throw new Error("GOOGLE_LOGIN_UNAVAILABLE");
    },
    logout: async () => {
      await signOut(auth);
      router.replace("/");
    },
    updateProfile: async (changes) => {
      if (!user) throw new Error("NOT_AUTHENTICATED");
      const firestoreChanges = {
        ...changes,
        ...(changes.displayName !== undefined ? { nome: changes.displayName } : {}),
        ...(changes.phone !== undefined ? { telefone: changes.phone } : {}),
        ...(changes.birthDate !== undefined ? { dataNascimento: changes.birthDate } : {})
      };
      if (changes.displayName !== undefined && auth.currentUser) {
        await updateFirebaseProfile(auth.currentUser, { displayName: changes.displayName });
      }
      await update(ref(database, `users/${user.uid}`), firestoreChanges);
      setUser({ ...user, ...changes });
    },
    changePassword: async (_currentPassword, newPassword) => {
      if (!auth.currentUser) throw new Error("NOT_AUTHENTICATED");
      if (newPassword.length < 6) throw new Error("WEAK_PASSWORD");
      await updatePassword(auth.currentUser, newPassword);
    },
    toggleFavorite: async (item) => {
      if (!user) throw new Error("NOT_AUTHENTICATED");
      const favorites = user.favorites.some((favorite) => favorite.id === item.id && favorite.type === item.type)
        ? user.favorites.filter((favorite) => !(favorite.id === item.id && favorite.type === item.type))
        : [...user.favorites, item];
      await update(ref(database, `users/${user.uid}`), { favorites });
      setUser({ ...user, favorites });
    }
  }), [loading, role, router, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
