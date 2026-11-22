import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAccountSummary, KES } from "@/hooks/useAccountSummary";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { WalletDepositModal } from "@/components/WalletDepositModal";
import { WithdrawModal } from "@/components/WithdrawModal";
import { StatusChip } from "@/components/StatusChip";
import { useMoneyConfig } from "@/hooks/useMoneyConfig";
import { ArrowDownLeft, ArrowUpRight, Smartphone, Receipt, PiggyBank } from "lucide-react";

export const Route = createFileRoute("/pocket")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
      { title: "Pocket Access — Wallet | Golden Compass" },
      {
        name: "description",
        content:
          "Manage your Golden Compass wallet: balance, M-Pesa deposits, withdrawals and recent money activity.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Pocket Access — Wallet | Golden Compass" },
      {
        property: "og:description",
        content: "Wallet balance, deposits, withdrawals and money activity.",
      },
      { property: "og:url", content: "/pocket" },
    ],
    links: [{ rel: "canonical", href: "/pocket" }],
  }),
  component: PocketPage,
});

interface TxRow {
  id: string;
  type: string | null;
  amount: number;
  status: string | null;
  created_at: string | null;
  mpesa_reference: string | null;
}

function PocketPage() {
  const { user, loading: authLoading } = useAuth();
  const s = useAccountSummary();
  const [txs, setTxs] = useState<TxRow[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const money = useMoneyConfig({}, !!user);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("transactions")
        .select("id, type, amount, status, created_at, mpesa_reference")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);
      if (cancelled) return;
      setTxs((data as TxRow[]) ?? []);
      setLoadingTx(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, s.loading]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="page page-narrow enter">
      <header>
        <h1 className="t-title">Your Money</h1>
      </header>

      {/* Balance */}
      <div className="surface-raised rounded-2xl p-6">
        <div className="relative z-10">
          <p className="tx-2" style={{ fontSize: 12 }}>
            Wallet balance
          </p>
          {s.loading ? (
            <div className="skeleton h-9 w-48 mt-3 rounded-lg" />
          ) : (
            <h2 className="t-figure mt-2">
              <AnimatedNumber value={s.wallet} format={KES} />
            </h2>
          )}
          <p className="t-label mt-1">Available to invest or trade</p>

          {/* Status lines appear only when there is something to say (design D3). */}
          <div className="mt-2 space-y-1" aria-live="polite">
            {money.data?.paused.withdrawals && (
              <p className="t-label" style={{ color: "var(--warn)" }}>
                Withdrawals are paused for a moment. Your money is safe.
              </p>
            )}
            {(money.data?.pending.withdrawals_pending ?? 0) > 0 && (
              <p className="t-label">
                {KES(money.data!.pending.withdrawals_pending)} on its way to your M-Pesa. Usually
                within 24 hours.
              </p>
            )}
            {(money.data?.pending.deposits_pending ?? 0) > 0 && (
              <p className="t-label">
                {KES(money.data!.pending.deposits_pending)} deposit still being confirmed.
              </p>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowDeposit(true)}
              className="btn-primary flex items-center justify-center gap-1.5"
              style={{ padding: "13px 10px", fontSize: 12 }}
            >
              <ArrowDownLeft size={15} /> DEPOSIT
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              className="surface rounded-lg flex items-center justify-center gap-1.5 tx-accent border-none cursor-pointer"
              style={{ fontSize: 12, padding: "13px 10px" }}
            >
              <ArrowUpRight size={15} /> WITHDRAW
            </button>
          </div>
        </div>
      </div>

      {/* Allocation */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/pools" className="surface rounded-2xl p-4" style={{ textDecoration: "none" }}>
          <PiggyBank size={18} className="tx-2" />
          <p className="tx-2 mt-2" style={{ fontSize: 12 }}>
            IN POOLS
          </p>
          <p className="tx-1 mt-1" style={{ fontSize: 14 }}>
            {KES(s.poolsValue)}
          </p>
        </Link>
        <Link
          to="/portfolio"
          className="surface rounded-2xl p-4"
          style={{ textDecoration: "none" }}
        >
          <Receipt size={18} className="tx-2" />
          <p className="tx-2 mt-2" style={{ fontSize: 12 }}>
            In positions
          </p>
          <p className="tx-1 mt-1" style={{ fontSize: 14 }}>
            {KES(s.stocksInvested)}
          </p>
        </Link>
      </div>

      {/* Funding method */}
      <section className="surface rounded-2xl p-4">
        <p className="tx-2" style={{ fontSize: 12 }}>
          Funding method
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span
            className="flex items-center justify-center rounded-xl shrink-0"
            style={{
              width: 38,
              height: 38,
              color: "var(--gain)",
              background: "rgba(46,204,113,0.10)",
              border: "1px solid rgba(46,204,113,0.28)",
            }}
          >
            <Smartphone size={18} strokeWidth={1.7} />
          </span>
          <div className="min-w-0">
            <p className="tx-1" style={{ fontSize: 14 }}>
              M-Pesa STK Push
            </p>
            <p className="tx-3" style={{ fontSize: 12 }}>
              Enter your phone number at deposit — no card required.
            </p>
          </div>
        </div>
      </section>

      {/* Recent activity */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="t-heading">Recent Activity</h2>
          <Link to="/history" className="tx-2" style={{ fontSize: 12, textDecoration: "none" }}>
            VIEW ALL ›
          </Link>
        </div>
        {loadingTx ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : txs.length === 0 ? (
          <div className="surface rounded-xl p-6 text-center">
            <p className="tx-1" style={{ fontSize: 14 }}>
              No money has moved yet.
            </p>
            <p className="tx-3 mt-1" style={{ fontSize: 12 }}>
              Your deposit and withdrawal activity will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {txs.map((tx) => {
              const isCredit = tx.type === "deposit";
              return (
                <div
                  key={tx.id}
                  className="surface rounded-xl p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="tx-1 truncate" style={{ fontSize: 13 }}>
                      {tx.type === "deposit"
                        ? "Deposit"
                        : tx.type === "invest"
                          ? "Investment"
                          : "Withdrawal"}
                    </p>
                    <p className="tx-3 mt-1" style={{ fontSize: 12 }}>
                      {tx.created_at ? new Date(tx.created_at).toLocaleString("en-KE") : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p style={{ fontSize: 13, color: isCredit ? "var(--gain)" : "var(--text-1)" }}>
                      {isCredit ? "+" : "−"}
                      {KES(Number(tx.amount))}
                    </p>
                    <StatusChip status={tx.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showDeposit && (
        <WalletDepositModal
          phone={s.phone}
          onClose={() => setShowDeposit(false)}
          onSuccess={s.refresh}
        />
      )}
      {showWithdraw && (
        <WithdrawModal
          wallet={s.wallet}
          phone={s.phone}
          holdings={s.poolHoldings}
          onClose={() => setShowWithdraw(false)}
          onSuccess={s.refresh}
        />
      )}
    </div>
  );
}
