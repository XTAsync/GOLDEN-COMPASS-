import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Sparkline } from "@/components/Sparkline";
import { useQuotes } from "@/lib/quote-client";
import { symbolsByCategory, type SymbolEntry } from "@/lib/symbols";

export const Route = createFileRoute("/markets")({
  head: () => ({
    meta: [
      { title: "Markets — NSE & Global Movers | Golden Compass" },
      {
        name: "description",
        content:
          "Track NSE Kenya movers, global indices and global tech equities at a glance on Golden Compass.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "Markets — NSE & Global Movers | Golden Compass" },
      {
        property: "og:description",
        content: "NSE Kenya movers, global indices and global tech equities in one view.",
      },
    ],
  }),
  component: MarketsPage,
});

const GROUPS: { title: string; caption: string; entries: SymbolEntry[] }[] = [
  {
    title: "NSE movers",
    caption: "Nairobi Securities Exchange",
    entries: symbolsByCategory("nse").slice(0, 8),
  },
  {
    title: "Global indices",
    caption: "Broad-market equity ETFs",
    entries: symbolsByCategory("index"),
  },
  { title: "Global tech", caption: "Large-cap technology", entries: symbolsByCategory("tech") },
  {
    title: "African blue chips",
    caption: "NGX, JSE and GSE",
    entries: symbolsByCategory("africa").slice(0, 8),
  },
];

function MarketsPage() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="page enter">
      <header className="mb-6">
        <h1 className="t-title">Markets</h1>
        <p className="tx-2 mt-1">African and global equities</p>
      </header>

      <p className="surface t-status mb-6" style={{ padding: "12px 16px" }}>
        Simulated trading. Prices may be sandbox data.
      </p>

      <div className="flex flex-col gap-8">
        {GROUPS.map((g) => (
          <MarketRow key={g.title} title={g.title} caption={g.caption} entries={g.entries} />
        ))}
      </div>
    </div>
  );
}

function MarketRow({
  title,
  caption,
  entries,
}: {
  title: string;
  caption: string;
  entries: SymbolEntry[];
}) {
  const { quotes } = useQuotes(
    entries.map((e) => ({ symbol: e.symbol, exchange: e.exchange })),
    45_000,
  );

  return (
    <section className="flex flex-col gap-2">
      <div>
        <h2 className="t-heading">{title}</h2>
        <p className="tx-3 t-label">{caption}</p>
      </div>
      <div className="market-row">
        {entries.map((e) => {
          const state = quotes[e.symbol.toUpperCase()];
          const q = state?.quote;
          const up = (q?.change_pct ?? 0) >= 0;
          const color = up ? "var(--gain)" : "var(--loss)";
          return (
            <div key={`${e.symbol}-${e.exchange}`} className="market-cell">
              <Link
                to="/stock/$symbol"
                params={{ symbol: e.symbol }}
                search={{ exchange: e.exchange }}
                className="surface-raised flex flex-col"
                style={{ padding: 12, textDecoration: "none" }}
              >
                <span className="tx-1" style={{ fontWeight: 600 }}>
                  {e.symbol}
                </span>
                <span
                  className="tx-3"
                  style={{
                    fontSize: 12,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {e.name}
                </span>
                <div style={{ margin: "8px 0 4px", height: 30 }}>
                  {state && state.history.length > 1 ? (
                    <Sparkline data={state.history} width={132} height={30} color={color} />
                  ) : (
                    <div className="skeleton w-full h-full rounded-lg" />
                  )}
                </div>
                <span className="tx-1">
                  {q
                    ? `${q.currency} ${q.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                    : "—"}
                </span>
                <span className="t-status" style={{ color }}>
                  {q ? `${up ? "+" : ""}${q.change_pct.toFixed(2)}%` : "loading…"}
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
