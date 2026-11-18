import { ButtonLink, Eyebrow, Heading, Page } from "@/components/ui";

export default function NotFound() {
  return (
    <Page>
      <Eyebrow>What Stuck</Eyebrow>
      <Heading className="mt-5">We couldn&apos;t find that page.</Heading>
      <p className="text-ink-muted mt-4 text-lg">
        If you scanned a code at church, check the link on the screen and try again.
      </p>
      <ButtonLink href="/" variant="secondary" full className="mt-8">
        Go to the home page
      </ButtonLink>
    </Page>
  );
}
