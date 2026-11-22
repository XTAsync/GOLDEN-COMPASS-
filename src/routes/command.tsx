import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { sentence } from "@/lib/sentence";
import { useAuth } from "@/hooks/useAuth";
import { useAccountSummary, KES } from "@/hooks/useAccountSummary";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { NotificationBell } from "@/components/NotificationBell";
import { Wallet, LineChart, UserCog, LayoutGrid, Star, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/command")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
      { title: "Command Center — Golden Compass" },
      {
        name: "description",
        content:
          "Your Golden Compass control panel: account status, pocket access, market view, quick access and account centre.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Command Center — Golden Compass" },
      {
        property: "og:description",
        content: "One control panel for wallet, markets, tools and account.",
      },
      { property: "og:url", content: "/command" },
    ],
    links: [{ rel: "canonical", href: "/command" }],
  }),
  component: CommandCenter,
});

const ACTIONS = [
  {
    to: "/pocket" as const,
    Icon: Wallet,
    title: "Pocket Access",
    caption: "Wallet, deposits & withdrawals",
  },
  {
    to: "/markets" as const,
    Icon: LineChart,
    title: "Market View",
    caption: "Prices, charts & watchlist",
  },
  {
    to: "/account" as const,
    Icon: UserCog,
    title: "Account Centre",
    caption: "Profile, security & settings",
  },
  {
    to: "/quick" as const,
    Icon: LayoutGrid,
    title: "Quick Access",
    caption: "Shortcuts & utilities",
  },
];

function CommandCenter() {
  const { user, loading: authLoading } = useAuth();
  const s = useAccountSummary();

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="page enter">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="t-title">Command Center</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <NotificationBell />
          <Link
            to="/pools"
            aria-label="View pool terms"
            className="surface flex items-center gap-1.5 rounded-full"
            style={{ padding: "8px 12px", textDecoration: "none", color: "var(--text-2)" }}
          >
            <Star size={15} strokeWidth={1.8} />
            <span>Pools</span>
          </Link>
        </div>
      </header>

      {/* ACC STATUS */}
      <div className="surface-raised rounded-2xl p-6">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <p className="tx-2" style={{ fontSize: 12 }}>
              Account status
            </p>
            <span
              style={{
                fontSize: 12,
                padding: "4px 8px",
                borderRadius: 999,
                color: s.kycStatus === "approved" ? "var(--gain)" : "var(--warn)",
                border: `1px solid ${s.kycStatus === "approved" ? "rgba(46,204,113,0.4)" : "rgba(243,156,18,0.4)"}`,
                background:
                  s.kycStatus === "approved" ? "rgba(46,204,113,0.10)" : "rgba(243,156,18,0.10)",
              }}
            >
              {s.kycStatus === "approved" ? "Verified" : sentence(s.kycStatus)}
            </span>
          </div>

          {s.loading ? (
            <div className="skeleton h-10 w-56 mt-3 rounded-lg" />
          ) : (
            <h2 className="t-figure mt-2">
              <AnimatedNumber value={s.totalValue} format={KES} />
            </h2>
          )}
          <p className="tx-3 mt-1" style={{ fontSize: 12 }}>
            Net account value: wallet plus holdings
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "Wallet", value: KES(s.wallet), tone: "var(--text-1)" },
              { label: "Invested", value: KES(s.invested), tone: "var(--text-1)" },
              {
                label: "P / L",
                value: `${s.gain >= 0 ? "+" : ""}${s.gainPct.toFixed(2)}%`,
                tone: s.gain >= 0 ? "var(--gain)" : "var(--loss)",
              },
            ].map((m) => (
              <div key={m.label} className="surface rounded-xl" style={{ padding: "12px 12px" }}>
                <p className="tx-2" style={{ fontSize: 12 }}>
                  {m.label}
                </p>
                <p
                  className="mt-1"
                  style={{
                    fontSize: 12,
                    color: m.tone,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Link to="/trade" className="btn-primary flex-1 text-center">
              Trade
            </Link>
            <Link to="/pools" className="btn-secondary flex-1 text-center">
              Invest
            </Link>
            <Link
              to="/portfolio"
              className="btn-secondary flex-1"
              style={{
                fontSize: 12,
                padding: "12px 12px",
                textDecoration: "none",
              }}
            >
              Portfolio
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* FOUR ACTIONS */}
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map(({ to, Icon, title, caption }) => (
          <Link
            key={to}
            to={to}
            className="surface rounded-2xl flex flex-col justify-between"
            style={{ padding: 16, minHeight: 132, textDecoration: "none" }}
          >
            <span
              className="flex items-center justify-center rounded-2xl"
              style={{
                width: 42,
                height: 42,
                color: "var(--text-2)",
                background: "var(--ink-3)",
                border: "1px solid var(--hairline-strong)",
              }}
            >
              <Icon size={20} strokeWidth={1.7} />
            </span>
            <div className="mt-3">
              <p className="tx-1" style={{ fontSize: 14 }}>
                {title}
              </p>
              <p className="tx-3 mt-1" style={{ fontSize: 12, lineHeight: 1.5 }}>
                {caption}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <p className="tx-3 text-center" style={{ fontSize: 12 }}>
        Simulated trading. No real money is used.
      </p>
    </div>
  );
}
