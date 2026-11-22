import { Compass } from "lucide-react";

export function LoadingSplash() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-3"
      style={{ background: "var(--ink-1)" }}
      role="status"
    >
      <Compass size={32} strokeWidth={1.5} className="tx-2" />
      <p className="t-label">Loading</p>
    </div>
  );
}
