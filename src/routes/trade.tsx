import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { OrderList, useOrders } from "@/components/OrderHistory";
import { Watchlist, useWatchlist, type WatchlistItem } from "@/components/Watchlist";
import { SearchDialog, SearchButton, useSearchHotkey } from "@/components/SearchDialog";
import { AlertModal, AlertsPanel, usePriceAlerts } from "@/components/PriceAlerts";
import {
  AccountChips,
  LinkAccountModal,
  useBrokerageAccounts,
} from "@/components/BrokerageAccounts";
import { Sparkline } from "@/components/Sparkline";
import { useQuotes } from "@/lib/quote-client";
import { SYMBOLS, type SymbolEntry } from "@/lib/symbols";
import { Search, Star } from "lucide-react";

export const Route = createFileRoute("/trade")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
      { title: "Trade — Golden Compass" },
      {
        name: "description",
        content: "Buy and sell NSE and global stocks from your Golden Compass account.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Trade — Golden Compass" },
      {
        property: "og:description",
        content: "Place buy and sell orders on NSE Kenya and global markets.",
      },
      { property: "og:url", content: "/trade" },
    ],
    links: [{ rel: "canonical", href: "/trade" }],
  }),
  component: TradePage,
});

interface SelectedInstrument {
  symbol: string;
  name?: string;
  exchange: string;
}

const POPULAR_SYMBOLS: SymbolEntry[] = [
  "SCOM",
  "EQTY",
  "KCB",
  "EABL",
  "MTNN",
  "DANGCEM",
  "NPN",
  "MTNGH",
  "AAPL",
  "NVDA",
  "SPY",
]
  .map((s) => SYMBOLS.find((e) => e.symbol === s))
  .filter((e): e is SymbolEntry => Boolean(e));

const QTY_PRESETS = [1, 5, 10, 25];

function TradePage() {
  const { user, loading: authLoading } = useAuth();
  const [selected, setSelected] = useState<SelectedInstrument | null>(null);
  const [pickerOpen, setPickerOpen] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [placing, setPlacing] = useState<"buy" | "sell" | null>(null);
  const { orders, loading: ordersLoading, refresh: refreshOrders } = useOrders(user?.id);
  const {
    items: watchlist,
    loading: watchlistLoading,
    add: addToWatchlist,
    remove: removeFromWatchlist,
  } = useWatchlist(user?.id);
  const {
    alerts,
    loading: alertsLoading,
    create: createAlert,
    remove: removeAlert,
  } = usePriceAlerts(user?.id);
  const {
    accounts,
    selected: account,
    selectedId: accountId,
    setSelectedId: setAccountId,
    loading: accountsLoading,
    link: linkAccount,
  } = useBrokerageAccounts(user?.id);
  const [searchOpen, setSearchOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [alertTarget, setAlertTarget] = useState<{
    symbol: string;
    exchange: string;
    price?: number;
    currency?: string;
  } | null>(null);

  useSearchHotkey(useCallback(() => setSearchOpen(true), []));

  const quotePairs = useMemo(
    () => (selected ? [{ symbol: selected.symbol, exchange: selected.exchange }] : []),
    [selected],
  );
  const { quotes } = useQuotes(quotePairs, 20_000);
  const state = selected ? quotes[selected.symbol.toUpperCase()] : undefined;
  const quote = state?.quote;

  const pick = (instrument: SelectedInstrument) => {
    setSelected(instrument);
    setPickerOpen(false);
    setQuantity(1);
  };

  // Inline quick trade from a watchlist row — same endpoint as the main sheet.
  const quickTrade = async (item: WatchlistItem, side: "buy" | "sell", qty: number) => {
    if (!account) {
      toast.error("Link a brokerage account first");
      setLinkOpen(true);
      return;
    }
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not signed in");
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          symbol: item.symbol,
          side,
          quantity: qty,
          account_id: account.account_id,
          exchange: item.exchange,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Order failed");
      toast.success(`${side === "buy" ? "Buy" : "Sell"} order placed for ${qty} ${item.symbol}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Order failed");
    } finally {
      await refreshOrders();
    }
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const placeOrder = async (side: "buy" | "sell") => {
    if (!selected) return toast.error("Choose an instrument first");
    if (!account) {
      setLinkOpen(true);
      return toast.error("Link a brokerage account first");
    }
    if (!quantity || quantity <= 0) return toast.error("Quantity must be > 0");

    setPlacing(side);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not signed in");

      const res = await fetch("/api/trade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol: selected.symbol,
          side,
          quantity,
          account_id: account.account_id,
          exchange: selected.exchange,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Order failed");
      toast.success(
        `${side === "buy" ? "Buy" : "Sell"} order placed for ${quantity} ${selected.symbol}`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Order failed");
    } finally {
      setPlacing(null);
      await refreshOrders();
    }
  };

  const cardStyle: React.CSSProperties = {
    padding: 16,
    borderRadius: 16,
    border: "1px solid var(--hairline-strong)",
    background: "var(--ink-3)",
  };
  const labelStyle: React.CSSProperties = {
    fontVariantNumeric: "tabular-nums",
    fontSize: 12,
    color: "var(--text-2)",
    marginBottom: 8,
    display: "block",
  };

  const up = (quote?.change_pct ?? 0) >= 0;
  const trendColor = up ? "var(--gain)" : "var(--loss)";

  return (
    <div className="page enter flex flex-col">
      <header className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="t-title">Trade</h1>
              <p className="tx-2 mt-1">NSE Kenya and global markets</p>
            </div>
          </div>
          <SearchButton onClick={() => setSearchOpen(true)} />
        </div>
      </header>

      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        watchlist={watchlist}
        onAdd={addToWatchlist}
        onRemove={removeFromWatchlist}
        onPick={(s) => pick({ symbol: s.symbol, name: s.name, exchange: s.exchange })}
      />
      <AlertModal
        open={alertTarget !== null}
        symbol={alertTarget?.symbol ?? ""}
        exchange={alertTarget?.exchange ?? "NSE"}
        currentPrice={alertTarget?.price}
        currency={alertTarget?.currency}
        onClose={() => setAlertTarget(null)}
        onCreate={createAlert}
      />
      <LinkAccountModal open={linkOpen} onClose={() => setLinkOpen(false)} onLink={linkAccount} />

      <div className="flex flex-col gap-3">
        <p className="surface t-label" style={{ padding: "12px 16px", color: "var(--warn)" }}>
          Simulated trading. No real money is used.
        </p>

        {/* ── Symbol picker: tap, don't type ── */}
        {(!selected || pickerOpen) && (
          <div style={cardStyle}>
            <span style={labelStyle}>Popular instruments</span>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SYMBOLS.map((s) => (
                <button
                  key={`${s.symbol}-${s.exchange}`}
                  onClick={() => pick({ symbol: s.symbol, name: s.name, exchange: s.exchange })}
                  style={{
                    flexShrink: 0,
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "1px solid var(--hairline-strong)",
                    background: "var(--gold-soft)",
                    color: "var(--text-1)",
                    fontSize: 12,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.symbol}
                  <span className="tx-3" style={{ fontSize: 12, marginLeft: 8 }}>
                    {s.exchange}
                  </span>
                </button>
              ))}
            </div>

            <span style={{ ...labelStyle, marginTop: 16 }}>From your watchlist</span>
            {watchlistLoading ? (
              <div className="skeleton h-10 w-full rounded-xl" />
            ) : watchlist.length === 0 ? (
              <p className="tx-3" style={{ fontSize: 12 }}>
                Nothing saved yet — search to find an instrument.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {watchlist.map((w) => (
                  <button
                    key={w.id}
                    onClick={() =>
                      pick({ symbol: w.symbol, name: w.company ?? undefined, exchange: w.exchange })
                    }
                    className="flex items-center justify-between"
                    style={{
                      padding: "12px 12px",
                      borderRadius: 12,
                      border: "1px solid var(--hairline-strong)",
                      background: "var(--ink-3)",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span className="flex flex-col">
                      <span className="tx-accent" style={{ fontSize: 14 }}>
                        {w.symbol}
                      </span>
                      <span className="tx-3" style={{ fontSize: 12 }}>
                        {w.company ?? w.exchange}
                      </span>
                    </span>
                    <span className="tx-2" style={{ fontSize: 12 }}>
                      {w.exchange}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setSearchOpen(true)}
              className="btn-primary"
              style={{ marginTop: 16, width: "100%", padding: "12px 16px", fontSize: 12 }}
            >
              <Search size={14} className="inline -mt-0.5 mr-1.5" />
              Search all markets
            </button>
          </div>
        )}

        {/* ── Selected instrument header ── */}
        {selected && !pickerOpen && (
          <div style={cardStyle}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <span className="flex items-center gap-2">
                  <span className="tx-accent" style={{ fontSize: 18 }}>
                    {selected.symbol}
                  </span>
                  <span
                    className="tx-2"
                    style={{
                      fontSize: 12,
                      padding: "2px 8px",
                      borderRadius: 999,
                      border: "1px solid var(--hairline-strong)",
                    }}
                  >
                    {selected.exchange}
                  </span>
                </span>
                <span className="tx-3" style={{ fontSize: 12, marginTop: 2 }}>
                  {selected.name ?? "—"}
                </span>
              </div>
              <button
                onClick={() => setPickerOpen(true)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid var(--hairline-strong)",
                  background: "var(--gold-soft)",
                  color: "var(--text-1)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Change
              </button>
            </div>

            <div className="flex items-end justify-between gap-3" style={{ marginTop: 12 }}>
              <div className="flex flex-col">
                <span className="tx-1" style={{ fontSize: 22 }}>
                  {quote
                    ? `${quote.currency} ${quote.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                    : "—"}
                </span>
                <span style={{ fontSize: 12, color: trendColor }}>
                  {quote ? `${up ? "+" : ""}${quote.change_pct.toFixed(2)}%` : "Fetching…"}
                </span>
              </div>
              <div style={{ opacity: 0.9 }}>
                {state && state.history.length > 1 && (
                  <Sparkline data={state.history} width={110} height={32} color={trendColor} />
                )}
              </div>
            </div>

            {quote && (
              <div className="flex items-center gap-2" style={{ marginTop: 12 }}>
                <span
                  title={quote.fallback_reason ?? undefined}
                  style={{
                    fontSize: 12,
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: `1px solid ${quote.simulated ? "var(--warn)" : "var(--gain)"}`,
                    background: "transparent",
                    color: quote.simulated ? "var(--warn)" : "var(--gain)",
                  }}
                >
                  {quote.simulated ? "Simulated" : "Live"}
                </span>
                <span className="tx-3" style={{ fontSize: 12 }}>
                  {quote.source}
                  {quote.sandbox ? " · SANDBOX" : ""}
                </span>
                <button
                  onClick={() => addToWatchlist(selected.symbol, selected.exchange)}
                  className="tx-accent"
                  style={{
                    marginLeft: "auto",
                    background: "none",
                    border: "none",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  <Star size={14} className="inline -mt-0.5 mr-1.5" />
                  Watch
                </button>
              </div>
            )}
            {quote?.fallback_reason && (
              <p style={{ marginTop: 8, fontSize: 12, color: "var(--warn)" }}>
                Live data unavailable — showing simulated prices.
              </p>
            )}
            {quote?.stale_reason && (
              <p style={{ marginTop: 8, fontSize: 12, color: "var(--warn)" }}>
                Live tick rejected ({quote.stale_reason}) — showing simulated price.
              </p>
            )}
          </div>
        )}

        {/* ── Order sheet ── */}
        {selected && !pickerOpen && (
          <div style={cardStyle}>
            <span style={labelStyle}>Brokerage account</span>
            {accountsLoading ? (
              <div className="skeleton h-8 w-full rounded-xl" />
            ) : accounts.length === 0 ? (
              <p className="tx-3" style={{ fontSize: 12 }}>
                No account linked yet.
              </p>
            ) : (
              <AccountChips
                accounts={accounts}
                selectedId={accountId}
                onSelect={setAccountId}
                onAdd={() => setLinkOpen(true)}
              />
            )}

            <span style={{ ...labelStyle, marginTop: 16 }}>Quantity</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="tx-accent"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: "1px solid var(--hairline-strong)",
                  background: "var(--ink-3)",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                −
              </button>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                aria-label="Quantity"
                style={{
                  width: 72,
                  textAlign: "center",
                  padding: "8px 8px",
                  borderRadius: 10,
                  border: "1px solid var(--hairline-strong)",
                  background: "var(--ink-3)",
                  color: "var(--text-1)",
                  fontVariantNumeric: "tabular-nums",
                  fontSize: 14,
                  outline: "none",
                }}
              />
              <button
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
                className="tx-accent"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: "1px solid var(--hairline-strong)",
                  background: "var(--ink-3)",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                +
              </button>
              <div className="flex gap-2" style={{ marginLeft: "auto" }}>
                {QTY_PRESETS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuantity(n)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 999,
                      border: `1px solid rgba(201,168,76,${quantity === n ? 0.55 : 0.2})`,
                      background: quantity === n ? "var(--gold-soft)" : "var(--ink-3)",
                      color: quantity === n ? "var(--text-1)" : "var(--text-2)",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {quote && (
              <p className="tx-3" style={{ marginTop: 12, fontSize: 12 }}>
                Est. total: {quote.currency}{" "}
                {(quote.price * quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            )}

            {accounts.length === 0 ? (
              <button
                onClick={() => setLinkOpen(true)}
                className="btn-primary"
                style={{ marginTop: 16, width: "100%" }}
              >
                Link brokerage account
              </button>
            ) : (
              <div className="flex gap-2" style={{ marginTop: 16 }}>
                <button
                  onClick={() => placeOrder("buy")}
                  disabled={placing !== null}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid rgba(120,200,140,0.4)",
                    background: "rgba(76,195,138,0.14)",
                    color: "rgb(180,235,195)",
                    fontVariantNumeric: "tabular-nums",
                    fontSize: 12,
                    cursor: placing ? "wait" : "pointer",
                    opacity: placing && placing !== "buy" ? 0.5 : 1,
                  }}
                >
                  {placing === "buy" ? "Placing…" : "Buy"}
                </button>
                <button
                  onClick={() => placeOrder("sell")}
                  disabled={placing !== null}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid rgba(220,120,120,0.4)",
                    background: "rgba(229,72,77,0.14)",
                    color: "rgb(245,190,190)",
                    fontVariantNumeric: "tabular-nums",
                    fontSize: 12,
                    cursor: placing ? "wait" : "pointer",
                    opacity: placing && placing !== "sell" ? 0.5 : 1,
                  }}
                >
                  {placing === "sell" ? "Placing…" : "Sell"}
                </button>
              </div>
            )}
          </div>
        )}

        <section className="flex flex-col gap-2" style={{ marginTop: 8 }}>
          <h2 className="tx-2" style={{ fontSize: 12 }}>
            Watchlist
          </h2>
          <Watchlist
            items={watchlist}
            loading={watchlistLoading}
            onSelect={(it) =>
              pick({ symbol: it.symbol, name: it.company ?? undefined, exchange: it.exchange })
            }
            onRemove={removeFromWatchlist}
            onAlert={(it, price, currency) =>
              setAlertTarget({ symbol: it.symbol, exchange: it.exchange, price, currency })
            }
            onTrade={quickTrade}
          />

          <h2 className="tx-2" style={{ fontSize: 12, marginTop: 8 }}>
            Price alerts
          </h2>
          <AlertsPanel alerts={alerts} loading={alertsLoading} onRemove={removeAlert} />
        </section>

        <section className="flex flex-col gap-2" style={{ marginTop: 8 }}>
          <div className="flex items-baseline justify-between">
            <h2 className="tx-2" style={{ fontSize: 12 }}>
              Recent orders
            </h2>
            <Link
              to="/orders"
              className="tx-2"
              style={{ fontSize: 12, textDecoration: "underline" }}
            >
              View all →
            </Link>
          </div>
          {ordersLoading ? (
            <div className="skeleton h-20 w-full rounded-2xl" />
          ) : (
            <OrderList orders={orders.slice(0, 5)} />
          )}
        </section>
      </div>
    </div>
  );
}
