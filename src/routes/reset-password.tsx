import { AuthLayout } from "@/components/AuthLayout";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { validatePassword } from "@/lib/password-policy";
import { CircleCheck, TriangleAlert } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
      { title: "Set a New Password — Golden Compass" },
      {
        name: "description",
        content: "Choose a new password for your Golden Compass investor account.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Set a New Password — Golden Compass" },
      { property: "og:description", content: "Choose a new password for your account." },
      { property: "og:url", content: "/reset-password" },
    ],
    links: [{ rel: "canonical", href: "/reset-password" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [linkValid, setLinkValid] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const hash = window.location.hash ?? "";
    const isRecovery = hash.includes("type=recovery") || hash.includes("access_token");

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setLinkValid(true);
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setLinkValid(Boolean(data.session) || isRecovery);
      setReady(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const passwordError = validatePassword(password);
    if (passwordError) return setError(passwordError);
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) return setError(err.message);
    setDone(true);
    setTimeout(() => navigate({ to: "/home" }), 1400);
  };

  return (
    <AuthLayout title="Set a new password">
      {!ready ? (
        <div className="skeleton h-40 w-full" />
      ) : done ? (
        <div className="surface p-6 text-center" role="status">
          <CircleCheck size={32} strokeWidth={1.5} className="tx-gain mx-auto mb-3" />
          <p className="t-heading">Password updated</p>
        </div>
      ) : !linkValid ? (
        <div className="surface p-6 text-center" role="alert">
          <TriangleAlert size={32} strokeWidth={1.5} className="tx-2 mx-auto mb-3" />
          <p className="t-heading">This reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="btn-primary mt-4">
            Request a new link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="field-wrap">
            <label htmlFor="rp-new" className="field-label">
              New password
            </label>
            <input
              id="rp-new"
              autoComplete="new-password"
              type="password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="field-wrap">
            <label htmlFor="rp-confirm" className="field-label">
              Confirm password
            </label>
            <input
              id="rp-confirm"
              autoComplete="new-password"
              type="password"
              className="field"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && (
            <p className="money-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <span className="btn-spinner" /> : "Update password"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
