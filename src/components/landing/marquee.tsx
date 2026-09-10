"use client";

import { Box, Braces, Workflow, TerminalSquare, Bot, Code2, Sparkles, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { icon: Code2, label: "OpenCode" },
  { icon: TerminalSquare, label: "Codex CLI" },
  { icon: Workflow, label: "n8n" },
  { icon: Bot, label: "Cline" },
  { icon: Sparkles, label: "Hermes" },
  { icon: Box, label: "Claude Code" },
  { icon: Braces, label: "curl" },
  { icon: Cpu, label: "Your app" },
];

export function Marquee() {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <section
      aria-label="Compatible clients"
      className="marquee-paused relative border-y border-stone-900/[0.07] bg-white/60 py-5"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[oklch(0.985_0.003_90)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[oklch(0.985_0.003_90)] to-transparent" />
      <div className="overflow-hidden">
        <div className="animate-marquee flex w-max items-center gap-10 pr-10">
          {doubled.map((item, i) => (
            <div key={`${item.label}-${i}`} className="flex items-center gap-2.5">
              <item.icon className="h-4 w-4 text-stone-400" strokeWidth={1.6} />
              <span className="whitespace-nowrap font-mono text-[12.5px] font-medium uppercase tracking-[0.14em] text-stone-500">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-center font-mono text-[10.5px] uppercase tracking-[0.22em] text-stone-400">
        speaks OpenAI? it already speaks open-proxy
      </p>
    </section>
  );
}

export function ClientLogoRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-6 gap-y-2", className)}>
      {ITEMS.slice(0, 6).map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-stone-400">
          <item.icon className="h-3.5 w-3.5" strokeWidth={1.6} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
