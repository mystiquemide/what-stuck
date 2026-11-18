/** Languages the member side speaks. The pastor side is English. */
export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

/** Pick the member's language from the browser's Accept-Language header. English unless Spanish comes first. */
export function pickLocale(acceptLanguage: string | null | undefined): Locale {
  const ranked = (acceptLanguage ?? "")
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().toLowerCase().split(";");
      const q = Number(params.find((p) => p.trim().startsWith("q="))?.split("=")[1] ?? 1);
      return { lang: tag.split("-")[0] ?? "", q: Number.isFinite(q) ? q : 0, index };
    })
    .filter((x) => x.lang && x.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const { lang } of ranked) {
    if (lang === "es") return "es";
    if (lang === "en") return "en";
  }
  return "en";
}
