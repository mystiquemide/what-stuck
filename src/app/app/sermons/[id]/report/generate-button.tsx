"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ErrorText } from "@/components/ui";
import { api } from "@/lib/client-api";

export function GenerateButton({
  sermonId,
  label,
  variant = "primary",
}: {
  sermonId: string;
  label: string;
  variant?: "primary" | "secondary" | "quiet";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function run() {
    setBusy(true);
    setError(undefined);
    const result = await api<{ status: string; reason?: string }>(
      `/api/sermons/${sermonId}/report`,
      {
        method: "POST",
      },
    );
    setBusy(false);
    if (!result.ok) return setError(result.error);
    if (result.data.status === "failed") setError(result.data.reason);
    router.refresh();
  }

  return (
    <div className="no-print mt-4">
      <Button variant={variant} full={variant !== "quiet"} onClick={run} disabled={busy}>
        {busy ? "Reading every reply" : label}
      </Button>
      {busy && (
        <p className="text-ink-subtle mt-2 text-sm" role="status">
          This takes about 20 seconds.
        </p>
      )}
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
