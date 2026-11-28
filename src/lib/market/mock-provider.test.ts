import { describe, expect, it } from "vitest";
import { createMockMarketProvider } from "./mock-provider";

const fixed = () => new Date("2026-01-01T00:00:00Z");

describe("mock market provider", () => {
  const p = createMockMarketProvider(fixed);

  it("searches by symbol and name, exact symbol first", async () => {
    const r = await p.searchInstruments("scom");
    expect(r[0].symbol).toBe("SCOM");
    const byName = await p.searchInstruments("safaricom");
    expect(byName.map((i) => i.symbol)).toContain("SCOM");
  });

  it("returns [] for empty query and honours limit", async () => {
    expect(await p.searchInstruments("  ")).toEqual([]);
    expect((await p.searchInstruments("a", 3)).length).toBeLessThanOrEqual(3);
  });

  it("returns deterministic simulated quotes and omits unknown/duplicate symbols", async () => {
    const a = await p.getQuotes(["SCOM", "scom", "NOPE"]);
    const b = await p.getQuotes(["SCOM"]);
    expect(a).toHaveLength(1);
    expect(a).toEqual(b);
    expect(a[0].simulated).toBe(true);
    expect(a[0].price).toBeGreaterThan(0);
    expect(a[0].currency).toBe("KES");
  });

  it("looks up instruments case-insensitively", async () => {
    expect((await p.getInstrument(" eqty "))?.symbol).toBe("EQTY");
    expect(await p.getInstrument("NOPE")).toBeNull();
  });
});
