import { getApps, initializeApp, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAZzUQ0JkrmeXCUNIIvgURXYIWyP9aFf70",
  authDomain: "barbeariapongo2026.firebaseapp.com",
  projectId: "barbeariapongo2026",
  storageBucket: "barbeariapongo2026.firebasestorage.app",
  messagingSenderId: "3330587387",
  appId: "1:3330587387:web:01fee4db01da2f8650ce5e",
  databaseURL: "https://barbeariapongo2026-default-rtdb.firebaseio.com"
};

// Inicializa o Firebase prevenindo múltiplas instâncias no Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firebaseApp = app;
export const auth = getAuth(app);
export const db = getFirestore(app);
export const database = getDatabase(app);

export type UserRole = "cliente" | "admin";
