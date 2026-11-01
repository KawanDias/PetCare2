import { getApps, initializeApp, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const DEFAULT_DATABASE_URL = "https://petcare-bf251-default-rtdb.firebaseio.com";

function environmentValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized?.replace(/^['"]|['"]$/g, "").trim() || undefined;
}

function databaseUrlValue(value: string | undefined) {
  const candidate = environmentValue(value);
  if (!candidate) return DEFAULT_DATABASE_URL;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" && Boolean(url.hostname) ? candidate.replace(/\/$/, "") : DEFAULT_DATABASE_URL;
  } catch {
    return DEFAULT_DATABASE_URL;
  }
}

const firebaseConfig = {
  apiKey: environmentValue(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: environmentValue(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: environmentValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: environmentValue(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: environmentValue(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: environmentValue(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  databaseURL: databaseUrlValue(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL)
};

const missingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingConfig.length) {
  throw new Error(`Configuração do Firebase incompleta. Variáveis ausentes: ${missingConfig.join(", ")}`);
}

// Inicializa o Firebase prevenindo múltiplas instâncias no Next.js
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseApp = app;
export const auth = getAuth(app);
export const db = getFirestore(app);
export const database = getDatabase(app);

export type UserRole = "cliente" | "admin";
