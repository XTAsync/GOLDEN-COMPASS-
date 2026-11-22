import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Send } from "lucide-react";

export const Route = createFileRoute("/navigator")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
      { title: "Education Assistant — Golden Compass" },
      {
        name: "description",
        content: "Golden Compass investing education assistant. No personal recommendations.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Education Assistant — Golden Compass" },
      {
        property: "og:description",
        content:
          "Ask investing questions and learn the concepts. Education only, no personal recommendations.",
      },
      { property: "og:url", content: "/navigator" },
    ],
    links: [{ rel: "canonical", href: "/navigator" }],
  }),
  component: NavigatorPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What does diversification mean?",
  "What is a market order?",
  "What is a candlestick chart?",
  "What are trading fees?",
];

function NavigatorPage() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  const send = async (text: string) => {
    if (!text.trim()) return;
    toast.info("Education assistant is temporarily unavailable while safety checks are upgraded.");
  };

  return (
    <div
      className="page page-narrow enter flex flex-col"
      style={{ minHeight: "calc(100dvh - 72px)" }}
    >
      <header className="mb-4">
        <h1 className="t-title">Education assistant</h1>
        <p className="tx-2 mt-1">Investing concepts only. No personal recommendations.</p>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ paddingBottom: 16 }}>
        {messages.length === 0 ? (
          <div style={{ paddingTop: 16 }}>
            <p className="tx-2">
              The education assistant is temporarily unavailable while safety checks are upgraded.
              You can still browse the topics below.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="surface tap44 p-3 text-left cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className="mb-3 flex"
              style={{ justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}
            >
              <div
                className={m.role === "user" ? "surface-raised" : "surface"}
                style={{ maxWidth: "85%", padding: "10px 14px", lineHeight: 1.5 }}
              >
                {m.role === "assistant" ? (
                  <div className="prose-navigator">
                    <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                    <p className="mt-3 t-label">
                      Education only. Not investment advice or a personal recommendation.
                    </p>
                  </div>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))
        )}
        {streaming && messages[messages.length - 1]?.role === "user" && (
          <p className="tx-3 t-label" role="status">
            Preparing an explanation…
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
        style={{ borderTop: "1px solid var(--hairline)", paddingTop: 12 }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={streaming}
          aria-label="Ask an education question"
          placeholder="Ask about an investing concept"
          className="field flex-1"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="btn-primary"
          aria-label="Send"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
