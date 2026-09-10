"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocSection } from "@/lib/docs-parser";

/* ------------------------------------------------------------------ */
/* code block — dark console panel, line-tinted, copy button           */
/* ------------------------------------------------------------------ */

function CodeLine({ line }: { line: string }) {
  /* full-line comment */
  if (/^\s*(#|\/\/)/.test(line))
    return <span className="text-stone-500">{line || " "}</span>;

  /* toml section header */
  const section = line.match(/^(\s*)(\[.+\])(\s*)$/);
  if (section)
    return (
      <>
        {section[1]}
        <span className="font-semibold text-emerald-300">{section[2]}</span>
        {section[3]}
      </>
    );

  /* json key */
  const jkey = line.match(/^(\s*)("(?:[^"\\]|\\.)*")(\s*:)(.*)$/);
  if (jkey)
    return (
      <>
        {jkey[1]}
        <span className="text-emerald-300">{jkey[2]}</span>
        {jkey[3]}
        <span className="text-stone-300">{jkey[4]}</span>
      </>
    );

  /* yaml / plain key */
  const ykey = line.match(/^(\s*)([A-Za-z_][\w.$/-]*)(\s*:)(.*)$/);
  if (ykey)
    return (
      <>
        {ykey[1]}
        <span className="text-emerald-300">{ykey[2]}</span>
        {ykey[3]}
        <span className="text-stone-300">{ykey[4]}</span>
      </>
    );

  return <span className="text-stone-300">{line || " "}</span>;
}

export function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const flashCopied = () => {
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  /* fallback for contexts where the async clipboard API is unavailable */
  const legacyCopy = (): boolean => {
    try {
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else if (!legacyCopy()) {
        return;
      }
      flashCopied();
    } catch {
      if (legacyCopy()) flashCopied();
    }
  };

  const lines = code.split("\n");

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-900/[0.09] bg-stone-950 shadow-[0_20px_44px_-24px_oklch(0.216_0.008_90/0.5)]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2 w-2 rounded-full bg-white/15" />
            <span className="h-2 w-2 rounded-full bg-white/15" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
          </span>
          <span className="ml-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-stone-500">
            {lang}
          </span>
        </div>
        <button
          onClick={copy}
          aria-label="Copy code"
          className={cn(
            "flex items-center gap-1.5 rounded-lg border border-white/10 px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em] transition-all",
            copied
              ? "text-emerald-300"
              : "text-stone-400 hover:border-white/25 hover:text-stone-200"
          )}
        >
          {copied ? (
            <Check className="h-3 w-3" strokeWidth={2.2} />
          ) : (
            <Copy className="h-3 w-3" strokeWidth={2} />
          )}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <div className="nice-scroll overflow-x-auto px-4 py-3.5">
        <pre className="font-mono text-[12.5px] leading-[1.7]">
          {lines.map((l, idx) => (
            <div key={idx} className="whitespace-pre">
              <CodeLine line={l} />
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* table of contents with scroll-spy                                   */
/* ------------------------------------------------------------------ */

function collectIds(sections: DocSection[]): string[] {
  const ids: string[] = [];
  for (const s of sections) {
    ids.push(s.id);
    for (const sub of s.subs) ids.push(sub.id);
  }
  return ids;
}

export function DocsToc({ sections }: { sections: DocSection[] }) {
  const [active, setActive] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    const ids = collectIds(sections);
    let raf = 0;
    const update = () => {
      raf = 0;
      let current = ids[0] ?? "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 112) current = id;
        else break;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sections]);

  return (
    <nav aria-label="Docs table of contents" className="flex flex-col gap-1">
      {sections.map((s) => (
        <div key={s.id}>
          <a
            href={`#${s.id}`}
            className={cn(
              "group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
              active === s.id
                ? "bg-emerald-600/[0.07] text-emerald-800"
                : "text-stone-500 hover:bg-stone-900/[0.035] hover:text-stone-900"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                active === s.id ? "bg-emerald-500" : "bg-stone-300"
              )}
            />
            <span className="truncate">{s.title}</span>
          </a>
          {s.subs.length > 0 && (
            <div className="ml-[15px] flex flex-col border-l border-stone-900/[0.07] pl-1.5">
              {s.subs.map((sub) => (
                <a
                  key={sub.id}
                  href={`#${sub.id}`}
                  className={cn(
                    "truncate rounded-md px-2.5 py-1 text-[11.5px] transition-colors",
                    active === sub.id
                      ? "font-medium text-emerald-700"
                      : "text-stone-400 hover:text-stone-700"
                  )}
                >
                  {sub.title}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
