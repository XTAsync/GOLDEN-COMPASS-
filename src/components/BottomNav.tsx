import { Link, useLocation } from "@tanstack/react-router";
import { Home, LineChart, Compass, Wallet, LayoutGrid } from "lucide-react";

const tabs = [
  { to: "/home", Icon: Home, label: "Home" },
  { to: "/markets", Icon: LineChart, label: "Market" },
  { to: "/command", Icon: Compass, label: "Command", center: true },
  { to: "/pocket", Icon: Wallet, label: "Pocket" },
  { to: "/quick", Icon: LayoutGrid, label: "Quick" },
] as const;

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="flex shrink-0 relative z-10 items-end"
      style={{
        padding: "6px 8px 22px",
        background: "rgba(7,12,22,0.88)",
        backdropFilter: "blur(36px) saturate(180%)",
        WebkitBackdropFilter: "blur(36px) saturate(180%)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <div
        className="absolute top-0 left-[15%] right-[15%] h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(201,168,76,0.25), transparent)",
        }}
      />
      {tabs.map(({ to, Icon, label, ...rest }) => {
        const center = "center" in rest && rest.center;
        const active = location.pathname === to;

        if (center) {
          return (
            <Link
              key={to}
              to={to}
              aria-label="Command Center"
              className="flex-1 flex flex-col items-center justify-end gap-1 relative"
              style={{ textDecoration: "none", paddingBottom: 6 }}
            >
              <span
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 54,
                  height: 54,
                  marginTop: -22,
                  color: "#2A1600",
                  background:
                    "linear-gradient(160deg, var(--gold-200), var(--gold-400) 55%, var(--gold-600))",
                  border: "1px solid rgba(255,224,130,0.65)",
                  boxShadow: active
                    ? "0 0 0 4px rgba(201,168,76,0.16), 0 10px 26px rgba(201,168,76,0.35)"
                    : "0 8px 20px rgba(0,0,0,0.55)",
                  transition: "box-shadow 0.25s ease, transform 0.2s ease",
                  transform: active ? "translateY(-2px)" : undefined,
                }}
              >
                <Icon size={24} strokeWidth={1.8} />
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: active ? "var(--gold-300)" : "rgba(200,175,130,0.45)",
                }}
              >
                {label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 relative"
            style={{
              padding: "10px 4px 8px",
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: active ? "var(--gold-300)" : "rgba(200,175,130,0.38)",
              borderRadius: 16,
              background: active
                ? "linear-gradient(180deg, rgba(201,168,76,0.10), rgba(201,168,76,0.03))"
                : "transparent",
              transition: "color 0.2s ease, background 0.2s ease",
              textDecoration: "none",
            }}
          >
            {active && (
              <span
                className="absolute top-0 left-1/4 right-1/4 h-0.5"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, var(--gold-300), transparent)",
                  borderRadius: "0 0 2px 2px",
                  boxShadow: "0 0 8px rgba(201,168,76,0.5)",
                }}
              />
            )}
            <Icon size={20} strokeWidth={1.7} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
