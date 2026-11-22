import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { searchSymbols, type SymbolEntry } from "@/lib/symbols";
import type { WatchlistItem } from "@/components/Watchlist";
import { Search, Star } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  watchlist: WatchlistItem[];
  onAdd: (symbol: string, exchange: string) => void | Promise<void>;
  onRemove: (id: string) => void | Promise<void>;
  /** When provided, selecting a result picks it for trading instead of navigating. */
  onPick?: (entry: SymbolEntry) => void;
}

/**
 * Global symbol search. Full-screen surface sheet on mobile, Cmd/Ctrl+K on desktop.
 * Filtering is client-side against the seeded directory in src/lib/symbols.ts.
 */
export function SearchDialog({ open, onClose, watchlist, onAdd, onRemove, onPick }: Props) {
  const navigate = useNavigate();
  const [raw, setRaw] = useState("");
  const [query, setQuery] = useState("");

  // Debounced filter input.
  useEffect(() => {
    const id = setTimeout(() => setQuery(raw), 160);
    return () => clearTimeout(id);
  }, [raw]);

  useEffect(() => {
    if (!open) setRaw("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(() => searchSymbols(query), [query]);
  const watched = useMemo(() => {
    const m = new Map<string, string>();
    for (const w of watchlist) m.set(`${w.symbol.toUpperCase()}|${w.exchange}`, w.id);
    return m;
  }, [watchlist]);

  if (!open) return null;

  const go = (s: SymbolEntry) => {
    onClose();
    if (onPick) {
      onPick(s);
      return;
    }
    void navigate({
      to: "/stock/$symbol",
      params: { symbol: s.symbol },
      search: { exchange: s.exchange },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ background: "rgba(0,0,0,0.62)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search symbols"
    >
      <div
        className="surface-raised w-full max-w-[430px] rounded-b-3xl enter flex flex-col"
        style={{ maxHeight: "88vh", padding: "20px 16px 16px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="tx-2" style={{ fontSize: 12 }}>
            Search markets
          </p>
          <button
            onClick={onClose}
            className="tx-accent"
            style={{ fontSize: 22 }}
            aria-label="Close search"
          >
            ×
          </button>
        </div>

        <input
          autoFocus
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="Symbol or company…"
          aria-label="Search by symbol or company name"
          className="w-full surface rounded-lg px-3 py-3 tx-1"
          style={{ fontSize: 15, outline: "none" }}
        />

        <p className="tx-3 mt-2" style={{ fontSize: 12 }}>
          {results.length} MATCH{results.length === 1 ? "" : "ES"} · NSE · NGX · JSE · GSE · GLOBAL
        </p>

        <div className="flex flex-col gap-2 mt-3 overflow-y-auto" style={{ paddingBottom: 8 }}>
          {results.length === 0 && (
            <p className="tx-3 text-center" style={{ fontSize: 13, padding: "20px 0" }}>
              No symbols match “{query}”.
            </p>
          )}
          {results.map((s) => {
            const wid = watched.get(`${s.symbol}|${s.exchange}`);
            return (
              <div
                key={`${s.symbol}-${s.exchange}`}
                className="flex items-center justify-between"
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid var(--hairline-strong)",
                  background: "var(--ink-3)",
                }}
              >
                <button
                  onClick={() => go(s)}
                  className="flex flex-col flex-1"
                  style={{
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <span className="tx-accent" style={{ fontSize: 14 }}>
                    {s.symbol}
                  </span>
                  <span className="tx-3" style={{ fontSize: 12 }}>
                    {s.name}
                  </span>
                </button>
                <span className="flex items-center gap-2">
                  <span className="tx-2" style={{ fontSize: 12 }}>
                    {s.exchange}
                  </span>
                  <button
                    onClick={() => (wid ? onRemove(wid) : onAdd(s.symbol, s.exchange))}
                    aria-label={
                      wid ? `Remove ${s.symbol} from watchlist` : `Add ${s.symbol} to watchlist`
                    }
                    className="tx-accent"
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: 16,
                      cursor: "pointer",
                      opacity: wid ? 1 : 0.45,
                    }}
                  >
                    <Star size={16} fill={wid ? "currentColor" : "none"} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Registers Cmd/Ctrl+K to open the search dialog. */
export function useSearchHotkey(onOpen: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpen]);
}

/** Compass-styled search trigger for page headers. */
export function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Search symbols"
      className="surface w-11 h-11 rounded-full flex items-center justify-center tx-accent"
      style={{ fontSize: 16, border: "none", cursor: "pointer" }}
    >
      <Search size={16} />
    </button>
  );
}
