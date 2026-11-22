import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { sentence } from "@/lib/sentence";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/admin/kyc")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
      { title: "KYC Queue — Admin" },
      {
        name: "description",
        content:
          "Review pending investor KYC submissions, approve or reject identity verification requests.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "KYC Queue — Admin" },
      { property: "og:description", content: "Internal admin queue for KYC review decisions." },
      { property: "og:url", content: "/admin/kyc" },
    ],
    links: [{ rel: "canonical", href: "/admin/kyc" }],
  }),
  component: AdminKycPage,
});

interface KycRow {
  id: string;
  user_id: string;
  national_id: string | null;
  date_of_birth: string | null;
  address: string | null;
  employment_status: string | null;
  annual_income_range: string | null;
  source_of_funds: string | null;
  status: string | null;
  created_at: string | null;
  review_notes: string | null;
}

function AdminKycPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [rows, setRows] = useState<KycRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { full_name: string }>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (roleLoading) return;
    if (!isAdmin) navigate({ to: "/home" });
  }, [isAdmin, roleLoading, navigate]);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("kyc_records").select("*").order("created_at", { ascending: false });
    if (filter === "pending") q = q.eq("status", "pending");
    const { data } = await q;
    const list = (data as KycRow[]) ?? [];
    setRows(list);
    const ids = Array.from(new Set(list.map((r) => r.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      const map: Record<string, { full_name: string }> = {};
      (profs ?? []).forEach((p) => (map[p.id] = { full_name: p.full_name }));
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, filter]);

  const review = async (row: KycRow, decision: "approved" | "rejected") => {
    setBusy(row.id);
    try {
      const notes = decision === "rejected" ? prompt("Rejection reason?") || "" : "";
      await supabase
        .from("kyc_records")
        .update({ status: decision, reviewed_by: user!.id, review_notes: notes })
        .eq("id", row.id);
      await supabase.from("profiles").update({ kyc_status: decision }).eq("id", row.user_id);
      await supabase.from("audit_logs").insert({
        action: `kyc_${decision}`,
        actor_email: user!.email,
        entity_type: "kyc_record",
        entity_id: row.id,
        metadata: { user_id: row.user_id, notes },
      });
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="page page-narrow enter">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="t-title">KYC Submissions</h1>
        </div>
        <Link to="/admin" className="tx-3" style={{ fontSize: 12, textDecoration: "none" }}>
          ← Back
        </Link>
      </header>

      <div className="flex gap-2">
        {(["pending", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              fontSize: 12,
              padding: "8px 16px",
              borderRadius: 999,
              border: filter === f ? "1px solid var(--gold)" : "1px solid var(--hairline)",
              background: filter === f ? "var(--gold-soft)" : "transparent",
              color: filter === f ? "var(--gold)" : "var(--text-1)",
              cursor: "pointer",
            }}
          >
            {sentence(f)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="surface rounded-xl p-8 text-center">
          <p className="tx-1" style={{ fontSize: 14 }}>
            Queue empty.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="surface rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="tx-1" style={{ fontSize: 14 }}>
                    {profiles[r.user_id]?.full_name || "—"}
                  </p>
                  <p className="tx-3 mt-1" style={{ fontSize: 12 }}>
                    {r.created_at ? new Date(r.created_at).toLocaleString("en-KE") : ""}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    padding: "4px 12px",
                    borderRadius: 999,
                    background:
                      r.status === "approved"
                        ? "rgba(46,204,113,0.15)"
                        : r.status === "rejected"
                          ? "rgba(231,76,60,0.15)"
                          : "rgba(52,152,219,0.15)",
                    color:
                      r.status === "approved"
                        ? "var(--gain)"
                        : r.status === "rejected"
                          ? "var(--loss)"
                          : "var(--info)",
                  }}
                >
                  {sentence(r.status)}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 tx-2" style={{ fontSize: 12 }}>
                <div>
                  ID: <span className="tx-1">{r.national_id}</span>
                </div>
                <div>
                  DOB: <span className="tx-1">{r.date_of_birth}</span>
                </div>
                <div className="col-span-2">
                  Address: <span className="tx-1">{r.address}</span>
                </div>
                <div>
                  Employment: <span className="tx-1">{r.employment_status}</span>
                </div>
                <div>
                  Income: <span className="tx-1">{r.annual_income_range}</span>
                </div>
                <div>
                  Source: <span className="tx-1">{r.source_of_funds}</span>
                </div>
              </div>

              {r.review_notes && (
                <p className="tx-3 mt-2" style={{ fontSize: 12 }}>
                  Notes: {r.review_notes}
                </p>
              )}

              {r.status === "pending" && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => review(r, "approved")}
                    disabled={busy === r.id}
                    className="btn-primary"
                    style={{ padding: "12px", fontSize: 12 }}
                  >
                    <Check size={14} className="inline -mt-0.5 mr-1.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => review(r, "rejected")}
                    disabled={busy === r.id}
                    style={{
                      padding: "12px",
                      fontSize: 12,
                      borderRadius: 10,
                      border: "1px solid rgba(231,76,60,0.5)",
                      background: "rgba(231,76,60,0.1)",
                      color: "var(--loss)",
                      cursor: "pointer",
                    }}
                  >
                    <X size={14} className="inline -mt-0.5 mr-1.5" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
