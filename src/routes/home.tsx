import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useAccountSummary } from "@/hooks/useAccountSummary";
import { NotificationBell } from "@/components/NotificationBell";
import { Sparkline } from "@/components/Sparkline";
import { useQuotes } from "@/lib/quote-client";
import { symbolsByCategory } from "@/lib/symbols";
import { ArrowRight, BookOpen, Compass } from "lucide-react";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
      { title: "Home — Golden Compass" },
      {
        name: "description",
        content: "Your Golden Compass hub: what's new, GC AI guidance, market indexes and notices.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Home — Golden Compass" },
      {
        property: "og:description",
        content: "What's new, GC AI and market movement in one place.",
      },
      { property: "og:url", content: "/home" },
    ],
    links: [{ rel: "canonical", href: "/home" }],
  }),
  component: HomePage,
});

const ANNOUNCEMENTS = [
  {
    tag: "New",
    title: "Command Center",
    body: "One control panel for wallet, markets, tools and settings.",
  },
  {
    tag: "Update",
    title: "Candlestick charts",
    body: "1D–1Y OHLC charts with volume on every asset page.",
  },
  {
    tag: "Feature",
    title: "Price alerts",
    body: "Get notified the moment a stock crosses your level.",
  },
];

const INDEXES = symbolsByCategory("index").slice(0, 6);

function HomePage() {
  const { user, loading } = useAuth();
  const s = useAccountSummary();
  const { notifications } = useNotifications();
  const { quotes } = useQuotes(
    INDEXES.map((e) => ({ symbol: e.symbol, exchange: e.exchange })),
    60_000,
  );

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="page enter">
      <header className="flex items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="t-title">Home</h1>
          <p className="tx-2 mt-1 truncate">
            Hello, {s.firstName}. Markets, education and your account.
          </p>
        </div>
        <NotificationBell />
      </header>

      <div className="page-grid">
        <div className="flex flex-col gap-6 min-w-0">
          <Link
            to="/command"
            className="surface-raised tap44 flex items-center gap-3 p-4"
            style={{ textDecoration: "none" }}
          >
            <span
              className="shrink-0 flex items-center justify-center rounded-full tx-1"
              style={{
                width: 44,
                height: 44,
                fontWeight: 600,
                border: "1px solid var(--hairline-strong)",
                background: "var(--ink-3)",
              }}
            >
              {s.firstName.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="tx-1 block truncate" style={{ fontWeight: 600 }}>
                {s.fullName}
              </span>
              <span className="tx-3 t-label block truncate">
                {s.kycStatus === "approved" ? "Verified investor" : "Not yet verified"}
              </span>
            </span>
            <ArrowRight size={18} className="tx-2 shrink-0" />
          </Link>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="t-heading">Market index</h2>
              <Link to="/markets" className="tx-2 t-label" style={{ textDecoration: "underline" }}>
                See all markets
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {INDEXES.map((e) => {
                const st = quotes[e.symbol.toUpperCase()];
                const q = st?.quote;
                const up = (q?.change_pct ?? 0) >= 0;
                const color = up ? "var(--gain)" : "var(--loss)";
                return (
                  <Link
                    key={e.symbol}
                    to="/stock/$symbol"
                    params={{ symbol: e.symbol }}
                    search={{ exchange: e.exchange }}
                    className="surface p-3"
                    style={{ textDecoration: "none" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="tx-1" style={{ fontWeight: 600 }}>
                        {e.symbol}
                      </span>
                      <span className="t-status" style={{ color }}>
                        {q ? `${up ? "+" : ""}${q.change_pct.toFixed(2)}%` : "…"}
                      </span>
                    </div>
                    <div style={{ height: 24, marginTop: 8 }}>
                      {st && st.history.length > 1 ? (
                        <Sparkline data={st.history} width={130} height={24} color={color} />
                      ) : (
                        <div className="skeleton w-full h-full" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <Link
            to="/navigator"
            className="surface-raised tap44 flex items-center gap-4 p-4"
            style={{ textDecoration: "none" }}
          >
            <Compass size={24} strokeWidth={1.5} className="tx-2 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="tx-1 block" style={{ fontWeight: 600 }}>
                Education assistant
              </span>
              <span className="tx-3 t-label block">
                Learn investing concepts. No personal recommendations.
              </span>
            </span>
            <ArrowRight size={18} className="tx-2 shrink-0" />
          </Link>
        </div>

        <div className="flex flex-col gap-6 min-w-0">
          <section>
            <h2 className="t-heading mb-3">Notices</h2>
            <div className="flex flex-col gap-2">
              {notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="surface p-4">
                  <p className="tx-1">{n.title}</p>
                  {n.body && (
                    <p className="tx-2 t-label mt-1" style={{ lineHeight: 1.5 }}>
                      {n.body}
                    </p>
                  )}
                  <p className="tx-3 t-label mt-1">
                    {new Date(n.created_at).toLocaleDateString("en-KE")}
                  </p>
                </div>
              ))}
              {notifications.length === 0 && <p className="tx-3 t-label">No notices yet.</p>}
              <Link
                to="/pools"
                className="surface tap44 p-3 flex items-center justify-between gap-3"
                style={{ textDecoration: "none" }}
              >
                <span className="tx-1">View available pool terms</span>
                <ArrowRight size={16} className="tx-2" />
              </Link>
            </div>
          </section>

          <section>
            <h2 className="t-heading mb-3">What's new</h2>
            <div className="flex flex-col gap-2">
              {ANNOUNCEMENTS.map((a) => (
                <div key={a.title} className="surface p-4">
                  <span className="tx-accent t-label">{a.tag}</span>
                  <p className="tx-1 mt-1">{a.title}</p>
                  <p className="tx-2 t-label mt-1" style={{ lineHeight: 1.5 }}>
                    {a.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <Link
            to="/guides/dividend-tracking"
            className="surface tap44 p-3 flex items-center gap-3"
            style={{ textDecoration: "none" }}
          >
            <BookOpen size={18} className="tx-2 shrink-0" />
            <span className="tx-1 flex-1">Guides: tracking dividends</span>
            <ArrowRight size={16} className="tx-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
