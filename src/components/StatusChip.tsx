// One status chip for money rows (design D14): readable text, never colour alone, no emoji.
const MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "var(--warn)" },
  processing: { label: "Paying out", color: "var(--warn)" },
  confirmed: { label: "Done", color: "var(--gain)" },
  failed: { label: "Failed", color: "var(--loss)" },
  cancelled: { label: "Cancelled", color: "var(--loss)" },
  held_for_review: { label: "Under review", color: "var(--info)" },
};

export function StatusChip({ status }: { status: string | null | undefined }) {
  const s = MAP[status ?? "pending"] ?? {
    label: String(status ?? "Pending"),
    color: "var(--text-2)",
  };
  return (
    <span className="t-status inline-flex items-center gap-1.5" style={{ color: s.color }}>
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          background: s.color,
          display: "inline-block",
        }}
      />
      {s.label}
    </span>
  );
}
