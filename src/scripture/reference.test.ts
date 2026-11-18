import { describe, expect, it } from "vitest";
import { displayReference } from "./reference";

describe("displayReference", () => {
  it.each([
    ["john 3: 16", "John 3:16"],
    ["phil 3:12-14", "Philippians 3:12-14"],
    ["1 cor 13", "1 Corinthians 13"],
  ])("tidies %s", (input, output) => {
    expect(displayReference(input)).toBe(output);
  });

  it("leaves anything else as typed", () => {
    expect(displayReference("The Sermon on the Mount")).toBe("The Sermon on the Mount");
  });
});
