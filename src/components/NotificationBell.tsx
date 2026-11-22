import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, Inbox } from "lucide-react";

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative cursor-pointer border-none bg-transparent"
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "var(--ink-3)",
          border: "1px solid var(--hairline-strong)",
          color: "var(--gold-text)",
          fontSize: 18,
        }}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            className="absolute"
            style={{
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              padding: "0 4px",
              borderRadius: 9,
              background: "var(--loss)",
              color: "#fff",
              fontSize: 12,
              fontVariantNumeric: "tabular-nums",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute z-50"
            style={{
              top: 48,
              right: 0,
              width: 320,
              maxHeight: 420,
              background: "var(--ink-2)",
              border: "1px solid var(--hairline-strong)",
              borderRadius: 14,
              boxShadow: "0 20px 60px var(--scrim)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{ padding: "12px 16px", borderBottom: "1px solid var(--hairline)" }}
            >
              <span className="tx-accent" style={{ fontSize: 12 }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="cursor-pointer border-none bg-transparent"
                  style={{ fontSize: 12, color: "var(--gold-text)" }}
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center" style={{ padding: 32 }}>
                  <Inbox size={28} strokeWidth={1.5} className="tx-2 mx-auto mb-2" />
                  <p className="tx-3" style={{ fontSize: 12 }}>
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => !n.read_at && markRead(n.id)}
                    className="w-full text-left cursor-pointer border-none block"
                    style={{
                      padding: "12px 16px",
                      background: n.read_at ? "transparent" : "var(--gold-soft)",
                      borderBottom: "1px solid var(--hairline)",
                      borderLeft: n.read_at
                        ? "2px solid transparent"
                        : "2px solid var(--gold-line)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="tx-1" style={{ fontSize: 13, lineHeight: 1.3 }}>
                        {n.title}
                      </span>
                      <span className="tx-3 shrink-0" style={{ fontSize: 12 }}>
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                    {n.body && (
                      <p className="tx-3 mt-1" style={{ fontSize: 12, lineHeight: 1.4 }}>
                        {n.body}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
