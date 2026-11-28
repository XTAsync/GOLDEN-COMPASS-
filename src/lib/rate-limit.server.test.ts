import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIp, rateLimit, rateLimitDurable } from "./rate-limit.server";

afterEach(() => vi.restoreAllMocks());
const rpcOk = (allowed: boolean) => ({
  rpc: vi.fn().mockResolvedValue({ data: allowed, error: null }),
});

describe("rateLimitDurable", () => {
  it("uses the shared limiter and passes key, max and window seconds", async () => {
    const c = rpcOk(true);
    await expect(rateLimitDurable("withdraw:u1", 5, 60_000, c)).resolves.toBe(true);
    expect(c.rpc).toHaveBeenCalledWith("rate_limit_hit", {
      p_key: "withdraw:u1",
      p_max: 5,
      p_window_seconds: 60,
    });
  });

  it("refuses when the database says the key is over its limit", async () => {
    await expect(rateLimitDurable("k", 1, 1000, rpcOk(false))).resolves.toBe(false);
  });

  it("rounds sub-second windows up to one second", async () => {
    const c = rpcOk(true);
    await rateLimitDurable("k", 1, 250, c);
    expect(c.rpc.mock.calls[0][1]).toMatchObject({ p_window_seconds: 1 });
  });

  it("falls back to the in-memory limiter when the RPC errors, and still enforces the limit", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const bad = { rpc: vi.fn().mockResolvedValue({ data: null, error: new Error("db down") }) };
    const key = `fallback:${Math.random()}`;
    expect(await rateLimitDurable(key, 2, 60_000, bad)).toBe(true);
    expect(await rateLimitDurable(key, 2, 60_000, bad)).toBe(true);
    expect(await rateLimitDurable(key, 2, 60_000, bad)).toBe(false);
  });

  it("falls back when the RPC throws or returns a non-boolean", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const boom = { rpc: vi.fn().mockRejectedValue(new Error("network")) };
    expect(await rateLimitDurable(`b:${Math.random()}`, 1, 60_000, boom)).toBe(true);
    const odd = { rpc: vi.fn().mockResolvedValue({ data: "yes", error: null }) };
    expect(await rateLimitDurable(`o:${Math.random()}`, 1, 60_000, odd)).toBe(true);
  });
});

describe("rateLimit (in-memory)", () => {
  it("blocks after max requests in the window", () => {
    const k = `m:${Math.random()}`;
    expect([rateLimit(k, 2), rateLimit(k, 2), rateLimit(k, 2)]).toEqual([true, true, false]);
  });
});

describe("clientIp", () => {
  const r = (h: Record<string, string>) => new Request("https://x.test", { headers: h });
  it("prefers cf-connecting-ip, then x-real-ip, then the first x-forwarded-for", () => {
    expect(clientIp(r({ "cf-connecting-ip": "1.1.1.1", "x-real-ip": "2.2.2.2" }))).toBe("1.1.1.1");
    expect(clientIp(r({ "x-real-ip": "2.2.2.2" }))).toBe("2.2.2.2");
    expect(clientIp(r({ "x-forwarded-for": "3.3.3.3, 4.4.4.4" }))).toBe("3.3.3.3");
  });
  it("returns unknown without proxy headers", () => {
    expect(clientIp(r({}))).toBe("unknown");
  });
});
