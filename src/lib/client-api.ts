/** Small fetch wrapper for client components. Never throws; returns a friendly error. */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; fields?: Array<{ path: string; message: string }> };

export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      method: options.method ?? (options.body === undefined ? "GET" : "POST"),
      headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (response.ok) return { ok: true, data: data as T };
    return {
      ok: false,
      status: response.status,
      error: data?.error ?? "Something went wrong. Please try again.",
      fields: data?.fields,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      error: "You seem to be offline. Check your connection and try again.",
    };
  }
}

export function fieldError(result: ApiResult<unknown>, path: string) {
  return result.ok ? undefined : result.fields?.find((f) => f.path === path)?.message;
}
