import { describe, expect, it, vi } from "vitest";
import { getPassage, type PassageFetcher } from "./passage";

const fake = (text: string): PassageFetcher =>
  vi.fn(async (passageId: string) => ({
    reference: `ref:${passageId}`,
    text,
    attribution: {
      text: "Berean Standard Bible",
      urls: ["https://berean.bible/", "https://berean.bible/"],
    },
  }));

describe("getPassage", () => {
  it("turns a human reference into a passage with attribution and a read link", async () => {
    const fetcher = fake("I thank my God every time I remember you.");
    const passage = await getPassage("Philippians 1:3", fetcher);
    expect(fetcher).toHaveBeenCalledWith("PHP.1.3");
    expect(passage).toEqual({
      reference: "ref:PHP.1.3",
      text: "I thank my God every time I remember you.",
      attribution: "Berean Standard Bible",
      attributionUrls: ["https://berean.bible/"],
      readUrl: "https://route.bible/PHP.1.3",
    });
  });

  it("links instead of pasting very long passages", async () => {
    const passage = await getPassage("Psalm 119:1-80", fake("x".repeat(5000)));
    expect(passage?.text).toBeNull();
    expect(passage?.readUrl).toBe("https://route.bible/PSA.119.1-80");
  });

  it("returns nothing for references it can't read", async () => {
    const fetcher = fake("x");
    expect(await getPassage("the bit about the vine", fetcher)).toBeNull();
    expect(await getPassage(null, fetcher)).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns nothing, without throwing, when the lookup fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const failing: PassageFetcher = async () => {
      throw new Error("network down");
    };
    expect(await getPassage("Romans 8:28", failing)).toBeNull();
    warn.mockRestore();
  });

  it("caches lookups", async () => {
    const fetcher = fake("And we know that God works all things together for good.");
    await getPassage("Romans 8:28-29", fetcher);
    await getPassage("Romans 8:28-29", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
