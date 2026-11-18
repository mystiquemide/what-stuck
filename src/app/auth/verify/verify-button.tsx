"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ErrorText } from "@/components/ui";
import { api } from "@/lib/client-api";

export function VerifyButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function signIn() {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) return setError("This link is missing its code. Ask for a new one.");
    setBusy(true);
    const result = await api<{ next: string }>("/api/auth/verify", { body: { token } });
    if (result.ok) return router.replace(result.data.next);
    setBusy(false);
    setError(result.error);
  }

  return (
    <div className="mt-8">
      <Button full onClick={signIn} disabled={busy}>
        {busy ? "Signing in" : "Sign in to What Stuck"}
      </Button>
      {error && (
        <>
          <ErrorText>{error}</ErrorText>
          <a
            href="/login"
            className="text-clay mt-4 inline-block font-medium underline underline-offset-4"
          >
            Get a new link
          </a>
        </>
      )}
    </div>
  );
}
