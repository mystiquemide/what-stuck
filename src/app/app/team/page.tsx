import type { Metadata } from "next";
import { requirePastorPage } from "@/auth/page";
import { getChurchName } from "@/churches/queries";
import { AppHeader } from "@/components/app-header";
import { BackLink } from "@/components/back-link";
import { Card, Heading, Page } from "@/components/ui";
import { getDb } from "@/db";
import { listTeam } from "@/team/service";
import { TeamManager } from "./team-manager";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const viewer = await requirePastorPage();
  const db = getDb();
  const [churchName, team] = await Promise.all([
    getChurchName(db, viewer.churchId),
    listTeam(db, viewer),
  ]);
  const isOwner = viewer.kind === "staff" && viewer.role === "owner";

  return (
    <>
      <AppHeader viewer={viewer} churchName={churchName} />
      <Page wide className="pt-6">
        <BackLink href="/app">Your sermons</BackLink>
        <Heading className="mt-4">Your team</Heading>
        <p className="text-ink-muted mt-3 text-lg">
          Add deacons, elders or your care team. They can read each Monday&apos;s report and follow
          up on replies that may need care.
        </p>

        {viewer.kind === "demo" ? (
          <Card className="mt-8">
            <p className="text-lg font-semibold">This is where you&apos;d add your team.</p>
            <p className="text-ink-muted mt-1 text-base">
              In your own church, add someone by email. They sign in with that address and see the
              same reports you do. Only the pastor who set up the church can add or remove people.
            </p>
          </Card>
        ) : (
          <TeamManager
            isOwner={isOwner}
            currentUserId={viewer.user.id}
            initialTeam={team.map((m) => ({ ...m, joinedAt: m.joinedAt.toISOString() }))}
          />
        )}
      </Page>
    </>
  );
}
