import { describe, expect, it } from "vitest";
import { generatePublicCode, PUBLIC_CODE_PATTERN } from "./codes";

describe("generatePublicCode", () => {
  it("makes 8-character codes from the readable alphabet", () => {
    for (let i = 0; i < 200; i++) expect(generatePublicCode()).toMatch(PUBLIC_CODE_PATTERN);
  });

  it("doesn't repeat in practice", () => {
    const codes = new Set(Array.from({ length: 5000 }, () => generatePublicCode()));
    expect(codes.size).toBe(5000);
  });
});
