export type Opportunity = { title: string; description: string; region: string; source: string };
export type Score = { fit: number; classification: string; estimate: string; recommendation: "Tee tarjous" | "Selvitä lisää" | "Ei sovellu"; reasons: string[] };

const serviceTerms = ["lvi-valvonta", "kvv-työnjohtaja", "iv-työnjohtaja", "rakennuttajakonsultti", "talotekniikka", "valvoja", "kuntotutkimus", "sisäilma", "korjaussuunnittelu"];
const regions = ["uusimaa", "kanta-häme", "päijät-häme", "pirkanmaa"];

export function scoreOpportunity(item: Opportunity): Score {
  const text = `${item.title} ${item.description}`.toLowerCase();
  const matchedTerms = serviceTerms.filter(term => text.includes(term));
  const validRegion = regions.includes(item.region.toLowerCase());
  const fit = Math.min(98, (matchedTerms.length * 22) + (validRegion ? 20 : 0) + (text.includes("linjasaneeraus") ? 12 : 0));
  return { fit, classification: matchedTerms[0] ?? "ei sovellu", estimate: text.includes("linjasaneeraus") ? "35–45 h" : "Arvioitava asiakirjoista", recommendation: fit >= 70 ? "Tee tarjous" : fit >= 45 ? "Selvitä lisää" : "Ei sovellu", reasons: [matchedTerms.length ? `Palveluosuma: ${matchedTerms.join(", ")}` : "Ei palveluosumaa", validRegion ? `Toiminta-alue: ${item.region}` : `Alue vaatii harkinnan: ${item.region}`] };
}
