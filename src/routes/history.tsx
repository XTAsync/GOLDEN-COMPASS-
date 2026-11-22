import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { sentence } from "@/lib/sentence";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScrollText } from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
      { title: "Transaction History — Golden Compass" },
      {
        name: "description",
        content: "Your complete log of Golden Compass deposits, withdrawals and pool investments.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Transaction History — Golden Compass" },
      { property: "og:description", content: "Your deposit, withdrawal and investment log." },
      { property: "og:url", content: "/history" },
    ],
    links: [{ rel: "canonical", href: "/history" }],
  }),
  component: HistoryPage,
});

interface TxRow {
  id: string;
  type: string | null;
  amount: number;
  status: string | null;
  created_at: string | null;
  confirmed_at: string | null;
  mpesa_reference: string | null;
  pool_id: string | null;
  investment_pools: { name: string } | null;
}

const KES = (n: number) =>
  "KES " +
  Number(n).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_COLOR: Record<string, string> = {
  pending: "var(--warn)",
  confirmed: "var(--gain)",
  failed: "var(--loss)",
  cancelled: "var(--loss)",
};

function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [txs, setTxs] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("transactions")
        .select(
          "id, type, amount, status, created_at, confirmed_at, mpesa_reference, pool_id, investment_pools(name)",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      setTxs((data as unknown as TxRow[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="page page-narrow enter">
      <header>
        <h1 className="t-title">Transaction History</h1>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : txs.length === 0 ? (
        <div className="surface rounded-xl p-8 text-center">
          <ScrollText size={32} strokeWidth={1.5} className="tx-2 mx-auto mb-3" />
          <p className="tx-1" style={{ fontSize: 15 }}>
            The ledger is empty.
          </p>
          <p className="tx-3 mt-2" style={{ fontSize: 12 }}>
            Your transactions will be recorded here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {txs.map((tx) => {
            const label =
              tx.type === "deposit"
                ? "↓ Deposit"
                : tx.type === "invest"
                  ? "→ Investment"
                  : "↑ Withdrawal";
            const isCredit = tx.type === "deposit";
            const color = STATUS_COLOR[tx.status ?? "pending"] ?? "var(--gold-text)";
            return (
              <div key={tx.id} className="surface rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="tx-1" style={{ fontSize: 14 }}>
                      {label}
                      {tx.investment_pools?.name && (
                        <span className="tx-2" style={{ fontSize: 12 }}>
                          {" · "}
                          {tx.investment_pools.name}
                        </span>
                      )}
                    </p>
                    <p className="tx-3 mt-1" style={{ fontSize: 12 }}>
                      {tx.created_at ? new Date(tx.created_at).toLocaleString("en-KE") : ""}
                    </p>
                    {tx.mpesa_reference && (
                      <p className="tx-2 mt-1" style={{ fontSize: 12 }}>
                        REF: {tx.mpesa_reference}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p
                      style={{
                        fontSize: 15,
                        color: isCredit
                          ? "var(--gain)"
                          : tx.type === "invest"
                            ? "var(--gold-text)"
                            : "var(--text-1)",
                      }}
                    >
                      {isCredit ? "+" : "−"}
                      {KES(Number(tx.amount))}
                    </p>
                    <span
                      className="inline-block mt-1"
                      style={{
                        fontSize: 12,
                        color,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: `${color}1A`,
                        border: `1px solid ${color}55`,
                      }}
                    >
                      {sentence(tx.status ?? "pending")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
