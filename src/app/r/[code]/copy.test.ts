import { describe, expect, it } from "vitest";
import { REPLY_COPY, translateServerMessage } from "./copy";

describe("reply page copy", () => {
  it("has every English string in Spanish too", () => {
    expect(Object.keys(REPLY_COPY.es).sort()).toEqual(Object.keys(REPLY_COPY.en).sort());
  });

  it("translates server messages for Spanish speakers", () => {
    expect(translateServerMessage("Keep it under 500 characters.", "es")).toBe(
      "Escríbelo en menos de 500 caracteres.",
    );
    expect(translateServerMessage("Enter an email address like name@example.com.", "es")).toBe(
      "Escribe un correo como nombre@ejemplo.com.",
    );
    expect(translateServerMessage("Something unexpected", "es")).toBe(
      "Algo salió mal. Inténtalo de nuevo.",
    );
    expect(translateServerMessage("Keep it under 500 characters.", "en")).toBe(
      "Keep it under 500 characters.",
    );
  });
});
