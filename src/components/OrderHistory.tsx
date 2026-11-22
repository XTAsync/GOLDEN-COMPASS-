import { useCallback, useEffect, useState } from "react";
import { sentence } from "@/lib/sentence";
import { supabase } from "@/integrations/supabase/client";
import { Receipt } from "lucide-react";

export interface OrderRow {
  id: string;
  symbol: string;
  exchange: string;
  side: string;
  quantity: number;
  price: number | null;
  status: string;
  broker_order_id: string | null;
  error_message: string | null;
  created_at: string;
}

export function statusColor(status: string) {
  if (status === "filled") return "var(--gain)";
  if (status === "failed" || status === "cancelled") return "var(--loss)";
  return "var(--warn)";
}

export function useOrders(userId?: string) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("orders")
      .select(
        "id, symbol, exchange, side, quantity, price, status, broker_order_id, error_message, created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    setOrders((data ?? []) as OrderRow[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void refresh();
  }, [userId, refresh]);

  return { orders, loading, refresh };
}

export function OrderList({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <div className="surface rounded-2xl p-6 text-center">
        <Receipt size={32} strokeWidth={1.5} className="tx-2 mx-auto mb-3" />
        <p className="tx-1" style={{ fontSize: 15 }}>
          No orders yet.
        </p>
        <p className="tx-3 mt-2" style={{ fontSize: 12 }}>
          Your buy and sell orders will be logged here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {orders.map((o) => (
        <div key={o.id} className="surface rounded-2xl p-4 flex items-center justify-between">
          <div style={{ minWidth: 0 }}>
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 999,
                  color: o.side === "buy" ? "var(--gain)" : "var(--loss)",
                  background: o.side === "buy" ? "var(--gain-soft)" : "var(--loss-soft)",
                }}
              >
                {sentence(o.side)}
              </span>
              <span className="tx-1" style={{ fontSize: 15 }}>
                {o.symbol}
              </span>
              <span className="tx-3" style={{ fontSize: 12 }}>
                {o.exchange}
              </span>
            </div>
            <p className="tx-3 mt-1" style={{ fontSize: 12 }}>
              {Number(o.quantity)} @ {o.price != null ? Number(o.price).toLocaleString() : "—"} ·{" "}
              {new Date(o.created_at).toLocaleString("en-KE")}
            </p>
            {o.error_message && (
              <p className="mt-1" style={{ fontSize: 12, color: "var(--loss)" }}>
                {o.error_message}
              </p>
            )}
          </div>
          <span
            className="shrink-0"
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 999,
              color: statusColor(o.status),
              background: `${statusColor(o.status)}1A`,
              border: `1px solid ${statusColor(o.status)}55`,
            }}
          >
            {sentence(o.status)}
          </span>
        </div>
      ))}
    </div>
  );
}
