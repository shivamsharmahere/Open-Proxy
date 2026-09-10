"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BookOpen, Github, Menu, X } from "lucide-react";
import { LogoMark } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#dashboard", label: "Dashboard" },
  { href: "#quickstart", label: "Deploy" },
  { href: "/docs", label: "Docs" },
];

export function Nav({
  homeHref = "#top",
  linkPrefix = "",
  ctaHref = "#quickstart",
}: {
  homeHref?: string;
  linkPrefix?: string;
  ctaHref?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const onDocs = pathname === "/docs";

  const resolve = (href: string) =>
    href.startsWith("/") ? href : `${linkPrefix}${href}`;

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
        <a href={homeHref} className="group flex items-center gap-2.5">
          <LogoMark className="h-8 w-8 transition-transform duration-500 group-hover:rotate-[8deg]" />
          <span className="text-[15px] font-semibold tracking-tight text-stone-900">
            open-proxy
          </span>
          <span className="hidden rounded-md border border-stone-900/10 bg-stone-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-stone-500 sm:inline-block">
            v0.6.6
          </span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const href = resolve(l.href);
            const active = l.href === "/docs" && onDocs;
            return (
              <a
                key={l.href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13.5px] font-medium transition-colors",
                  active
                    ? "bg-emerald-600/[0.08] text-emerald-800"
                    : "text-stone-500 hover:bg-stone-900/[0.045] hover:text-stone-900"
                )}
              >
                {l.label === "Docs" ? (
                  <BookOpen className="h-3.5 w-3.5" strokeWidth={1.8} />
                ) : null}
                {l.label}
              </a>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="https://github.com/shivamsharmahere/Open-Proxy"
            target="_blank"
            rel="noreferrer"
            aria-label="View open-proxy on GitHub"
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-stone-900/10 bg-white text-stone-600 transition-all hover:-translate-y-px hover:text-stone-900 active:translate-y-0 sm:flex"
          >
            <Github className="h-4 w-4" strokeWidth={1.8} />
          </a>
          <a
            href={ctaHref}
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
                  href={resolve(l.href)}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-3 text-[15px] font-medium hover:bg-stone-50",
                    l.href === "/docs" && onDocs
                      ? "text-emerald-800"
                      : "text-stone-700"
                  )}
                >
                  {l.label === "Docs" ? (
                    <BookOpen className="h-4 w-4 text-emerald-600" strokeWidth={1.8} />
                  ) : null}
                  {l.label}
                </a>
              ))}
              <a
                href={ctaHref}
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
