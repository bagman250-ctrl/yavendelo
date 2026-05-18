export type MarketplaceCategory = {
  label: string;
  slug: string;
  icon: string;
};

export const marketplaceCategories: MarketplaceCategory[] = [
  { label: "Tecnología", slug: "tecnologia", icon: "💻" },
  { label: "Celulares", slug: "celulares", icon: "📱" },
  { label: "Computadoras", slug: "computadoras", icon: "🖥️" },
  { label: "Gaming", slug: "gaming", icon: "🎮" },
  { label: "Autos", slug: "autos", icon: "🚗" },
  { label: "Motos", slug: "motos", icon: "🏍️" },
  { label: "Moda", slug: "moda", icon: "👕" },
  { label: "Hogar", slug: "hogar", icon: "🛋️" },
  { label: "Casa", slug: "casa", icon: "🏠" },
  { label: "Deportes", slug: "deportes", icon: "⚽" },
  { label: "Música", slug: "musica", icon: "🎵" },
  { label: "Mascotas", slug: "mascotas", icon: "🐾" },
  { label: "Servicios", slug: "servicios", icon: "🛠️" },
  { label: "Otros", slug: "otros", icon: "✨" },
];

export const categoryLabels = marketplaceCategories.map((category) => category.label);

export const quickMarketplaceCategories = marketplaceCategories.filter((category) =>
  ["tecnologia", "gaming", "autos", "moda", "hogar", "casa", "servicios"].includes(category.slug)
);

function normalizeCategory(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getCategoryBySlugOrLabel(value: string) {
  const normalized = normalizeCategory(decodeURIComponent(value || ""));

  return marketplaceCategories.find(
    (category) => category.slug === normalized || normalizeCategory(category.label) === normalized
  );
}

export function getCategoryHref(value: string) {
  const category = getCategoryBySlugOrLabel(value);

  return `/categoria/${category?.slug || encodeURIComponent(value)}`;
}
