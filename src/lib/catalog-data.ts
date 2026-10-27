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
