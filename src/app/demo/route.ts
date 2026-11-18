import { redirect } from "next/navigation";
import { startDemo } from "@/auth/session";

/** Opens the read-only demo church. No account needed. */
export async function GET() {
  await startDemo();
  redirect("/app");
}
