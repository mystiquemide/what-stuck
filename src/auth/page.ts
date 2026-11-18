import "server-only";
import { redirect } from "next/navigation";
import type { Viewer } from "./access";
import { getCurrentUser, getViewer } from "./session";

/** For pastor pages: the viewer, or a redirect to sign-in or church setup. */
export async function requirePastorPage(): Promise<Viewer> {
  const viewer = await getViewer();
  if (viewer) return viewer;
  if (await getCurrentUser()) redirect("/app/welcome");
  redirect("/login");
}
