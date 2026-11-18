import { describe, expect, it } from "vitest";
import { isValidTimeZone } from "./timezone";

describe("isValidTimeZone", () => {
  it.each(["UTC", "America/Chicago", "Africa/Lagos", "Europe/London"])("accepts %s", (tz) => {
    expect(isValidTimeZone(tz)).toBe(true);
  });
  it.each(["Mars/Olympus", "", "not a zone"])("rejects %s", (tz) => {
    expect(isValidTimeZone(tz)).toBe(false);
  });
});
