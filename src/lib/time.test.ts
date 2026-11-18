import { describe, expect, it } from "vitest";
import { localDate, noteSendTime, zonedTime } from "./time";

describe("zonedTime", () => {
  it("handles standard time", () => {
    expect(zonedTime({ year: 2026, month: 11, day: 18 }, 9, "America/Chicago").toISOString()).toBe(
      "2026-11-18T15:00:00.000Z",
    );
  });

  it("handles daylight time", () => {
    expect(zonedTime({ year: 2026, month: 7, day: 1 }, 9, "America/Chicago").toISOString()).toBe(
      "2026-07-01T14:00:00.000Z",
    );
  });

  it("handles zones ahead of UTC", () => {
    expect(zonedTime({ year: 2026, month: 11, day: 18 }, 9, "Africa/Lagos").toISOString()).toBe(
      "2026-11-18T08:00:00.000Z",
    );
  });

  it("handles the day clocks change", () => {
    // US clocks fell back at 2 AM on Nov 1, 2026. 9 AM that day is standard time.
    expect(zonedTime({ year: 2026, month: 11, day: 1 }, 9, "America/New_York").toISOString()).toBe(
      "2026-11-01T14:00:00.000Z",
    );
  });
});

describe("noteSendTime", () => {
  const sunday = "2026-11-15";
  const tz = "America/Chicago";

  it("sends at 9 AM local on the Wednesday after the sermon", () => {
    const at = noteSendTime(sunday, tz, new Date("2026-11-15T18:00:00Z"));
    expect(at?.toISOString()).toBe("2026-11-18T15:00:00.000Z");
    expect(localDate(at!, tz)).toBe("2026-11-18");
  });

  it("works for sermons not preached on Sunday", () => {
    // Saturday evening service: the very next Wednesday.
    expect(noteSendTime("2026-11-14", tz, new Date("2026-11-14T23:00:00Z"))?.toISOString()).toBe(
      "2026-11-18T15:00:00.000Z",
    );
    // A Wednesday night service waits for the following Wednesday.
    expect(noteSendTime("2026-11-18", tz, new Date("2026-11-19T02:00:00Z"))?.toISOString()).toBe(
      "2026-11-25T15:00:00.000Z",
    );
  });

  it("sends late replies the next morning", () => {
    const thursday = new Date("2026-11-19T20:00:00Z");
    expect(noteSendTime(sunday, tz, thursday)?.toISOString()).toBe("2026-11-20T15:00:00.000Z");
  });

  it("skips the note once the week is over", () => {
    expect(noteSendTime(sunday, tz, new Date("2026-11-23T20:00:00Z"))).toBeNull();
  });
});
