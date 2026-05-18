export type BoostPlanId = "7days" | "30days";

export type BoostPlan = {
  id: BoostPlanId;
  label: string;
  badge: string;
  price: number;
  days: number;
  text: string;
  features: string[];
};

export const BOOST_PLANS: BoostPlan[] = [
  {
    id: "7days",
    label: "7 d\u00edas",
    badge: "Popular",
    price: 49,
    days: 7,
    text: "Ideal para mover un producto con urgencia y probar visibilidad premium.",
    features: [
      "Prioridad en portada",
      "Badge premium",
      "Aparici\u00f3n en destacados",
      "Duraci\u00f3n de 7 d\u00edas",
    ],
  },
  {
    id: "30days",
    label: "30 d\u00edas",
    badge: "Mejor valor",
    price: 149,
    days: 30,
    text: "M\u00e1s exposici\u00f3n durante m\u00e1s tiempo para productos de mayor valor.",
    features: [
      "Prioridad extendida",
      "Badge premium",
      "Aparici\u00f3n en destacados",
      "Duraci\u00f3n de 30 d\u00edas",
    ],
  },
];

export function getBoostPlan(plan?: string | null) {
  return BOOST_PLANS.find((item) => item.id === plan);
}

export function getBoostDays(plan?: string | null) {
  return getBoostPlan(plan)?.days || 7;
}
