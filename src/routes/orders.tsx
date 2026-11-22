import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { OrderList, useOrders } from "@/components/OrderHistory";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
      { title: "Order History — Golden Compass" },
      {
        name: "description",
        content:
          "Every buy and sell order placed from your Golden Compass account, with live status.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Order History — Golden Compass" },
      { property: "og:description", content: "Track the status of your stock orders." },
      { property: "og:url", content: "/orders" },
    ],
    links: [{ rel: "canonical", href: "/orders" }],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { orders, loading } = useOrders(user?.id);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="page page-narrow enter">
      <header>
        <h1 className="t-title">Order History</h1>
        <Link to="/trade" className="tx-2" style={{ fontSize: 12, textDecoration: "underline" }}>
          Place a new order →
        </Link>
      </header>

      {loading ? (
        <div className="skeleton h-24 w-full rounded-2xl" />
      ) : (
        <OrderList orders={orders} />
      )}
    </div>
  );
}
