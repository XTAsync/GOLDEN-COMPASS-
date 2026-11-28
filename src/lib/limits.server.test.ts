import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  own: null as Record<string, unknown> | null,
  tier: null as Record<string, unknown> | null,
  rows: [] as Array<{ amount: unknown; status: string }>,
  sinceCalls: [] as string[],
}));

vi.mock("@/integrations/supabase/client.server", () => {
  const limitsChain = () => {
    let isTier = false;
    const c: Record<string, unknown> = {};
    c.select = () => c;
    c.eq = () => c;
    c.is = () => {
      isTier = true;
      return c;
    };
    c.maybeSingle = async () => ({ data: isTier ? state.tier : state.own });
    return c;
  };
  const txChain = () => {
    const c: Record<string, unknown> = {};
    c.select = () => c;
    c.eq = () => c;
    c.gte = async (_col: string, since: string) => {
      state.sinceCalls.push(since);
      return { data: state.rows };
    };
    return c;
  };
  return {
    supabaseAdmin: { from: (t: string) => (t === "transactions" ? txChain() : limitsChain()) },
  };
});

import { checkTransactionLimit, getLimitsForUser } from "./limits.server";

const limits = (over: Record<string, unknown> = {}) => ({
  currency: "KES",
  daily_deposit_max: 1000,
  monthly_deposit_max: 5000,
  daily_withdrawal_max: 800,
  monthly_withdrawal_max: 4000,
  daily_invest_max: 600,
  single_txn_max: 500,
  ...over,
});

beforeEach(() => {
  state.own = null;
  state.tier = limits();
  state.rows = [];
  state.sinceCalls = [];
});

describe("getLimitsForUser", () => {
  it("prefers per-user limits over the default tier", async () => {
    state.own = limits({ single_txn_max: 1 });
    expect((await getLimitsForUser("u"))?.single_txn_max).toBe(1);
  });
  it("falls back to the default tier, then null", async () => {
    expect((await getLimitsForUser("u"))?.single_txn_max).toBe(500);
    state.tier = null;
    expect(await getLimitsForUser("u")).toBeNull();
  });
});

describe("checkTransactionLimit", () => {
  it("fails open when no limits are configured", async () => {
    state.tier = null;
    expect(await checkTransactionLimit("u", "deposit", 1e9)).toEqual({ ok: true });
  });

  it("allows an amount exactly equal to the single-transaction max", async () => {
    expect((await checkTransactionLimit("u", "deposit", 500)).ok).toBe(true);
  });

  it("rejects an amount just over the single-transaction max", async () => {
    const r = await checkTransactionLimit("u", "deposit", 500.01);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("Single transaction limit");
  });

  it("allows zero amount with no usage", async () => {
    expect(await checkTransactionLimit("u", "withdrawal", 0)).toMatchObject({
      ok: true,
      usedToday: 0,
      usedThisMonth: 0,
    });
  });

  it("allows reaching the daily max exactly and rejects one cent over", async () => {
    state.tier = limits({ single_txn_max: 10000 });
    state.rows = [{ amount: 600, status: "confirmed" }];
    expect((await checkTransactionLimit("u", "deposit", 400)).ok).toBe(true);
    const over = await checkTransactionLimit("u", "deposit", 400.01);
    expect(over.ok).toBe(false);
    expect(over.error).toContain("Daily deposit limit");
    expect(over.usedToday).toBe(600);
  });

  it("enforces the monthly cap when daily still has room", async () => {
    state.tier = limits({
      single_txn_max: 10000,
      daily_deposit_max: 10000,
      monthly_deposit_max: 1000,
    });
    state.rows = [{ amount: 900, status: "confirmed" }];
    const r = await checkTransactionLimit("u", "deposit", 101);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("30-day deposit limit");
    expect((await checkTransactionLimit("u", "deposit", 100)).ok).toBe(true);
  });

  it("ignores failed and rejected transactions and coerces string/null amounts", async () => {
    state.tier = limits({ single_txn_max: 10000 });
    state.rows = [
      { amount: 700, status: "failed" },
      { amount: 700, status: "rejected" },
      { amount: "300", status: "pending" },
      { amount: null, status: "confirmed" },
    ];
    const r = await checkTransactionLimit("u", "withdrawal", 500);
    expect(r).toMatchObject({ ok: true, usedToday: 300, usedThisMonth: 300 });
    expect((await checkTransactionLimit("u", "withdrawal", 500.01)).ok).toBe(false);
  });

  it("uses per-kind daily maxes", async () => {
    state.tier = limits({ single_txn_max: 10000 });
    expect((await checkTransactionLimit("u", "withdrawal", 800)).ok).toBe(true);
    expect((await checkTransactionLimit("u", "withdrawal", 801)).error).toContain(
      "Daily withdrawal",
    );
    expect((await checkTransactionLimit("u", "invest", 600)).ok).toBe(true);
    expect((await checkTransactionLimit("u", "invest", 601)).error).toContain("Daily invest");
  });

  it("invest monthly cap currently reuses monthly_deposit_max (documents existing behaviour)", async () => {
    state.tier = limits({
      single_txn_max: 10000,
      daily_invest_max: 10000,
      monthly_deposit_max: 1000,
      monthly_withdrawal_max: 99999,
    });
    expect((await checkTransactionLimit("u", "invest", 1000)).ok).toBe(true);
    expect((await checkTransactionLimit("u", "invest", 1001)).error).toContain("30-day invest");
  });

  it("queries 24h and 30d windows", async () => {
    const now = Date.parse("2026-11-28T12:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);
    try {
      await checkTransactionLimit("u", "deposit", 1);
    } finally {
      vi.useRealTimers();
    }
    expect(state.sinceCalls).toContain(new Date(now - 86400000).toISOString());
    expect(state.sinceCalls).toContain(new Date(now - 30 * 86400000).toISOString());
  });
});
