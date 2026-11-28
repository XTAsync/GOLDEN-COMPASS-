import { describe, expect, it } from "vitest";
import { atr, bollinger, ema, macd, rsi, sma, stochastic, vwap, type OhlcvBar } from "./indicators";

const close = (a: number | null, b: number, d = 6) => {
  expect(a).not.toBeNull();
  expect(a as number).toBeCloseTo(b, d);
};

describe("sma", () => {
  it("averages windows and pads warmup with null", () => {
    expect(sma([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });
  it("handles short input and empty input", () => {
    expect(sma([1, 2], 3)).toEqual([null, null]);
    expect(sma([], 3)).toEqual([]);
  });
  it("rejects invalid periods", () => {
    expect(() => sma([1], 0)).toThrow(RangeError);
    expect(() => sma([1], 1.5)).toThrow(RangeError);
  });
});

describe("ema", () => {
  it("seeds with SMA then applies smoothing", () => {
    const r = ema([1, 2, 3, 4, 5], 3);
    expect(r.slice(0, 2)).toEqual([null, null]);
    close(r[2], 2);
    close(r[3], 3);
    close(r[4], 4);
  });
  it("is flat for constant input", () => {
    expect(ema([5, 5, 5, 5], 2).slice(1)).toEqual([5, 5, 5]);
  });
  it("returns all null when too short", () => {
    expect(ema([1, 2], 3)).toEqual([null, null]);
  });
});

describe("rsi", () => {
  it("is 100 for strictly rising closes", () => {
    const r = rsi([1, 2, 3, 4, 5, 6], 3);
    expect(r.slice(0, 3)).toEqual([null, null, null]);
    expect(r.slice(3)).toEqual([100, 100, 100]);
  });
  it("is 0 for strictly falling closes", () => {
    expect(rsi([6, 5, 4, 3, 2], 3)[3]).toBe(0);
  });
  it("is 50 when flat", () => {
    expect(rsi([2, 2, 2, 2, 2], 3)[4]).toBe(50);
  });
  it("matches a hand computed value", () => {
    // diffs +1,-1,+1: avg gain 2/3, avg loss 1/3, RS 2, RSI 66.667
    close(rsi([10, 11, 10, 11], 3)[3], 200 / 3);
  });
  it("stays within 0..100", () => {
    const data = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i) * 10);
    for (const v of rsi(data)) {
      if (v === null) continue;
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

describe("macd", () => {
  const data = Array.from({ length: 60 }, (_, i) => 100 + i + Math.sin(i));
  it("aligns lengths and warmup", () => {
    const r = macd(data);
    expect(r.macd).toHaveLength(60);
    expect(r.macd.findIndex((v) => v !== null)).toBe(25);
    expect(r.signal.findIndex((v) => v !== null)).toBe(33);
  });
  it("histogram equals macd minus signal", () => {
    const r = macd(data);
    for (let i = 0; i < data.length; i++) {
      if (r.histogram[i] !== null) {
        close(r.histogram[i], (r.macd[i] as number) - (r.signal[i] as number), 10);
      }
    }
  });
  it("is zero for constant input", () => {
    const r = macd(new Array<number>(40).fill(7));
    expect(r.macd[39]).toBe(0);
    expect(r.histogram[39]).toBe(0);
  });
  it("rejects fast >= slow", () => {
    expect(() => macd(data, 26, 12)).toThrow(RangeError);
  });
  it("handles input shorter than slow period", () => {
    expect(macd([1, 2, 3]).signal).toEqual([null, null, null]);
  });
});

describe("bollinger", () => {
  it("computes bands with population stddev", () => {
    const r = bollinger([2, 4, 4, 4, 5, 5, 7, 9], 8, 2);
    close(r.middle[7], 5);
    close(r.upper[7], 9); // sd = 2
    close(r.lower[7], 1);
    expect(r.upper[6]).toBeNull();
  });
  it("collapses to the mean for constant input", () => {
    const r = bollinger([3, 3, 3], 3);
    expect(r.upper[2]).toBe(3);
    expect(r.lower[2]).toBe(3);
  });
});

const bars: OhlcvBar[] = [
  { h: 10, l: 8, c: 9, v: 100 },
  { h: 12, l: 9, c: 11, v: 200 },
  { h: 13, l: 10, c: 10, v: 0 },
  { h: 14, l: 11, c: 13, v: 100 },
];

describe("vwap", () => {
  it("is cumulative typical-price weighted", () => {
    const r = vwap(bars);
    close(r[0], 9);
    close(r[1], (9 * 100 + (32 / 3) * 200) / 300);
    close(r[2], r[1] as number); // zero volume leaves it unchanged
  });
  it("is null until volume appears", () => {
    expect(vwap([{ h: 1, l: 1, c: 1, v: 0 }])).toEqual([null]);
  });
});

describe("atr", () => {
  it("uses true range including gaps and Wilder smoothing", () => {
    // TR: 2, 3, 3, 4
    const r = atr(bars, 2);
    expect(r[0]).toBeNull();
    close(r[1], 2.5);
    close(r[2], 2.75);
    close(r[3], 3.375);
  });
  it("handles empty input", () => {
    expect(atr([])).toEqual([]);
  });
});

describe("stochastic", () => {
  it("computes %K and %D", () => {
    const r = stochastic(bars, 3, 2);
    expect(r.k.slice(0, 2)).toEqual([null, null]);
    close(r.k[2], ((10 - 8) / (13 - 8)) * 100);
    close(r.k[3], ((13 - 9) / (14 - 9)) * 100);
    expect(r.d[2]).toBeNull();
    close(r.d[3], ((r.k[2] as number) + (r.k[3] as number)) / 2);
  });
  it("returns 50 on a flat range", () => {
    const flat = [1, 2, 3].map(() => ({ h: 5, l: 5, c: 5, v: 1 }));
    expect(stochastic(flat, 3, 1).k[2]).toBe(50);
  });
});
