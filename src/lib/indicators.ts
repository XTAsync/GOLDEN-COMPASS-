// Pure chart indicators. Every function returns arrays aligned 1:1 with the
// input; positions without enough history are null. No I/O, no mutation.

export interface OhlcvBar {
  h: number;
  l: number;
  c: number;
  v: number;
}

export type Series = (number | null)[];

function assertPeriod(period: number): void {
  if (!Number.isInteger(period) || period < 1) {
    throw new RangeError("period must be a positive integer");
  }
}

function blank(n: number): Series {
  return new Array<number | null>(n).fill(null);
}

export function sma(values: number[], period: number): Series {
  assertPeriod(period);
  const out = blank(values.length);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/** EMA seeded with the SMA of the first `period` values. */
export function ema(values: number[], period: number): Series {
  assertPeriod(period);
  const out = blank(values.length);
  if (values.length < period) return out;
  const k = 2 / (period + 1);
  let prev = 0;
  for (let i = 0; i < period; i++) prev += values[i];
  prev /= period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/** Wilder smoothing (RMA) seeded with the SMA of `period` values from `start`. */
function wilder(values: number[], period: number, start = 0): Series {
  const out = blank(values.length);
  if (values.length - start < period) return out;
  let prev = 0;
  for (let i = start; i < start + period; i++) prev += values[i];
  prev /= period;
  out[start + period - 1] = prev;
  for (let i = start + period; i < values.length; i++) {
    prev = (prev * (period - 1) + values[i]) / period;
    out[i] = prev;
  }
  return out;
}

export function rsi(closes: number[], period = 14): Series {
  assertPeriod(period);
  const out = blank(closes.length);
  if (closes.length <= period) return out;
  const gains: number[] = [0];
  const losses: number[] = [0];
  for (let i = 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gains.push(d > 0 ? d : 0);
    losses.push(d < 0 ? -d : 0);
  }
  const ag = wilder(gains, period, 1);
  const al = wilder(losses, period, 1);
  for (let i = period; i < closes.length; i++) {
    const g = ag[i] as number;
    const l = al[i] as number;
    if (l === 0) out[i] = g === 0 ? 50 : 100;
    else out[i] = 100 - 100 / (1 + g / l);
  }
  return out;
}

export interface MacdResult {
  macd: Series;
  signal: Series;
  histogram: Series;
}

export function macd(closes: number[], fast = 12, slow = 26, signalPeriod = 9): MacdResult {
  assertPeriod(fast);
  assertPeriod(slow);
  assertPeriod(signalPeriod);
  if (fast >= slow) throw new RangeError("fast period must be less than slow period");
  const f = ema(closes, fast);
  const s = ema(closes, slow);
  const line = blank(closes.length);
  for (let i = 0; i < closes.length; i++) {
    if (f[i] !== null && s[i] !== null) line[i] = (f[i] as number) - (s[i] as number);
  }
  const signal = blank(closes.length);
  const histogram = blank(closes.length);
  const first = line.findIndex((v) => v !== null);
  if (first >= 0) {
    const sig = ema(line.slice(first) as number[], signalPeriod);
    for (let i = 0; i < sig.length; i++) {
      const v = sig[i];
      if (v === null) continue;
      signal[first + i] = v;
      histogram[first + i] = (line[first + i] as number) - v;
    }
  }
  return { macd: line, signal, histogram };
}

export interface BollingerResult {
  upper: Series;
  middle: Series;
  lower: Series;
}

/** Bollinger Bands using population standard deviation. */
export function bollinger(closes: number[], period = 20, mult = 2): BollingerResult {
  assertPeriod(period);
  const middle = sma(closes, period);
  const upper = blank(closes.length);
  const lower = blank(closes.length);
  for (let i = period - 1; i < closes.length; i++) {
    const m = middle[i] as number;
    let sq = 0;
    for (let j = i - period + 1; j <= i; j++) sq += (closes[j] - m) ** 2;
    const sd = Math.sqrt(sq / period);
    upper[i] = m + mult * sd;
    lower[i] = m - mult * sd;
  }
  return { upper, middle, lower };
}

/** Cumulative VWAP over the supplied bars using typical price (h+l+c)/3. */
export function vwap(bars: OhlcvBar[]): Series {
  const out = blank(bars.length);
  let pv = 0;
  let vol = 0;
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    pv += ((b.h + b.l + b.c) / 3) * b.v;
    vol += b.v;
    out[i] = vol > 0 ? pv / vol : null;
  }
  return out;
}

/** Average True Range with Wilder smoothing. */
export function atr(bars: OhlcvBar[], period = 14): Series {
  assertPeriod(period);
  if (bars.length === 0) return [];
  const tr = bars.map((b, i) =>
    i === 0
      ? b.h - b.l
      : Math.max(b.h - b.l, Math.abs(b.h - bars[i - 1].c), Math.abs(b.l - bars[i - 1].c)),
  );
  return wilder(tr, period);
}

export interface StochasticResult {
  k: Series;
  d: Series;
}

/** Stochastic oscillator: %K over `kPeriod`, %D = SMA of %K over `dPeriod`. */
export function stochastic(bars: OhlcvBar[], kPeriod = 14, dPeriod = 3): StochasticResult {
  assertPeriod(kPeriod);
  assertPeriod(dPeriod);
  const k = blank(bars.length);
  for (let i = kPeriod - 1; i < bars.length; i++) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      hh = Math.max(hh, bars[j].h);
      ll = Math.min(ll, bars[j].l);
    }
    k[i] = hh === ll ? 50 : ((bars[i].c - ll) / (hh - ll)) * 100;
  }
  const d = blank(bars.length);
  const first = k.findIndex((v) => v !== null);
  if (first >= 0) {
    const s = sma(k.slice(first) as number[], dPeriod);
    for (let i = 0; i < s.length; i++) d[first + i] = s[i];
  }
  return { k, d };
}
