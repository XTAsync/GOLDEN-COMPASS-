// Market data provider interface and watchlist types. Interfaces only: no
// network calls and no server imports, so this is safe in client code.
// Prices are display values; they are never used for money math.

export type Exchange = "NSE" | "NGX" | "JSE" | "GSE" | "GLOBAL";
export type Currency = "KES" | "USD";

export interface Instrument {
  symbol: string;
  name: string;
  exchange: Exchange;
  currency: Currency;
}

export interface MarketQuote {
  symbol: string;
  price: number;
  /** Percent change versus the previous close. */
  changePct: number;
  currency: Currency;
  /** ISO-8601 time the quote was produced. */
  asOf: string;
  /** True when the data is simulated rather than from a real feed. */
  simulated: boolean;
}

export interface MarketDataProvider {
  readonly id: string;
  /** Search instruments by symbol or name. Empty query returns []. */
  searchInstruments(query: string, limit?: number): Promise<Instrument[]>;
  getInstrument(symbol: string): Promise<Instrument | null>;
  /** Quotes for the given symbols. Unknown symbols are omitted. */
  getQuotes(symbols: string[]): Promise<MarketQuote[]>;
}

export interface WatchlistItem {
  symbol: string;
  /** ISO-8601 time the symbol was added. */
  addedAt: string;
}

export interface Watchlist {
  id: string;
  name: string;
  items: WatchlistItem[];
  createdAt: string;
  updatedAt: string;
}
