/** Minutes that `timeZone` is ahead of UTC at the given instant (negative for the Americas). */
function offsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

/** The UTC instant for a wall-clock time in a time zone. Handles daylight saving changes. */
export function zonedTime(
  date: { year: number; month: number; day: number },
  hour: number,
  timeZone: string,
): Date {
  const wall = Date.UTC(date.year, date.month - 1, date.day, hour, 0, 0);
  let guess = wall - offsetMinutes(new Date(wall), timeZone) * 60_000;
  // A second pass corrects guesses that land on the other side of a DST switch.
  guess = wall - offsetMinutes(new Date(guess), timeZone) * 60_000;
  return new Date(guess);
}

function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** Today's date (YYYY-MM-DD) as seen in `timeZone`. */
export function localDate(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export const NOTE_HOUR = 9;
export const NOTE_WINDOW_DAYS = 7;

/**
 * When to send the Wednesday note for a sermon: 9 AM on the Wednesday after it,
 * in the church's time zone. A reply that comes in after that gets its note at
 * 9 AM the next morning. Past a week, the moment has passed and no note is sent.
 */
export function noteSendTime(preachedOn: string, timeZone: string, now = new Date()): Date | null {
  const weekday = new Date(`${preachedOn}T00:00:00Z`).getUTCDay();
  const daysToWednesday = (3 - weekday + 7) % 7 || 7;
  const wednesday = zonedTime(addDays(preachedOn, daysToWednesday), NOTE_HOUR, timeZone);
  if (wednesday > now) return wednesday;

  const tomorrow = zonedTime(addDays(localDate(now, timeZone), 1), NOTE_HOUR, timeZone);
  const cutoff = zonedTime(addDays(preachedOn, NOTE_WINDOW_DAYS + 1), 0, timeZone);
  return tomorrow < cutoff ? tomorrow : null;
}
