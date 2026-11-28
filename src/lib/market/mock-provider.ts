// Deterministic mock market data provider. No network, no randomness, and no
// clock unless one is injected: the same symbol and time give the same quote.
import { SYMBOLS } from "@/lib/symbols";
import type { Currency, Instrument, MarketDataProvider, MarketQuote } from "./types";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) / 2147483648; // [0, 1)
}

function currencyFor(exchange: Instrument["exchange"]): Currency {
  return exchange === "GLOBAL" ? "USD" : "KES";
}

const CATALOG: Instrument[] = SYMBOLS.map((s) => ({
  symbol: s.symbol,
  name: s.name,
  exchange: s.exchange,
  currency: currencyFor(s.exchange),
}));

export function createMockMarketProvider(now: () => Date = () => new Date()): MarketDataProvider {
  const find = (symbol: string) =>
    CATALOG.find((i) => i.symbol === symbol.trim().toUpperCase()) ?? null;

  return {
    id: "mock",
    async searchInstruments(query, limit = 10) {
      const q = query.trim().toLowerCase();
      if (!q || limit <= 0) return [];
      const score = (i: Instrument) => {
        const sym = i.symbol.toLowerCase();
        if (sym === q) return 0;
        if (sym.startsWith(q)) return 1;
        if (i.name.toLowerCase().includes(q) || sym.includes(q)) return 2;
        return -1;
      };
      return CATALOG.map((i) => ({ i, s: score(i) }))
        .filter((x) => x.s >= 0)
        .sort((a, b) => a.s - b.s || a.i.symbol.localeCompare(b.i.symbol))
        .slice(0, limit)
        .map((x) => x.i);
    },
    async getInstrument(symbol) {
      return find(symbol);
    },
    async getQuotes(symbols) {
      const t = now();
      // Slow deterministic drift so repeated polls show visible movement.
      const bucket = Math.floor(t.getTime() / 15000);
      const out: MarketQuote[] = [];
      const seen = new Set<string>();
      for (const raw of symbols) {
        const inst = find(raw);
        if (!inst || seen.has(inst.symbol)) continue;
        seen.add(inst.symbol);
        const base = 10 + hash(inst.symbol) * 190;
        const wave = hash(inst.symbol + ":" + bucket) - 0.5; // [-0.5, 0.5)
        out.push({
          symbol: inst.symbol,
          price: Math.round(base * (1 + wave * 0.04) * 100) / 100,
          changePct: Math.round(wave * 8 * 100) / 100,
          currency: inst.currency,
          asOf: t.toISOString(),
          simulated: true,
        });
      }
      return out;
    },
  };
}
