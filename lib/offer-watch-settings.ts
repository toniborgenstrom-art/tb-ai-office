export const DEFAULT_SERVICE_KEYWORDS = [
  "LVI-valvonta", "KVV-työnjohtaja", "IV-työnjohtaja", "rakennuttajakonsultti",
  "talotekniikka", "valvoja", "kuntotutkimus", "sisäilma", "korjaussuunnittelu",
] as const;

export const DEFAULT_REGIONS = ["Uusimaa", "Kanta-Häme", "Päijät-Häme", "Pirkanmaa"] as const;

export type OfferWatchSettings = {
  serviceKeywords: string[];
  regions: string[];
  minFitScore: number;
  notificationEmail: string;
  emailNotificationsEnabled: boolean;
};

export const defaultOfferWatchSettings: OfferWatchSettings = {
  serviceKeywords: [...DEFAULT_SERVICE_KEYWORDS], regions: [...DEFAULT_REGIONS], minFitScore: 55,
  notificationEmail: "", emailNotificationsEnabled: false,
};

function strings(value: unknown, fallback: readonly string[]) {
  if (!Array.isArray(value)) return [...fallback];
  const values = value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
  return values.length ? values : [...fallback];
}

export function toOfferWatchSettings(row: Record<string, unknown> | null | undefined): OfferWatchSettings {
  if (!row) return { ...defaultOfferWatchSettings, serviceKeywords: [...defaultOfferWatchSettings.serviceKeywords], regions: [...defaultOfferWatchSettings.regions] };
  const score = typeof row.min_fit_score === "number" ? row.min_fit_score : Number(row.min_fit_score);
  return {
    serviceKeywords: strings(row.service_keywords, DEFAULT_SERVICE_KEYWORDS),
    regions: strings(row.regions, DEFAULT_REGIONS),
    minFitScore: Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : defaultOfferWatchSettings.minFitScore,
    notificationEmail: typeof row.notification_email === "string" ? row.notification_email : "",
    emailNotificationsEnabled: row.email_notifications_enabled === true,
  };
}
