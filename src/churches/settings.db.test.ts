import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createLoginToken, redeemLoginToken } from "@/auth/magic-link";
import { staffViewer } from "@/auth/access";
import { HttpError } from "@/lib/http";
import { addTeamMember } from "@/team/service";
import { hasTestDb, makeStaff, testDb } from "../../test/db";
import { churchSettingsSchema, getChurchSettings, updateChurchSettings } from "./settings";

const input = churchSettingsSchema.parse({
  name: "Grace Fellowship",
  careContact: "Care line: (555) 010-0000",
  careFormUrl: "https://grace.ministryforms.com/prayer",
  connectFormUrl: "https://grace.inthebulletin.com",
});

describe("church settings rules", () => {
  it("accepts empty links as not set", () => {
    const parsed = churchSettingsSchema.parse({ name: "Grace", careFormUrl: "  " });
    expect(parsed.careFormUrl).toBeNull();
    expect(parsed.connectFormUrl).toBeNull();
  });

  it.each(["http://example.com/form", "javascript:alert(1)", "example.com/form"])(
    "rejects %s",
    (link) => {
      expect(churchSettingsSchema.safeParse({ name: "Grace", careFormUrl: link }).success).toBe(
        false,
      );
    },
  );
});

describe.skipIf(!hasTestDb)("church settings", () => {
  const db = hasTestDb ? testDb() : (undefined as never);
  afterAll(async () => {
    await db.$client.end();
  });

  it("lets the pastor save links that members then see", async () => {
    const pastor = await makeStaff(db);
    await updateChurchSettings(db, pastor.viewer, input);
    expect(await getChurchSettings(db, pastor.viewer)).toEqual(input);
  });

  it("doesn't let a team member or a stranger change them", async () => {
    const pastor = await makeStaff(db);
    const email = `d-${randomUUID()}@example.com`;
    await addTeamMember(db, pastor.viewer, email);
    const signedIn = await redeemLoginToken(db, await createLoginToken(db, email));
    const deacon = await staffViewer(db, signedIn!.user);

    await expect(updateChurchSettings(db, deacon, input)).rejects.toBeInstanceOf(HttpError);
    await expect(updateChurchSettings(db, null, input)).rejects.toBeInstanceOf(HttpError);
  });
});
