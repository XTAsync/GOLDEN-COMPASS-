import type { ReactNode } from "react";
import { CompassEmblem } from "@/components/CompassEmblem";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="auth">
      <aside className="auth-brand">
        <div className="flex items-center gap-3">
          <CompassEmblem size={40} />
          <span className="t-title" style={{ fontSize: 22 }}>
            Golden Compass
          </span>
        </div>
        <div style={{ maxWidth: 420 }}>
          <p className="t-title" style={{ fontSize: 36 }}>
            Markets, education and demo investing for Kenya.
          </p>
          <p className="tx-2 mt-4">
            Follow the NSE and global markets, practise with virtual orders, and learn how pools
            work.
          </p>
        </div>
        <p className="t-label">Educational tool. No real orders are placed in demo mode.</p>
      </aside>
      <main className="auth-panel">
        <div className="auth-card enter">
          <div className="auth-mark">
            <CompassEmblem size={36} />
            <span className="t-title" style={{ fontSize: 20 }}>
              Golden Compass
            </span>
          </div>
          <h1 className="t-title">{title}</h1>
          {subtitle && <p className="tx-2 mt-2">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-center">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
