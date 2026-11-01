import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" };

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const styles = variant === "primary" ? "bg-gold text-stone-900" : "border border-stone-300 text-stone-800";
  return <button className={`rounded-xl px-4 py-3 font-bold transition-all duration-300 ease-in-out hover:scale-[1.02] hover:brightness-110 hover:shadow-lg hover:shadow-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`} {...props} />;
}
