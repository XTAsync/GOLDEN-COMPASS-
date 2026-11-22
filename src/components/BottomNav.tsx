import { Link, useLocation } from "@tanstack/react-router";
import {
  Home,
  LineChart,
  Compass,
  Wallet,
  LayoutGrid,
  CandlestickChart,
  PieChart,
  Layers,
  ScrollText,
  Receipt,
  Settings,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

type Item = { to: string; Icon: LucideIcon; label: string };

// Phone bottom bar: the five places people go most.
const TABS: Item[] = [
  { to: "/home", Icon: Home, label: "Home" },
  { to: "/markets", Icon: LineChart, label: "Markets" },
  { to: "/command", Icon: Compass, label: "Command" },
  { to: "/pocket", Icon: Wallet, label: "Pocket" },
  { to: "/quick", Icon: LayoutGrid, label: "Quick" },
];

// Desktop sidebar: everything, grouped.
const GROUPS: { label: string; items: Item[] }[] = [
  {
    label: "Overview",
    items: [
      { to: "/home", Icon: Home, label: "Home" },
      { to: "/command", Icon: Compass, label: "Command Center" },
    ],
  },
  {
    label: "Invest",
    items: [
      { to: "/markets", Icon: LineChart, label: "Markets" },
      { to: "/trade", Icon: CandlestickChart, label: "Trade" },
      { to: "/portfolio", Icon: PieChart, label: "Portfolio" },
      { to: "/pools", Icon: Layers, label: "Pools" },
    ],
  },
  {
    label: "Money",
    items: [
      { to: "/pocket", Icon: Wallet, label: "Pocket" },
      { to: "/history", Icon: ScrollText, label: "History" },
      { to: "/orders", Icon: Receipt, label: "Orders" },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/navigator", Icon: Compass, label: "Education assistant" },
      { to: "/account", Icon: Settings, label: "Account Centre" },
    ],
  },
];

function useActive() {
  const { pathname } = useLocation();
  return (to: string) => pathname === to || pathname.startsWith(`${to}/`);
}

export function BottomNav() {
  const isActive = useActive();
  return (
    <nav className="bottom-nav" aria-label="Main">
      {TABS.map(({ to, Icon, label }) => (
        <Link
          key={to}
          to={to}
          className="nav-link"
          aria-current={isActive(to) ? "page" : undefined}
        >
          <Icon size={20} strokeWidth={1.5} />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const isActive = useActive();
  const { isAdmin } = useUserRole();
  const groups = isAdmin
    ? [
        ...GROUPS,
        { label: "Admin", items: [{ to: "/admin", Icon: ShieldCheck, label: "Operations" }] },
      ]
    : GROUPS;
  return (
    <aside className="sidebar" aria-label="Main">
      <Link to="/home" className="sidebar-brand">
        <Compass size={22} strokeWidth={1.5} className="tx-2" />
        Golden Compass
      </Link>
      {groups.map((g) => (
        <div key={g.label} className="flex flex-col gap-0.5">
          <p className="sidebar-label">{g.label}</p>
          {g.items.map(({ to, Icon, label }) => (
            <Link
              key={to}
              to={to}
              className="nav-link"
              aria-current={isActive(to) ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={1.5} />
              {label}
            </Link>
          ))}
        </div>
      ))}
    </aside>
  );
}
