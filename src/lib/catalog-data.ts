export type Product = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  category: string;
  imageUrls: string[];
  images?: string[];
  image?: string;
  fotos?: string[];
  emDestaque: boolean;
};

export const PRODUCT_CATEGORIES = ["Pomadas", "Shampoos", "Acessórios", "Outros"] as const;

export type Pet = {
  id: string;
  name: string;
  species: "Cachorro" | "Gato" | "Aves" | "Outros" | string;
  breed: string;
  age: string;
  size: "Pequeno" | "Médio" | "Grande" | string;
  sex: "Fêmea" | "Macho" | string;
  coat: string;
  vaccinated: "Sim" | "Não" | string;
  neutered: "Sim" | "Não" | string;
  dewormed: "Sim" | "Não" | string;
  temperament: string;
  description: string;
  imageUrls: string[];
  images?: string[];
  image?: string;
  emDestaque: boolean;
};

export type PortfolioItem = {
  id: string;
  name: string;
  description: string;
  serviceId: string;
  suggestedPriceCents: number;
  imageUrls: string[];
  fotos?: string[];
  emDestaque: boolean;
};

export function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(priceCents / 100);
}
