import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface BrokerageAccount {
  id: string;
  account_id: string;
  label: string;
  is_default: boolean;
  created_at: string;
}

/** Linked brokerage accounts — entered once, then reused for every trade. */
export function useBrokerageAccounts(userId?: string) {
  const [accounts, setAccounts] = useState<BrokerageAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("brokerage_accounts")
      .select("id, account_id, label, is_default, created_at")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });
    if (!error) {
      const rows = (data ?? []) as BrokerageAccount[];
      setAccounts(rows);
      setSelectedId((prev) =>
        prev && rows.some((r) => r.id === prev) ? prev : (rows[0]?.id ?? null),
      );
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const link = useCallback(
    async (accountId: string, label: string) => {
      if (!userId) return;
      const { error } = await supabase.from("brokerage_accounts").insert({
        user_id: userId,
        account_id: accountId.trim(),
        label: label.trim() || "Brokerage account",
        is_default: accounts.length === 0,
      });
      if (error) {
        toast.error(error.code === "23505" ? "That account is already linked" : error.message);
        return;
      }
      toast.success("Brokerage account linked");
      await refresh();
    },
    [userId, accounts.length, refresh],
  );

  const selected = accounts.find((a) => a.id === selectedId) ?? null;

  return { accounts, selected, selectedId, setSelectedId, loading, link, refresh };
}

const labelStyle: React.CSSProperties = {
  fontVariantNumeric: "tabular-nums",
  fontSize: 12,
  color: "var(--text-2)",
  marginBottom: 8,
  display: "block",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 12px",
  borderRadius: 10,
  border: "1px solid var(--hairline-strong)",
  background: "var(--ink-3)",
  color: "var(--text-1)",
  fontSize: 14,
  outline: "none",
};

/** One-time surface modal for linking a brokerage account. */
export function LinkAccountModal({
  open,
  onClose,
  onLink,
}: {
  open: boolean;
  onClose: () => void;
  onLink: (accountId: string, label: string) => Promise<void> | void;
}) {
  const [accountId, setAccountId] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setAccountId("");
      setLabel("");
    }
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (!accountId.trim()) {
      toast.error("Enter your brokerage account ID");
      return;
    }
    setSaving(true);
    try {
      await onLink(accountId, label);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.62)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Link brokerage account"
    >
      <div
        className="surface-raised w-full max-w-[430px] rounded-t-2xl md:rounded-2xl enter"
        style={{ padding: "20px 16px 28px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="tx-2" style={{ fontSize: 12 }}>
            Link brokerage account
          </p>
          <button
            onClick={onClose}
            className="tx-accent"
            style={{ fontSize: 22, background: "none", border: "none" }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="tx-3" style={{ fontSize: 12, marginBottom: 16 }}>
          Enter it once — we&apos;ll use it automatically for every future order.
        </p>

        <label style={labelStyle} htmlFor="brokerage-account-id">
          Account ID
        </label>
        <input
          id="brokerage-account-id"
          autoFocus
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          placeholder="acc_…"
          style={inputStyle}
        />

        <label style={{ ...labelStyle, marginTop: 12 }} htmlFor="brokerage-account-label">
          Label
        </label>
        <input
          id="brokerage-account-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Main account"
          style={inputStyle}
        />

        <button
          onClick={submit}
          disabled={saving}
          className="btn-primary"
          style={{
            marginTop: 16,
            width: "100%",
            padding: "12px 16px",
            fontSize: 12,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Linking…" : "Link account"}
        </button>
      </div>
    </div>
  );
}

/** Tappable chip row for switching between linked accounts. */
export function AccountChips({
  accounts,
  selectedId,
  onSelect,
  onAdd,
}: {
  accounts: BrokerageAccount[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {accounts.map((a) => {
        const active = a.id === selectedId;
        return (
          <button
            key={a.id}
            onClick={() => onSelect(a.id)}
            style={{
              flexShrink: 0,
              padding: "8px 12px",
              borderRadius: 999,
              border: `1px solid rgba(201,168,76,${active ? 0.55 : 0.2})`,
              background: active ? "var(--gold-soft)" : "var(--ink-3)",
              color: active ? "var(--text-1)" : "var(--text-2)",
              fontSize: 12,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {a.label} · {a.account_id}
          </button>
        );
      })}
      <button
        onClick={onAdd}
        style={{
          flexShrink: 0,
          padding: "8px 12px",
          borderRadius: 999,
          border: "1px dashed var(--hairline-strong)",
          background: "none",
          color: "var(--text-2)",
          fontSize: 12,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        + Add
      </button>
    </div>
  );
}
