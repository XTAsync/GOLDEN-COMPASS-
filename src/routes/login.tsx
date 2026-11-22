import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/AuthLayout";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Check } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
      { title: "Sign In — Golden Compass" },
      {
        name: "description",
        content: "Sign in to Golden Compass for market analysis and demo investing.",
      },
      { property: "og:title", content: "Sign In — Golden Compass" },
      { property: "og:description", content: "Access your Golden Compass markets and account." },
      { property: "og:url", content: "/login" },
    ],
    links: [{ rel: "canonical", href: "/login" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [shakeField, setShakeField] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setShakeField("email");
      setTimeout(() => setShakeField(null), 500);
      return;
    }
    if (!password) {
      setShakeField("password");
      setTimeout(() => setShakeField(null), 500);
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      setSuccess(true);
      setTimeout(() => navigate({ to: "/home" }), 600);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      footer={
        <p className="tx-2">
          New to Golden Compass?{" "}
          <Link to="/signup" className="tx-accent" style={{ textDecoration: "underline" }}>
            Create account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="field-wrap">
          <label htmlFor="login-email" className="field-label">
            Email
          </label>
          <input
            id="login-email"
            autoComplete="email"
            type="email"
            className={`field ${shakeField === "email" ? "shake" : ""}`}
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field-wrap">
          <label htmlFor="login-password" className="field-label">
            Password
          </label>
          <input
            id="login-password"
            autoComplete="current-password"
            type="password"
            className={`field ${shakeField === "password" ? "shake" : ""}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p className="money-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading || success} className="btn-primary w-full">
          {success ? <Check size={18} /> : loading ? <span className="btn-spinner" /> : "Sign in"}
        </button>
        <p className="text-center">
          <Link to="/forgot-password" className="tx-2" style={{ textDecoration: "underline" }}>
            Forgot password?
          </Link>
        </p>
      </form>
      <p className="tx-3 text-center mt-6 t-label">
        By continuing you agree to the Terms and Privacy Policy.
      </p>
    </AuthLayout>
  );
}
