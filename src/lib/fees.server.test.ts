import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ row: null as Record<string, unknown> | null }));

vi.mock("@/integrations/supabase/client.server", () => {
  const chain: Record<string, unknown> = {};
  chain.select = () => chain;
  chain.eq = () => chain;
  chain.maybeSingle = async () => ({ data: state.row });
  return { supabaseAdmin: { from: () => chain } };
});

import { estimateFees, getFeeConfig } from "./fees.server";

const cfg = (over: Record<string, unknown> = {}) => ({
  market: "NSE",
  commission_percent: 1.78,
  tax_percent: 5,
  min_commission: 0,
  currency: "KES",
  label: "test",
  ...over,
});

beforeEach(() => {
  state.row = cfg();
});

describe("getFeeConfig", () => {
  it("falls back to illustrative rates and uppercases market when no row", async () => {
    state.row = null;
    const c = await getFeeConfig("nse");
    expect(c).toMatchObject({
      market: "NSE",
      commission_percent: 1.78,
      tax_percent: 5,
      currency: "KES",
    });
  });
});

describe("estimateFees", () => {
  it("computes buy total as gross + commission + tax", async () => {
    const f = await estimateFees({ market: "NSE", side: "buy", quantity: 100, price: 10 });
    expect(f.gross).toBe(1000);
    expect(f.commission).toBe(17.8);
    expect(f.tax_withheld).toBe(0.89);
    expect(f.total).toBe(1018.69);
    expect(f.simulated).toBe(true);
  });

  it("computes sell total as gross - commission - tax", async () => {
    const f = await estimateFees({ market: "NSE", side: "sell", quantity: 100, price: 10 });
    expect(f.total).toBe(981.31);
  });

  it("returns zero fees for zero quantity or zero price", async () => {
    for (const p of [
      { quantity: 0, price: 10 },
      { quantity: 10, price: 0 },
    ]) {
      const f = await estimateFees({ market: "NSE", side: "buy", ...p });
      expect(f).toMatchObject({ gross: 0, commission: 0, tax_withheld: 0, total: 0 });
    }
  });

  it("applies min_commission when percentage commission is below it", async () => {
    state.row = cfg({ min_commission: 50 });
    const f = await estimateFees({ market: "NSE", side: "buy", quantity: 1, price: 100 });
    expect(f.commission).toBe(50);
    expect(f.tax_withheld).toBe(2.5);
    expect(f.total).toBe(152.5);
  });

  it("uses percentage commission when it equals or exceeds min_commission", async () => {
    state.row = cfg({ min_commission: 10, commission_percent: 1 });
    const eq = await estimateFees({ market: "NSE", side: "buy", quantity: 1, price: 1000 });
    expect(eq.commission).toBe(10);
    const above = await estimateFees({ market: "NSE", side: "buy", quantity: 1, price: 2000 });
    expect(above.commission).toBe(20);
  });

  it("applies min_commission even at zero gross", async () => {
    state.row = cfg({ min_commission: 25 });
    const f = await estimateFees({ market: "NSE", side: "buy", quantity: 0, price: 10 });
    expect(f.commission).toBe(25);
  });

  it("rounds to 2 decimals", async () => {
    state.row = cfg({ commission_percent: 1.5, tax_percent: 7 });
    const f = await estimateFees({ market: "NSE", side: "buy", quantity: 3, price: 3.33 });
    // gross 9.99, commission 0.14985 -> 0.15, tax 0.0105 -> 0.01
    expect(f.gross).toBe(9.99);
    expect(f.commission).toBe(0.15);
    expect(f.tax_withheld).toBe(0.01);
    expect(f.total).toBe(10.15);
  });

  it("treats null min_commission as zero and zero tax as no tax", async () => {
    state.row = cfg({ min_commission: null, tax_percent: 0 });
    const f = await estimateFees({ market: "NSE", side: "sell", quantity: 10, price: 100 });
    expect(f.tax_withheld).toBe(0);
    expect(f.total).toBe(982.2);
  });

  it("defaults currency and label when config omits them", async () => {
    state.row = cfg({ currency: null, label: null });
    const f = await estimateFees({ market: "NSE", side: "buy", quantity: 1, price: 1 });
    expect(f.currency).toBe("KES");
    expect(f.label).toContain("illustrative");
  });
});
