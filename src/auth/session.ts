import "server-only";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { getEnv } from "@/lib/env";
import { demoViewer, staffViewer, type Viewer } from "./access";
import { deleteSession, findSessionUser } from "./magic-link";

const SESSION_COOKIE = "ws_session";
const DEMO_COOKIE = "ws_demo";

function cookieOptions(expires?: Date) {
  return {
    httpOnly: true,
    secure: getEnv().NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(expires ? { expires } : {}),
  };
}

export async function setSessionCookie(token: string, expires: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieOptions(expires));
  jar.delete(DEMO_COOKIE);
}

export async function startDemo() {
  const jar = await cookies();
  jar.set(DEMO_COOKIE, "1", cookieOptions(new Date(Date.now() + 7 * 24 * 60 * 60_000)));
}

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(getDb(), token);
  jar.delete(SESSION_COOKIE);
  jar.delete(DEMO_COOKIE);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? findSessionUser(getDb(), token) : null;
}

/**
 * The viewer for this request. A real session wins over the demo cookie.
 * Returns null when nobody is signed in and the demo isn't open.
 */
export async function getViewer(): Promise<Viewer | null> {
  const user = await getCurrentUser();
  if (user) return staffViewer(getDb(), user);
  if ((await cookies()).get(DEMO_COOKIE)?.value === "1") return demoViewer(getDb());
  return null;
}
