export function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

export function formatCurrencyFull(n: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPct(n: number | null): string {
  if (n === null) return "—";
  return `${Math.round(n * 100)}%`;
}

export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function daysSince(d: string): number {
  return Math.floor((Date.now() - new Date(d).getTime()) / (24 * 60 * 60 * 1000));
}

const AVATAR_COLORS = [
  "#4F46E5", "#0891B2", "#7C3AED", "#059669",
  "#D97706", "#DC2626", "#2563EB", "#9333EA",
  "#0D9488", "#C026D3",
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const LIFECYCLE_BADGES: Record<string, string> = {
  ENROLADO: "badge-blue",
  ACTIVO: "badge-green",
  RECURRENTE: "badge-violet",
};
