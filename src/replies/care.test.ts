import { describe, expect, it } from "vitest";
import { needsCare } from "./care";

describe("needsCare", () => {
  it.each([
    "Honestly I don't see the point of anything anymore. I'm tired of trying.",
    "I've been thinking about ending my life",
    "sometimes i want to die",
    "I don't want to wake up tomorrow",
    "I've been hurting myself again",
    "everyone would be better off without me",
    "No quiero vivir así",
    "my husband hits me when he drinks",
    "I think I'm being abused",
    "pienso en quitarme la vida",
  ])("flags: %s", (text) => {
    expect(needsCare(text)).toBe(true);
  });

  it.each([
    "God isn't finished with me yet.",
    "Paul was ready to die for Christ, that hit me",
    "The coffee was really good today",
    "Contentment is learned.",
    "Dios no ha terminado conmigo.",
  ])("leaves alone: %s", (text) => {
    expect(needsCare(text)).toBe(false);
  });

  it("checks the question field too", () => {
    expect(needsCare("Good sermon", "How do I keep going when I can't go on?")).toBe(true);
  });
});
