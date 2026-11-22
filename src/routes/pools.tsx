import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { sentence } from "@/lib/sentence";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DepositModal } from "@/components/DepositModal";
import { Anchor, BookOpen, Compass, Sparkles, Swords, type LucideIcon } from "lucide-react";

export const Route = createFileRoute("/pools")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
      { title: "Investment Pools — Golden Compass" },
      {
        name: "description",
        content:
          "Browse Golden Compass investment pools and allocate wallet funds into the pool that fits your goals.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Investment Pools — Golden Compass" },
      {
        property: "og:description",
        content: "Browse and invest into curated Golden Compass pools.",
      },
      { property: "og:url", content: "/pools" },
    ],
    links: [{ rel: "canonical", href: "/pools" }],
  }),
  component: PoolsPage,
});

interface Pool {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  pool_type: string | null;
  current_nav: number | null;
  min_investment: number | null;
  exit_fee_percent: number | null;
  holding_period_days: number | null;
}

const KES = (n: number) => "KES " + Number(n).toLocaleString("en-KE", { maximumFractionDigits: 0 });

const POOL_META: Record<string, { Emblem: LucideIcon; tagline: string; accent: string }> = {
  "stable-harbour": {
    Emblem: Anchor,
    tagline: "View the recorded terms before allocating funds.",
    accent: "var(--text-2)",
  },
  bahari: {
    Emblem: Compass,
    tagline: "View the recorded terms before allocating funds.",
    accent: "var(--gold)",
  },
  "alpha-ventures": {
    Emblem: Swords,
    tagline: "View the recorded terms before allocating funds.",
    accent: "var(--warn)",
  },
};

function PoolsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositPool, setDepositPool] = useState<Pool | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("investment_pools")
        .select(
          "id, slug, name, description, pool_type, current_nav, min_investment, exit_fee_percent, holding_period_days",
        )
        .eq("is_active", true)
        .order("min_investment", { ascending: true });
      if (cancelled) return;
      setPools((data as Pool[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page enter">
      <header>
        <h1 className="t-title">Investment Pools</h1>
        <p className="tx-2 mt-2" style={{ fontSize: 13 }}>
          Compare recorded product terms. Returns are not guaranteed.
        </p>
        <Link
          to="/guides/dividend-tracking"
          className="tx-accent inline-block mt-3"
          style={{ fontSize: 12 }}
        >
          <BookOpen size={12} className="inline -mt-0.5 mr-1.5" />
          READ: DIVIDEND TRACKING GUIDE →
        </Link>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {pools.map((pool) => {
            const meta = POOL_META[pool.slug] ?? {
              Emblem: Sparkles,
              tagline: pool.description ?? "",
              accent: "var(--gold)",
            };
            return (
              <div key={pool.id} className="surface-raised rounded-2xl p-5">
                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                        style={{
                          background: "var(--ink-3)",
                          border: `1px solid ${meta.accent}55`,
                        }}
                      >
                        <meta.Emblem size={24} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h2 className="tx-1" style={{ fontSize: 16 }}>
                          {pool.name}
                        </h2>
                        <p className="tx-2 mt-1" style={{ fontSize: 12 }}>
                          {sentence(pool.pool_type ?? "pool")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="tx-3" style={{ fontSize: 12 }}>
                        NAV
                      </p>
                      <p className="tx-accent" style={{ fontSize: 16 }}>
                        {pool.current_nav == null
                          ? "Unavailable"
                          : Number(pool.current_nav).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <p className="tx-2 mt-3" style={{ fontSize: 13 }}>
                    {meta.tagline}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Stat
                      label="MIN"
                      value={pool.min_investment == null ? "Not set" : KES(pool.min_investment)}
                    />
                    <Stat
                      label="LOCK"
                      value={
                        pool.holding_period_days == null
                          ? "Not set"
                          : `${pool.holding_period_days}d`
                      }
                    />
                    <Stat
                      label="Exit fee"
                      value={
                        pool.exit_fee_percent == null ? "Not set" : `${pool.exit_fee_percent}%`
                      }
                    />
                  </div>

                  <button onClick={() => setDepositPool(pool)} className="btn-primary w-full mt-4">
                    Invest Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {depositPool && (
        <DepositModal
          pool={{
            id: depositPool.id,
            name: depositPool.name,
            min_investment: depositPool.min_investment,
            holding_period_days: depositPool.holding_period_days,
            exit_fee_percent: depositPool.exit_fee_percent,
          }}
          onClose={() => setDepositPool(null)}
          onSuccess={() => undefined}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg px-2 py-2 text-center"
      style={{
        background: "rgba(0,0,0,0.25)",
        border: "1px solid var(--hairline)",
      }}
    >
      <p className="tx-3" style={{ fontSize: 12 }}>
        {label}
      </p>
      <p className="tx-1 mt-1" style={{ fontSize: 12 }}>
        {value}
      </p>
    </div>
  );
}
