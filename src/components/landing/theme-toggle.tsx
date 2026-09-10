"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "opx-theme";

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => unknown;
};

/* the <html> class is the single source of truth; observe it */
function subscribe(onChange: () => void) {
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => obs.disconnect();
}
const getSnapshot = () => document.documentElement.classList.contains("dark");
const getServerSnapshot = () => false;

export function ThemeToggle({ className = "" }: { className?: string }) {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    const root = document.documentElement;
    const apply = () => root.classList.toggle("dark", next);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as DocWithVT;
    if (!reduce && typeof doc.startViewTransition === "function") {
      doc.startViewTransition(apply);
    } else {
      apply();
    }
    try {
      localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {}
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={dark}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
      className={
        "relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-stone-900/10 bg-white text-stone-600 transition-all hover:-translate-y-px hover:text-emerald-700 active:translate-y-0 " +
        className
      }
    >
      {/* sun lives in dark mode, moon in light mode — CSS decides, so SSR and
          client always agree and the pre-hydration paint is correct */}
      <Sun
        className="hidden h-4 w-4 animate-in fade-in zoom-in-50 duration-300 dark:block"
        strokeWidth={1.8}
      />
      <Moon
        className="block h-4 w-4 animate-in fade-in zoom-in-50 duration-300 dark:hidden"
        strokeWidth={1.8}
      />
    </button>
  );
}
