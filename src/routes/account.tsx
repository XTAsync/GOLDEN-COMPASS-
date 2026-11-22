import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useAccountSummary } from "@/hooks/useAccountSummary";
import {
  User,
  ShieldCheck,
  KeyRound,
  Bell,
  FileText,
  Lock,
  AlertTriangle,
  LogOut,
  ChevronRight,
  Shield,
  Landmark,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
      { title: "Account Centre — Golden Compass" },
      {
        name: "description",
        content:
          "Manage your Golden Compass profile, verification, security, password, notifications and privacy.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Account Centre — Golden Compass" },
      {
        property: "og:description",
        content: "Profile, security, notifications and privacy settings.",
      },
      { property: "og:url", content: "/account" },
    ],
    links: [{ rel: "canonical", href: "/account" }],
  }),
  component: AccountCentre,
});

type Row = { to: string; Icon: LucideIcon; label: string; hint?: string };

function Group({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="surface rounded-2xl overflow-hidden">
      <p className="tx-3 px-5 pt-4 pb-2" style={{ fontSize: 12 }}>
        {title}
      </p>
      {rows.map(({ to, Icon, label, hint }) => (
        <Link
          key={label}
          to={to}
          className="flex items-center gap-3 px-5 py-4 border-t"
          style={{ borderColor: "var(--hairline)", textDecoration: "none", minHeight: 56 }}
        >
          <Icon size={18} strokeWidth={1.7} className="tx-2 shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="tx-1 block" style={{ fontSize: 14 }}>
              {label}
            </span>
            {hint && (
              <span className="tx-3 block" style={{ fontSize: 12 }}>
                {hint}
              </span>
            )}
          </span>
          <ChevronRight size={16} className="tx-2 shrink-0" />
        </Link>
      ))}
    </section>
  );
}

function AccountCentre() {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const s = useAccountSummary();
  const navigate = useNavigate();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  const verified = s.kycStatus === "approved";

  return (
    <div className="page page-narrow enter">
      <header>
        <h1 className="t-title">Settings</h1>
      </header>

      <div className="surface-raised rounded-2xl p-5 flex items-center gap-4">
        <div
          className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center tx-accent shrink-0"
          style={{
            fontSize: 20,
            background: "var(--ink-3)",
            border: "1px solid var(--hairline-strong)",
          }}
        >
          {s.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="relative z-10 min-w-0">
          <p className="tx-1 truncate" style={{ fontSize: 16 }}>
            {s.fullName}
          </p>
          <p className="tx-3 truncate" style={{ fontSize: 12 }}>
            {user.email}
          </p>
          <p
            className="mt-1"
            style={{ fontSize: 12, color: verified ? "var(--gain)" : "var(--warn)" }}
          >
            {verified ? "Verified" : "Verification " + s.kycStatus.replace("_", " ")}
          </p>
        </div>
      </div>

      <Group
        title="PROFILE"
        rows={[
          {
            to: "/profile",
            Icon: User,
            label: "Account information",
            hint: "Name, phone, membership",
          },
          {
            to: "/kyc",
            Icon: ShieldCheck,
            label: "Identity verification",
            hint: verified ? "Completed" : "Required for withdrawals",
          },
          { to: "/trade", Icon: Landmark, label: "Linked brokerage accounts" },
        ]}
      />

      <Group
        title="Security"
        rows={[
          {
            to: "/forgot-password",
            Icon: KeyRound,
            label: "Change password",
            hint: "Reset via email link",
          },
          { to: "/profile", Icon: Lock, label: "Authentication", hint: "Sign-in & session" },
        ]}
      />

      <Group
        title="Preferences"
        rows={[{ to: "/trade", Icon: Bell, label: "Price alerts & notifications" }]}
      />

      <Group
        title="Privacy and legal"
        rows={[
          { to: "/legal/privacy", Icon: Lock, label: "Privacy Policy" },
          { to: "/legal/terms", Icon: FileText, label: "Terms of Service" },
          { to: "/legal/risk-disclosure", Icon: AlertTriangle, label: "Risk Disclosure" },
        ]}
      />

      {isAdmin && (
        <Group
          title="Administration"
          rows={[{ to: "/admin", Icon: Shield, label: "Admin Panel" }]}
        />
      )}

      <button
        onClick={async () => {
          await signOut();
          navigate({ to: "/login" });
        }}
        className="surface rounded-2xl flex items-center justify-center gap-2 border-none cursor-pointer"
        style={{
          padding: 15,
          color: "var(--loss)",
          fontSize: 12,
        }}
      >
        <LogOut size={16} /> SIGN OUT
      </button>
    </div>
  );
}
