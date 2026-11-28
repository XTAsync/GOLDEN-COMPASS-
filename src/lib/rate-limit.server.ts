// In-memory limiter: per isolate only. Used as the fallback when the shared limiter is unreachable.
const hits = new Map<string, { count: number; resetAt: number }>();
export function rateLimit(key: string, maxRequests = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

type RpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: unknown }>;
};

/**
 * Shared (database-backed) fixed-window limiter, via rate_limit_hit(). Returns true when allowed.
 * If the database call fails it falls back to the per-isolate limiter instead of blocking everyone;
 * the money endpoints need the same database anyway, so a hard outage fails there regardless.
 */
export async function rateLimitDurable(
  key: string,
  maxRequests = 10,
  windowMs = 60_000,
  client?: RpcClient,
): Promise<boolean> {
  try {
    const c =
      client ??
      ((await import("@/integrations/supabase/client.server"))
        .supabaseAdmin as unknown as RpcClient);
    const { data, error } = await c.rpc("rate_limit_hit", {
      p_key: key,
      p_max: maxRequests,
      p_window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
    });
    if (error || typeof data !== "boolean")
      throw error ?? new Error("unexpected rate_limit_hit result");
    return data;
  } catch (err) {
    console.error("rate limiter fell back to in-memory:", err instanceof Error ? err.message : err);
    return rateLimit(key, maxRequests, windowMs);
  }
}

/** Best-effort client IP behind Cloudflare / Vercel; "unknown" when no proxy header is present. */
export function clientIp(request: Request): string {
  const h = request.headers;
  const ip =
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (ip || "unknown").slice(0, 64);
}
