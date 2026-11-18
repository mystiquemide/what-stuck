"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";

export function SignOutButton({ label = "Sign out" }: { label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-ink-muted hover:text-ink min-h-11 shrink-0 rounded-lg px-3 text-base font-medium"
      onClick={async () => {
        await api("/api/auth/logout", { method: "POST" });
        router.replace("/");
      }}
    >
      {label}
    </button>
  );
}
