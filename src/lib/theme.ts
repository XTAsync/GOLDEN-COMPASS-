import { useCallback, useEffect, useState } from "react";

export type ThemePref = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const KEY = "gc-theme";

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* storage can be blocked; fall back to the device setting */
  }
  return "system";
}

function resolve(pref: ThemePref): ResolvedTheme {
  if (pref !== "system") return pref;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function paint(theme: ResolvedTheme) {
  document.documentElement.setAttribute("data-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? "#f6f7f9" : "#0b0d14");
}

/**
 * Runs in <head> before first paint so the page never flashes the wrong theme.
 * Keep it in sync with readPref/resolve above.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem("${KEY}");if(p!=="light"&&p!=="dark")p="system";var t=p==="system"?(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):p;document.documentElement.setAttribute("data-theme",t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="light"?"#f6f7f9":"#0b0d14");}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

export function useTheme() {
  // Start from "system"/"dark" on the server and first client render so hydration matches,
  // then read the saved choice.
  const [pref, setPrefState] = useState<ThemePref>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("dark");

  useEffect(() => {
    const p = readPref();
    setPrefState(p);
    setResolved(resolve(p));
  }, []);

  // Follow the device while the choice is "system".
  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      const t = resolve("system");
      paint(t);
      setResolved(t);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  const setPref = useCallback((next: ThemePref) => {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* the choice still applies for this visit */
    }
    const t = resolve(next);
    paint(t);
    setPrefState(next);
    setResolved(t);
  }, []);

  return { pref, resolved, setPref };
}
