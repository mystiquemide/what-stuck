import Link from "next/link";
import { pillPrimary, pillSecondary, StatusPage } from "@/components/status-page";

export default function NotFound() {
  return (
    <StatusPage
      eyebrow="Page not found"
      heading="This page has wandered off."
      verse={{
        text: "For the Son of Man came to seek and to save the lost.",
        reference: "Luke 19:10",
      }}
      spanish="¿Escaneaste un código en la iglesia? Revisa el enlace en la pantalla e inténtalo de nuevo."
      actions={
        <>
          <Link href="/" className={pillPrimary}>
            Go to the home page
          </Link>
          <Link href="/demo" className={pillSecondary}>
            Open the demo church
          </Link>
        </>
      }
    >
      <p>We looked, but there&apos;s nothing here.</p>
      <p>If you scanned a code at church, check the link on the screen and try again.</p>
    </StatusPage>
  );
}
