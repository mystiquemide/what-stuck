import { describe, expect, it } from "vitest";
import { BSB_NOTICE } from "@/scripture/notice";
import { wednesdayNote } from "./wednesday-note";

const base = {
  to: "member@example.com",
  churchName: "Hope Street Church",
  sermonTitle: "Pressing On",
  takeaway: "Grace, not grit. <b>Really</b>",
  reflectionQuestion: "What are you ready to put down this week?",
  unsubscribeUrl: "https://example.com/api/unsubscribe/abc",
};

const passage = {
  reference: "Philippians 3:12-14",
  text: "Not that I have already obtained all this...",
  attribution: "Berean Standard Bible",
  attributionUrls: [],
  readUrl: "https://route.bible/PHP.3.12-14",
};

describe("wednesdayNote", () => {
  it("names the church and sermon at the top and in the subject", () => {
    const note = wednesdayNote({ ...base, passage });
    expect(note.subject).toBe("What stuck with you at Hope Street Church");
    expect(note.text.startsWith("Hope Street Church · Pressing On")).toBe(true);
    expect(note.html).toContain("Hope Street Church · Pressing On");
  });

  it("returns the member's words exactly, escaped in HTML", () => {
    const note = wednesdayNote({ ...base, passage });
    expect(note.text).toContain('"Grace, not grit. <b>Really</b>"');
    expect(note.html).toContain("Grace, not grit. &lt;b&gt;Really&lt;/b&gt;");
    expect(note.html).not.toContain("<b>Really</b>");
  });

  it("cites the BSB only when Scripture is included", () => {
    expect(wednesdayNote({ ...base, passage }).text).toContain(BSB_NOTICE);
    expect(wednesdayNote({ ...base, passage: null }).text).not.toContain(BSB_NOTICE);
  });

  it("offers one-click deletion of the email address", () => {
    const note = wednesdayNote({ ...base, passage: null });
    expect(note.headers?.["List-Unsubscribe"]).toBe(`<${base.unsubscribeUrl}>`);
    expect(note.html).toContain("Delete my email now");
  });

  it("speaks Spanish to a member who replied in Spanish", () => {
    const note = wednesdayNote({ ...base, passage, locale: "es" });
    expect(note.subject).toBe("Lo que te quedó en Hope Street Church");
    expect(note.text).toContain("El domingo dijiste:");
    expect(note.text).toContain("Reina-Valera 1909");
    expect(note.text).not.toContain(BSB_NOTICE);
    expect(note.html).toContain('lang="es"');
    // The pastor's question is never machine-translated.
    expect(note.text).toContain(base.reflectionQuestion);
  });
});
