"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const REPO = "shivamsharmahere/Open-Proxy";

/* live stargazer count — fetched from the visitor's browser, hidden
   silently when the API is unreachable or the repo has no stars yet */
export function StarCount({ dark = false }: { dark?: boolean }) {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`https://api.github.com/repos/${REPO}`, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (
          alive &&
          d &&
          typeof d.stargazers_count === "number" &&
          d.stargazers_count > 0
        ) {
          setStars(d.stargazers_count as number);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (stars === null) return null;

  return (
    <span
      className={cn(
        "ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold tnum",
        dark
          ? "bg-white/10 text-stone-200"
          : "bg-stone-900/[0.06] text-stone-600"
      )}
    >
      <Star
        className="h-3 w-3 fill-amber-400 text-amber-400"
        strokeWidth={1.8}
      />
      {stars}
    </span>
  );
}
