import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  ChevronDown,
  Github,
  ListTree,
  Terminal,
} from "lucide-react";
import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/final";
import { parseDocs } from "@/lib/docs-parser";
import { DocsToc } from "@/components/docs/docs-ui";
import { DocsContent } from "@/components/docs/docs-content";

/* read + parse the docs source at build time (page is fully static) */
const raw = fs.readFileSync(
  path.join(process.cwd(), "src/content/openproxy-docs.md"),
  "utf8"
);
const doc = parseDocs(raw);

export const metadata: Metadata = {
  title: "Docs — open-proxy",
  description:
    "Connect any AI coding agent to rate-limited NIM models in 60 seconds. Setup, integration guides for 11 agent tools, API reference, configuration and troubleshooting.",
  openGraph: {
    title: "Docs — open-proxy",
    description:
      "Setup, integration guides for 11 agent tools, API reference, configuration and troubleshooting.",
    type: "article",
  },
};

const CHIPS = [
  { icon: Terminal, label: "OpenAI-compatible /v1" },
  { icon: Boxes, label: "11 agent integration guides" },
  { icon: BookOpen, label: "13 sections · API + config" },
];

export default function DocsPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Nav homeHref="/" linkPrefix="/#" ctaHref="/#quickstart" />

      {/* ------------------------------------------------ header band -- */}
      <section className="relative overflow-hidden pb-12 pt-32 md:pt-40">
        <div className="blueprint-grid absolute inset-0" aria-hidden />
        <div
          aria-hidden
          className="aurora absolute -top-28 left-[14%] h-[380px] w-[380px] rounded-full bg-emerald-200/35 blur-[110px]"
        />
        <div
          aria-hidden
          className="aurora absolute right-[6%] top-24 h-[300px] w-[300px] rounded-full bg-amber-100/50 blur-[110px]"
          style={{ animationDelay: "-7s" }}
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="cascade flex max-w-3xl flex-col items-start gap-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white/80 px-3.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-stone-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 heartbeat-dot" />
              Documentation · v0.6.6
            </span>

            <h1 className="text-balance text-[2.5rem] font-semibold leading-[1.03] tracking-tighter text-stone-900 sm:text-6xl">
              Every wire your agents need,{" "}
              <span className="text-emerald-700">documented.</span>
            </h1>

            <p className="max-w-[58ch] text-[15.5px] leading-relaxed text-stone-500 md:text-[16.5px]">
              {doc.tagline} Setup, per-tool integration guides, the full{" "}
              <code className="rounded-md border border-stone-900/[0.07] bg-stone-100 px-1.5 py-0.5 font-mono text-[0.85em] text-stone-700">
                /v1
              </code>{" "}
              reference, configuration and troubleshooting — all in one place.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {CHIPS.map((c) => (
                <span
                  key={c.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-900/[0.08] bg-white/90 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-stone-500"
                >
                  <c.icon className="h-3 w-3 text-emerald-600" strokeWidth={2} />
                  {c.label}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="/#quickstart"
                className="group inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-[14px] font-medium text-stone-50 shadow-[0_18px_36px_-16px_oklch(0.216_0.008_90/0.5)] transition-all hover:-translate-y-0.5 hover:bg-stone-800 active:translate-y-0"
              >
                Open Quickstart
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  strokeWidth={1.8}
                />
              </a>
              <a
                href="https://github.com/miztertea/nim-proxy"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-900/12 bg-white px-5 py-3 text-[14px] font-medium text-stone-800 transition-all hover:-translate-y-0.5 hover:border-stone-900/25 active:translate-y-0"
              >
                <Github className="h-4 w-4" strokeWidth={1.8} />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- body -- */}
      <div className="relative mx-auto w-full max-w-6xl flex-1 px-4 pb-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-12">
          {/* sidebar — sticky TOC */}
          <aside className="hidden lg:block">
            <div className="nice-scroll sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pb-6 pr-1">
              <p className="mb-3 flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-stone-400">
                <ListTree className="h-3.5 w-3.5" strokeWidth={1.8} />
                on this page
              </p>
              <DocsToc sections={doc.sections} />
              <p className="mt-5 border-t border-stone-900/[0.07] pt-4 font-mono text-[9.5px] uppercase tracking-[0.18em] text-stone-400">
                v0.6.6 · mit · self-hosted
              </p>
            </div>
          </aside>

          {/* content */}
          <main className="min-w-0">
            {/* mobile TOC */}
            <details className="group mb-8 rounded-2xl border border-stone-900/[0.08] bg-white px-5 py-1 lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-600 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  <ListTree className="h-4 w-4 text-emerald-600" strokeWidth={1.8} />
                  contents
                </span>
                <ChevronDown
                  className="h-4 w-4 text-stone-400 transition-transform duration-300 group-open:rotate-180"
                  strokeWidth={1.8}
                />
              </summary>
              <div className="max-h-[52vh] overflow-y-auto pb-4 pt-1">
                <DocsToc sections={doc.sections} />
              </div>
            </details>

            <DocsContent doc={doc} />

            {/* closing CTA card */}
            <div className="diffuse-card relative mt-14 overflow-hidden rounded-[1.6rem] px-6 py-8 sm:px-9">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl"
              />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
                    ready in 60 seconds
                  </p>
                  <p className="mt-1.5 text-xl font-semibold tracking-tight text-stone-900">
                    Stuck on a step? The quickstart has you covered.
                  </p>
                  <p className="mt-1 text-[13.5px] text-stone-500">
                    Docker one-liner, first-run wizard, and env vars for any
                    agent — then let the pool absorb the 429s.
                  </p>
                </div>
                <a
                  href="/#quickstart"
                  className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-[14px] font-medium text-stone-50 transition-all hover:-translate-y-0.5 hover:bg-stone-800 active:translate-y-0"
                >
                  Quickstart
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    strokeWidth={1.8}
                  />
                </a>
              </div>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
