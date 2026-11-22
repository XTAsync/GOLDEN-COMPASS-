import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme, type ThemePref } from "@/lib/theme";

const OPTIONS: { value: ThemePref; label: string; Icon: LucideIcon }[] = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

export function ThemeSwitch() {
  const { pref, setPref } = useTheme();
  return (
    <section className="surface rounded-2xl overflow-hidden">
      <p className="tx-3 px-5 pt-4 pb-2" id="theme-label" style={{ fontSize: 12 }}>
        Appearance
      </p>
      <div
        role="radiogroup"
        aria-labelledby="theme-label"
        className="grid grid-cols-3 gap-2 px-5 pb-5"
      >
        {OPTIONS.map(({ value, label, Icon }) => {
          const active = pref === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setPref(value)}
              className="tap44 flex items-center justify-center gap-2 cursor-pointer"
              style={{
                borderRadius: 10,
                border: `1px solid ${active ? "var(--gold-line)" : "var(--hairline-strong)"}`,
                background: active ? "var(--gold-soft)" : "var(--ink-3)",
                color: active ? "var(--text-1)" : "var(--text-2)",
                fontSize: 13,
                fontWeight: 500,
                transition: "background-color 160ms var(--ease), border-color 160ms var(--ease)",
              }}
            >
              <Icon size={16} strokeWidth={1.5} />
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
