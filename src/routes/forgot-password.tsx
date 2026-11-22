import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthLayout } from "@/components/AuthLayout";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, MailCheck } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
      { title: "Reset Your Password — Golden Compass" },
      {
        name: "description",
        content: "Request a secure password reset link for your Golden Compass investor account.",
      },
      { property: "og:title", content: "Reset Your Password — Golden Compass" },
      { property: "og:description", content: "Request a secure password reset link." },
      { property: "og:url", content: "/forgot-password" },
    ],
    links: [{ rel: "canonical", href: "/forgot-password" }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) return setError("Enter the email on your account.");
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) return setError(err.message);
    setSent(true);
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll send a reset link to your email."
      footer={
        <Link to="/login" className="tx-2" style={{ textDecoration: "underline" }}>
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="surface p-6 text-center" role="status">
          <MailCheck size={32} strokeWidth={1.5} className="tx-2 mx-auto mb-3" />
          <p className="t-heading">Check your inbox</p>
          <p className="t-label mt-2">It may take a minute. Check spam too.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="field-wrap">
            <label htmlFor="fp-email" className="field-label">
              Email
            </label>
            <input
              id="fp-email"
              autoComplete="email"
              type="email"
              className="field"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && (
            <p className="money-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <span className="btn-spinner" /> : "Send reset link"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
