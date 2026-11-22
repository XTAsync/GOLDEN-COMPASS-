import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

export function LegalPage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="page page-narrow enter">
      <header>
        <p className="tx-2" style={{ fontSize: 12 }}>
          {eyebrow}
        </p>
        <h1 className="t-title">{title}</h1>
        <p className="tx-3 mt-1" style={{ fontSize: 12 }}>
          LAST UPDATED {updated}
        </p>
      </header>

      <div
        className="rounded-2xl px-4 py-3"
        style={{
          background: "var(--warn-soft)",
          border: "1px solid var(--warn-line)",
        }}
      >
        <p style={{ fontSize: 12, color: "var(--gold-text)" }}>
          <TriangleAlert size={12} className="inline -mt-0.5 mr-1.5" />
          Draft — pending legal review
        </p>
        <p className="tx-2 mt-1" style={{ fontSize: 12, lineHeight: 1.5 }}>
          This document is a working draft prepared for product development only. It has not been
          reviewed or approved by a qualified Kenyan advocate and is not yet a binding agreement.
        </p>
      </div>

      <article className="surface rounded-2xl p-5 legal-body">{children}</article>

      <nav className="flex flex-wrap gap-2">
        <LegalLink to="/legal/terms" label="Terms" />
        <LegalLink to="/legal/privacy" label="Privacy" />
        <LegalLink to="/legal/risk-disclosure" label="Risk Disclosure" />
      </nav>
    </div>
  );
}

function LegalLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="surface rounded-full"
      style={{
        fontSize: 12,
        padding: "8px 16px",
        color: "var(--gold-text)",
        textDecoration: "none",
      }}
    >
      {label}
    </Link>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h2 className="tx-1" style={{ fontSize: 15, marginBottom: 8 }}>
        {heading}
      </h2>
      <div className="tx-2" style={{ fontSize: 13, lineHeight: 1.65 }}>
        {children}
      </div>
    </section>
  );
}
