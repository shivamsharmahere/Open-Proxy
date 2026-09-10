"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Github, Menu, X } from "lucide-react";
import { LogoMark } from "./logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#dashboard", label: "Dashboard" },
  { href: "#quickstart", label: "Deploy" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        className={cn(
          "flex w-full max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500",
          scrolled ? "glass" : "border border-transparent"
        )}
        aria-label="Main navigation"
      >
        <a href="#top" className="group flex items-center gap-2.5">
          <LogoMark className="h-8 w-8 transition-transform duration-500 group-hover:rotate-[8deg]" />
          <span className="text-[15px] font-semibold tracking-tight text-stone-900">
            open-proxy
          </span>
          <span className="hidden rounded-md border border-stone-900/10 bg-stone-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-stone-500 sm:inline-block">
            v0.6.6
          </span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3.5 py-2 text-[13.5px] font-medium text-stone-500 transition-colors hover:bg-stone-900/[0.045] hover:text-stone-900"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/miztertea/nim-proxy"
            target="_blank"
            rel="noreferrer"
            aria-label="View open-proxy on GitHub"
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-stone-900/10 bg-white text-stone-600 transition-all hover:-translate-y-px hover:text-stone-900 active:translate-y-0 sm:flex"
          >
            <Github className="h-4 w-4" strokeWidth={1.8} />
          </a>
          <a
            href="#quickstart"
            className="group hidden items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-[13.5px] font-medium text-stone-50 transition-all hover:-translate-y-px hover:bg-stone-800 active:translate-y-0 md:inline-flex"
          >
            Get Started
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
              strokeWidth={1.8}
            />
          </a>
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-900/10 bg-white text-stone-700 md:hidden"
          >
            {open ? (
              <X className="h-4 w-4" strokeWidth={1.8} />
            ) : (
              <Menu className="h-4 w-4" strokeWidth={1.8} />
            )}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-x-0 top-[calc(100%+8px)] rounded-2xl border border-stone-900/10 bg-white p-2 shadow-xl md:hidden"
            >
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-[15px] font-medium text-stone-700 hover:bg-stone-50"
                >
                  {l.label}
                </a>
              ))}
              <a
                href="#quickstart"
                onClick={() => setOpen(false)}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-[15px] font-medium text-stone-50"
              >
                Get Started <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}
