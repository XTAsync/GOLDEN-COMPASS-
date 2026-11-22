import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import {
  ClipboardList,
  FileText,
  Lock,
  LogOut,
  Receipt,
  ScrollText,
  TriangleAlert,
} from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
      { title: "Profile — Golden Compass" },
      {
        name: "description",
        content:
          "Manage your Golden Compass account, KYC verification status and personal settings.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Profile — Golden Compass" },
      { property: "og:description", content: "Your account, KYC status and settings." },
      { property: "og:url", content: "/profile" },
    ],
    links: [{ rel: "canonical", href: "/profile" }],
  }),
  component: ProfilePage,
});

interface Profile {
  full_name: string;
  phone: string | null;
  kyc_status: string;
  created_at: string;
}

function ProfilePage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, kyc_status, created_at")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setProfile(data as Profile | null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const kycBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      not_started: { color: "var(--warn)", label: "NOT STARTED" },
      pending: { color: "var(--info)", label: "UNDER REVIEW" },
      approved: { color: "var(--gain)", label: "VERIFIED" },
      rejected: { color: "var(--loss)", label: "REJECTED" },
    };
    const v = map[status] ?? map.not_started;
    return (
      <span
        className="inline-flex items-center"
        style={{
          fontSize: 12,
          color: v.color,
          padding: "4px 10px",
          borderRadius: 999,
          background: `${v.color}1A`,
          border: `1px solid ${v.color}55`,
        }}
      >
        {v.label}
      </span>
    );
  };

  return (
    <div className="page page-narrow enter">
      <header>
        <p className="tx-2" style={{ fontSize: 12 }}>
          ACCOUNT
        </p>
        <h1 className="t-title">Profile</h1>
      </header>

      {loading ? (
        <>
          <div className="skeleton h-32 w-full rounded-2xl" />
          <div className="skeleton h-24 w-full rounded-2xl" />
        </>
      ) : (
        <>
          <div className="surface-raised rounded-2xl p-5 text-center">
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center tx-accent"
              style={{
                fontSize: 22,
                background: "var(--ink-3)",
                border: "1px solid var(--hairline-strong)",
              }}
            >
              {(profile?.full_name || "?").charAt(0).toUpperCase()}
            </div>
            <h2 className="tx-1 mt-3" style={{ fontSize: 18 }}>
              {profile?.full_name || "Investor"}
            </h2>
            <p className="tx-3 mt-1" style={{ fontSize: 12 }}>
              {user?.email}
            </p>
            {profile?.phone && (
              <p className="tx-2 mt-1" style={{ fontSize: 12 }}>
                {profile.phone}
              </p>
            )}
            <div className="mt-4 flex items-center justify-center gap-2">
              {kycBadge(profile?.kyc_status ?? "not_started")}
              {isAdmin && (
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--gold)",
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "var(--gold-soft)",
                    border: "1px solid var(--hairline-strong)",
                  }}
                >
                  ADMIN
                </span>
              )}
            </div>
          </div>

          <div className="surface rounded-2xl overflow-hidden">
            {profile?.kyc_status !== "approved" && (
              <Link
                to="/kyc"
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: "var(--hairline)", textDecoration: "none" }}
              >
                <span className="tx-1" style={{ fontSize: 14 }}>
                  <ClipboardList size={14} className="inline -mt-0.5 mr-2 tx-2" />
                  Complete KYC
                </span>
                <span className="tx-accent" style={{ fontSize: 14 }}>
                  ›
                </span>
              </Link>
            )}
            <Link
              to="/portfolio"
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "var(--hairline)", textDecoration: "none" }}
            >
              <span className="tx-1" style={{ fontSize: 14 }}>
                Portfolio
              </span>
              <span className="tx-accent" style={{ fontSize: 14 }}>
                ›
              </span>
            </Link>
            <Link
              to="/orders"
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "var(--hairline)", textDecoration: "none" }}
            >
              <span className="tx-1" style={{ fontSize: 14 }}>
                <Receipt size={14} className="inline -mt-0.5 mr-2 tx-2" />
                Order History
              </span>
              <span className="tx-accent" style={{ fontSize: 14 }}>
                ›
              </span>
            </Link>
            <Link
              to="/history"
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "var(--hairline)", textDecoration: "none" }}
            >
              <span className="tx-1" style={{ fontSize: 14 }}>
                <ScrollText size={14} className="inline -mt-0.5 mr-2 tx-2" />
                Transaction History
              </span>
              <span className="tx-accent" style={{ fontSize: 14 }}>
                ›
              </span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: "var(--hairline)", textDecoration: "none" }}
              >
                <span className="tx-accent" style={{ fontSize: 14 }}>
                  Admin Panel
                </span>
                <span className="tx-accent" style={{ fontSize: 14 }}>
                  ›
                </span>
              </Link>
            )}
            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/login" });
              }}
              className="w-full flex items-center justify-between px-5 py-4 bg-transparent border-none cursor-pointer"
            >
              <span style={{ fontSize: 14, color: "var(--loss)" }}>
                <LogOut size={14} className="inline -mt-0.5 mr-2" />
                Sign Out
              </span>
            </button>
          </div>

          <div className="surface rounded-2xl overflow-hidden">
            <p className="tx-3 px-5 pt-4 pb-2" style={{ fontSize: 12 }}>
              LEGAL
            </p>
            {(
              [
                ["/legal/terms", FileText, "Terms of Service"],
                ["/legal/privacy", Lock, "Privacy Policy"],
                ["/legal/risk-disclosure", TriangleAlert, "Risk Disclosure"],
              ] as const
            ).map(([to, Icon, label]) => (
              <Link
                key={to}
                to={to}
                className="flex items-center justify-between px-5 py-4 border-t"
                style={{ borderColor: "var(--hairline)", textDecoration: "none" }}
              >
                <span className="tx-1" style={{ fontSize: 14 }}>
                  <Icon size={14} className="inline -mt-0.5 mr-2 tx-2" />
                  {label}
                </span>
                <span className="tx-accent" style={{ fontSize: 14 }}>
                  ›
                </span>
              </Link>
            ))}
          </div>

          <p className="tx-3 text-center" style={{ fontSize: 12 }}>
            MEMBER SINCE {profile?.created_at ? new Date(profile.created_at).getFullYear() : "—"}
          </p>
        </>
      )}
    </div>
  );
}
