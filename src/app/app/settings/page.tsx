import type { Metadata } from "next";
import { requirePastorPage } from "@/auth/page";
import { getChurchSettings } from "@/churches/settings";
import { AppHeader } from "@/components/app-header";
import { BackLink } from "@/components/back-link";
import { Card, Heading, Page } from "@/components/ui";
import { getDb } from "@/db";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Church settings" };

export default async function SettingsPage() {
  const viewer = await requirePastorPage();
  const settings = await getChurchSettings(getDb(), viewer);
  const canEdit = viewer.kind === "staff" && viewer.role === "owner";

  return (
    <>
      <AppHeader viewer={viewer} churchName={settings.name} />
      <Page wide className="pt-6">
        <BackLink href="/app">Your sermons</BackLink>
        <Heading className="mt-4">Church settings</Heading>
        <p className="text-ink-muted mt-3 text-lg">
          What members see after they reply, and where they go for their next step. Use the forms
          your church already has, such as MinistryForms, Genesis ChMS or an In The Bulletin connect
          card.
        </p>
        {!canEdit && (
          <Card className="mt-6" tone="amber">
            <p className="text-base">
              {viewer.kind === "demo"
                ? "This is the demo church, so settings are read-only. In your own church you can change them here."
                : "Only the pastor who set up the church can change these."}
            </p>
          </Card>
        )}
        <SettingsForm initial={settings} canEdit={canEdit} />
      </Page>
    </>
  );
}
