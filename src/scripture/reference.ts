import { parseToDisplayRef } from "grab-bcv";

/** "john 3: 16" becomes "John 3:16". Anything that isn't a Bible reference stays as typed. */
export function displayReference(ref: string): string {
  try {
    return parseToDisplayRef(ref);
  } catch {
    return ref;
  }
}
