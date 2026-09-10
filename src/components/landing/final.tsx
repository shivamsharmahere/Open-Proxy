"use client";

import { ArrowRight, Github, Star } from "lucide-react";
import { motion } from "framer-motion";
import { LogoMark } from "./logo";
import { Reveal } from "./reveal";
import { StarCount } from "./github-stars";

/* ------------------------------------------------------------------ */
/* final CTA                                                           */
/* ------------------------------------------------------------------ */

export function FinalCta() {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-10 sm:px-6 md:pb-32">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-stone-900 px-6 py-20 text-center shadow-[0_56px_110px_-40px_oklch(0.216_0.008_90/0.55)] md:py-28">
        {/* decor */}
        <div
          aria-hidden
          className="aurora absolute -left-24 -top-24 h-80 w-80 rounded-full bg-emerald-500/20 blur-[110px]"
        />
        <div
          aria-hidden
          className="aurora absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-emerald-400/15 blur-[110px]"
          style={{ animationDelay: "-6s" }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-mono text-[22rem] font-bold leading-none text-white/[0.03]"
        >
          ∞
        </span>

        <div className="relative flex flex-col items-center gap-8">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.2em] text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 heartbeat-dot" />
              mit licensed · self-hosted · yours
            </span>
          </Reveal>

          <Reveal delay={0.08}>
            <h2 className="text-balance text-4xl font-semibold leading-[1.03] tracking-tighter text-stone-50 md:text-6xl">
              Give your agents
              <br />
              one endpoint.
            </h2>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="max-w-[56ch] text-[15px] leading-relaxed text-stone-400 md:text-base">
              Stop building rate-limit handling into every application. Connect
              your providers. Add your keys. Point your clients at open-proxy.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <motion.a
                href="#quickstart"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-[15px] font-semibold text-stone-950 shadow-[0_20px_40px_-16px_oklch(0.6_0.14_155/0.7)] transition-colors hover:bg-emerald-400"
              >
                Start Building
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  strokeWidth={2}
                />
              </motion.a>
              <motion.a
                href="https://github.com/shivamsharmahere/Open-Proxy"
                target="_blank"
                rel="noreferrer"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-7 py-3.5 text-[15px] font-medium text-stone-100 transition-colors hover:bg-white/10"
              >
                <Github className="h-4 w-4" strokeWidth={1.8} />
                Star on GitHub
                <StarCount dark />
              </motion.a>
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-stone-500">
              <span>OpenAI-compatible</span>
              <span className="text-stone-700">·</span>
              <span>Self-hosted</span>
              <span className="text-stone-700">·</span>
              <span>Multi-provider</span>
              <span className="text-stone-700">·</span>
              <span className="text-emerald-400">Rate-limit aware</span>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* footer                                                              */
/* ------------------------------------------------------------------ */

const COLS = [
  {
    title: "Product",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "How it works", href: "/#how" },
      { label: "Features", href: "/#features" },
      { label: "Dashboard", href: "/#dashboard" },
      { label: "Deploy", href: "/#quickstart" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "GitHub", href: "https://github.com/shivamsharmahere/Open-Proxy" },
      { label: "Releases", href: "https://github.com/shivamsharmahere/Open-Proxy/releases" },
      { label: "Discussions", href: "https://github.com/shivamsharmahere/Open-Proxy/discussions" },
      { label: "Contributing", href: "https://github.com/shivamsharmahere/Open-Proxy/blob/main/CONTRIBUTING.md" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Security policy", href: "https://github.com/shivamsharmahere/Open-Proxy/blob/main/SECURITY.md" },
      { label: "OpenSSF Scorecard", href: "https://scorecard.dev/viewer/?uri=github.com/shivamsharmahere/Open-Proxy" },
      { label: "Best Practices", href: "https://www.bestpractices.dev/projects/13484" },
      { label: "MIT License", href: "https://github.com/shivamsharmahere/Open-Proxy/blob/main/LICENSE" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-900/[0.07] bg-white/60">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <a href="#top" className="flex items-center gap-2.5">
              <LogoMark className="h-8 w-8" />
              <span className="text-[15px] font-semibold tracking-tight text-stone-900">
                open-proxy
              </span>
            </a>
            <p className="max-w-[36ch] text-[13px] leading-relaxed text-stone-500">
              A tiny, multi-provider, rate-limit-aware OpenAI-compatible proxy.
              One proxy, every provider, zero 429s.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["CI", "MIT", "OpenSSF BP", "Scorecard"].map((b) => (
                <span
                  key={b}
                  className="flex items-center gap-1 rounded-md border border-stone-900/[0.08] bg-white px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-stone-400"
                >
                  <Star className="h-2.5 w-2.5 text-emerald-500" strokeWidth={2} />
                  {b}
                </span>
              ))}
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3.5">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
                {col.title}
              </p>
              {col.links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                  className="w-fit text-[13.5px] text-stone-600 transition-colors hover:text-emerald-700"
                >
                  {l.label}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-stone-900/[0.06] pt-6 sm:flex-row">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-stone-400">
            open-proxy — one proxy, every provider, zero 429s
          </p>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-stone-400">
            MIT · built for agents that don&apos;t like 429s
          </p>
        </div>
      </div>
    </footer>
  );
}
