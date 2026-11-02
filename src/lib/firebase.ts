import { getApps, initializeApp, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const DEFAULT_DATABASE_URL = "https://petcare-bf251-default-rtdb.firebaseio.com";
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAmPv2hpnI0OHUUza63I_4xG36Dd93PZIM",
  authDomain: "petcare-bf251.firebaseapp.com",
  projectId: "petcare-bf251",
  storageBucket: "petcare-bf251.firebasestorage.app",
  messagingSenderId: "1074160137030",
  appId: "1:1074160137030:web:a283dc4b51d6acfb31ab47"
};

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
  apiKey: environmentValue(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) ?? DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: environmentValue(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) ?? DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: environmentValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) ?? DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: environmentValue(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) ?? DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: environmentValue(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) ?? DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: environmentValue(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) ?? DEFAULT_FIREBASE_CONFIG.appId,
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
