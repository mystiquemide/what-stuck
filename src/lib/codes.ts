import { randomInt } from "node:crypto";

// No 0/o, 1/l/i: easy to read aloud or type from a screen.
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

/** Short, unguessable code for a sermon's public reply link (31^8, about 8.5e11 options). */
export function generatePublicCode(length = 8): string {
  let code = "";
  for (let i = 0; i < length; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

export const PUBLIC_CODE_PATTERN = new RegExp(`^[${ALPHABET}]{8}$`);
