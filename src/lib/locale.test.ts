import { describe, expect, it } from "vitest";
import { pickLocale } from "./locale";

describe("pickLocale", () => {
  it.each([
    ["es-MX,es;q=0.9,en;q=0.8", "es"],
    ["es", "es"],
    ["en-US,en;q=0.9,es;q=0.8", "en"],
    ["fr-FR,es;q=0.5", "es"],
    ["en;q=0.4,es;q=0.6", "es"],
    ["de-DE", "en"],
    ["", "en"],
    [null, "en"],
  ])("%s -> %s", (header, locale) => {
    expect(pickLocale(header)).toBe(locale);
  });
});
