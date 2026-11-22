import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/AuthLayout";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { validatePassword } from "@/lib/password-policy";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
      { title: "Sign Up — Golden Compass" },
      {
        name: "description",
        content: "Create your Golden Compass account for market analysis and investing education.",
      },
      { property: "og:title", content: "Sign Up — Golden Compass" },
      { property: "og:description", content: "Create your Golden Compass investor account." },
      { property: "og:url", content: "/signup" },
    ],
    links: [{ rel: "canonical", href: "/signup" }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName || !email || !phone || !password) {
      setError("All fields are required");
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, fullName, phone);
      setSuccess(true);
      // Auto-confirm is enabled — user is signed in instantly. Go straight to home.
      setTimeout(() => navigate({ to: "/home" }), 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      footer={
        <p className="tx-2">
          Already have an account?{" "}
          <Link to="/login" className="tx-accent" style={{ textDecoration: "underline" }}>
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="field-wrap">
          <label htmlFor="su-name" className="field-label">
            Full name
          </label>
          <input
            id="su-name"
            autoComplete="name"
            type="text"
            className="field"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="field-wrap">
          <label htmlFor="su-email" className="field-label">
            Email
          </label>
          <input
            id="su-email"
            autoComplete="email"
            type="email"
            className="field"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field-wrap">
          <label htmlFor="su-phone" className="field-label">
            M-Pesa phone number
          </label>
          <input
            id="su-phone"
            autoComplete="tel"
            type="tel"
            className="field"
            placeholder="+254 7XX XXX XXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="field-wrap">
          <label htmlFor="su-password" className="field-label">
            Password
          </label>
          <input
            id="su-password"
            autoComplete="new-password"
            type="password"
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="t-label mt-2">At least 6 characters.</p>
        </div>
        {error && (
          <p className="money-error" role="alert">
            {error}
          </p>
        )}
        {success ? (
          <div className="text-center py-2" role="status">
            <p className="t-heading">Account created</p>
            <p className="t-label mt-1">Opening your account…</p>
          </div>
        ) : (
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <span className="btn-spinner" /> : "Create account"}
          </button>
        )}
      </form>
    </AuthLayout>
  );
}
