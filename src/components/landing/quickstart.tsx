"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Terminal, SquareUser, KeyRound, Plug } from "lucide-react";
import { SectionHeading, Reveal } from "./reveal";

const DOCKER_CMD = `docker run -d --name open-proxy \\
  -p 127.0.0.1:8000:8000 \\
  -v open-proxy-data:/data \\
  open-proxy`;

const STEPS = [
  {
    icon: Terminal,
    title: "Run the image",
    body: "~5 MB, multi-arch, hardened defaults. Compose or cargo run --release work too.",
    code: "docker run -d …",
  },
  {
    icon: SquareUser,
    title: "Claim the wizard",
    body: "First visitor to a fresh install creates the superuser. /v1 stays closed until setup completes.",
    code: "http://localhost:8000",
  },
  {
    icon: KeyRound,
    title: "Add a key, get a key",
    body: "Paste an upstream key (validated live), and the wizard mints your first npk_ client key.",
    code: "nvapi-… → npk_…",
  },
  {
    icon: Plug,
    title: "Point your agent",
    body: "Base URL /v1, client key in the Authorization header. OpenCode, Codex, n8n — whatever speaks OpenAI.",
    code: "base_url = …/v1",
  },
];

export function Quickstart() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(DOCKER_CMD);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <section id="quickstart" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="deploy in minutes"
          title="From zero to your own AI gateway in minutes."
          sub="No sign-up, no control plane, no vendor. The proxy runs on your machine, your VPS or your PaaS — and the first-run wizard does the rest."
        />

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
          {/* terminal */}
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <div className="overflow-hidden rounded-2xl border border-stone-900/10 bg-[#0c0a09] shadow-[0_36px_72px_-32px_oklch(0.216_0.008_90/0.45)]">
                <div className="flex items-center gap-1.5 border-b border-white/[0.07] px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
                    sh — self-host
                  </span>
                  <button
                    onClick={copy}
                    aria-label="Copy docker command"
                    className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2} />
                    ) : (
                      <Copy className="h-3.5 w-3.5" strokeWidth={1.8} />
                    )}
                  </button>
                </div>
                <div className="p-5 font-mono text-[12.5px] leading-relaxed">
                  <p className="text-emerald-400">$ {DOCKER_CMD.split("\n")[0]}</p>
                  {DOCKER_CMD.split("\n").slice(1).map((l) => (
                    <p key={l} className="whitespace-pre text-stone-300">
                      {l}
                    </p>
                  ))}
                  <p className="mt-3 text-stone-500">
                    <span className="text-emerald-400/70">→</span> open-proxy booted · wizard
                    waiting at <span className="text-stone-300">http://localhost:8000</span>
                    <span className="term-caret ml-1.5 inline-block h-3.5 w-[7px] translate-y-[2px] bg-emerald-400/80" />
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-stone-400">
                {["docker", "compose", "cargo run --release", "ecs / railway / fly"].map((t) => (
                  <span key={t} className="rounded-lg border border-stone-900/[0.08] bg-white px-2.5 py-1.5">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* steps */}
          <div className="relative flex flex-col">
            <div
              aria-hidden
              className="absolute bottom-6 left-[22px] top-6 w-px bg-gradient-to-b from-emerald-500/50 via-stone-200 to-transparent"
            />
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="group relative flex gap-5 py-5 pl-1"
              >
                <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-stone-900/[0.08] bg-white shadow-sm transition-colors group-hover:border-emerald-600/30 group-hover:bg-emerald-50">
                  <s.icon className="h-4.5 w-4.5 text-stone-600 transition-colors group-hover:text-emerald-600" strokeWidth={1.7} />
                </div>
                <div className="pt-0.5">
                  <p className="flex items-baseline gap-2.5">
                    <span className="tnum font-mono text-[10px] font-semibold text-emerald-600">
                      0{i + 1}
                    </span>
                    <span className="text-[15.5px] font-semibold tracking-tight text-stone-900">
                      {s.title}
                    </span>
                  </p>
                  <p className="mt-1.5 max-w-[52ch] text-[13.5px] leading-relaxed text-stone-500">
                    {s.body}
                  </p>
                  <p className="mt-2 inline-block rounded-lg bg-stone-100/80 px-2.5 py-1 font-mono text-[10.5px] text-stone-500">
                    {s.code}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
