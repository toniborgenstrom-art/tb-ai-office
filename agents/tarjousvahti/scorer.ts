export type Opportunity = { title: string; description: string; region: string; source: string };
export type Score = { fit: number; classification: string; estimate: string; recommendation: "Tee tarjous" | "Selvitä lisää" | "Ei sovellu"; reasons: string[] };

const serviceTerms = ["lvi-valvonta", "kvv-työnjohtaja", "iv-työnjohtaja", "rakennuttajakonsultti", "talotekniikka", "valvoja", "kuntotutkimus", "sisäilma", "korjaussuunnittelu"];
const regions = ["uusimaa", "kanta-häme", "päijät-häme", "pirkanmaa"];

function comparable(value: string) {
  return value.toLocaleLowerCase("fi-FI").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

export function scoreOpportunity(item: Opportunity): Score {
  const text = comparable(`${item.title} ${item.description}`);
  const matchedTerms = serviceTerms.filter((term) => text.includes(comparable(term)));
  const validRegion = regions.includes(comparable(item.region));
  const isRenovation = text.includes("linjasaneeraus") || text.includes("korjaus");
  const fit = Math.min(98, matchedTerms.length * 24 + (validRegion ? 24 : 0) + (isRenovation ? 8 : 0));

  return {
    fit,
    classification: matchedTerms[0] ?? "ei palveluosumaa",
    estimate: text.includes("linjasaneeraus") ? "35–45 h" : "Arvioitava asiakirjoista",
    recommendation: fit >= 70 ? "Tee tarjous" : fit >= 45 ? "Selvitä lisää" : "Ei sovellu",
    reasons: [matchedTerms.length ? `Palveluosuma: ${matchedTerms.join(", ")}` : "Ei palveluosumaa", validRegion ? `Toiminta-alue: ${item.region}` : `Alue vaatii harkinnan: ${item.region}`]
  };
}
