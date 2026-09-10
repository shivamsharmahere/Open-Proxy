# Worklog

---
Task ID: 1
Agent: main (Super Z)
Task: Build SaaS-level landing page for open-proxy (light rich premium theme, Infinite RPM hero diagram)

Work Log:
- Read README.md and pasted reference (design taste skill v1 + content outline)
- Initialized fullstack environment (Next.js 16 + Tailwind 4 + framer-motion)
- Built 13 landing components under src/components/landing + composed page.tsx
- Palette: stone-50 bg / stone-900 ink / emerald-600 single accent; Geist + Geist Mono
- Sections: Nav (glass) · Hero (asymmetric split + ∞ RPM card + aspect-locked animated architecture diagram: 4 provider sources → open-proxy core → thick 166 RPM stream with SMIL particles → 6-client counter-rotating orbit) · client marquee · Without/With typing terminals · 320 RPM key pool · 6-card bento (sliding windows, event log, affinity dot, governor gauge, heartbeats, model ticker) · endpoint tabs (curl/opencode/codex/n8n + copy) · auto-cycling 5-tab dashboard mock (area charts, rings, heatmap) · dark privacy band · infra stat strip · fail-closed security · 100→0 load test · audience zig-zag · quickstart steps · final CTA · footer

Bugs found & fixed during browser verification:
- Orbit chips computed in viewBox space instead of orbit-box space → chips clustered; fixed to 50%±50%·cos/sin
- SVG linearGradient with objectBoundingBox on zero-height horizontal path paints nothing → switched to gradientUnits=userSpaceOnUse + hex stops
- oklch stopColor unreliable in SVG gradients → hex everywhere for gradient stops
- Mobile provider-card truncation → compact variant

Verification:
- bun run lint: clean
- dev.log: all GET / 200, no runtime errors
- agent-browser: desktop 1440px + mobile 390px walkthrough, hamburger menu, endpoint tab switching, clipboard copy feedback, dashboard tab clicks (Reliability verified), console clean, no page errors

Stage Summary:
- DONE. Deliverable: SaaS landing page at / (single route), production-quality light premium theme.

---
Task ID: 2
Agent: main (Super Z)
Task: Improve hero + rebuild routing diagram per user feedback ("that can be made better and the routing diagram can also be made better")

Work Log:
- Rewrote src/components/landing/hero.tsx (579 -> ~1030 lines)
- Routing diagram rebuilt as "LIVE TOPOLOGY" console panel: header (pulsing dot, meta, live reqs-routed + 429-absorbed counters), aspect-locked stage, footer event ticker (7 rotating log lines, tone-coded dots)
- Fixed the old visual gap: thick stream now runs core -> hub edge (M 716 218 -> 962), hub = pulsing Terminal chip the stream plugs into
- Wires upgraded: rpm-encoded stroke widths (1.8+rpm/26), draw-in via framer pathLength, flowing dash overlay, haloed SMIL packets
- Provider cards gained animated rpm share bars; compact variant uses short names
- Core upgraded: spinning dashed status ring, glow, "4/4 UP" health pill, glow blob
- Orbit upgraded: hub + radar dot on inner ring (core-ring 26s), client chips with status dots
- Added stage captions 01 upstream pools / 02 one endpoint / 03 pooled throughput / 04 every agent
- Hero left: replaced provider mono line with 4-cell stat strip (166 RPM / 12 keys / +1.8ms / MIT), double-stroke underline on "rate limits."
- RpmCard: LIVE pill, deterministic seeded utilization sparkline (LCG, SSR-safe) with 166 CEILING dashed line + pulsing end dot, live jittering rpm value
- globals.css: core-ring, tick-in, hub-pulse, stage-dots additions

Bugs found & fixed during verification:
- framer-motion scale animation on motion.div clobbered style transform translate(-50%,-50%) -> core/badge/orbit all shifted; fixed by outer static div for positioning + inner motion.div for animation
- Desktop diagram missing hidden lg:block wrapper after rewrite -> rendered crammed behind mobile panel; restored wrapper
- Mobile compact cards truncated provider names -> switched to short names

Verification:
- bun run lint: clean; page 200s, no page errors
- agent-browser: desktop 1440 + mobile 390 screenshots of hero, diagram, mobile grid — all aligned, animations live, counters ticking

Stage Summary:
- DONE. Hero + routing diagram significantly upgraded; files touched: hero.tsx, globals.css

---
Task ID: 3
Agent: main (Super Z)
Task: Fix 166 RPM combined overlap (move figure inside hub, small) + add power-up effect when a CLI chip touches the emerald stream

Work Log:
- Removed the floating "166 rpm combined" glass badge from the desktop stage (it collided with orbit chips + rings crossing the ring's left point)
- Hub redesigned into a throughput meter: enlarged to 4.7rem, now carries Terminal icon + counting 166 (Counter, 2.2s) + "rpm combined" label — exactly where the stream plugs in; hit-ring resized to match
- ClientChip: added relative positioning + flashKey prop; power-up visuals = opx-charge surge (bright emerald flash, scale pop 1->1.16->1, glow bloom, settles to idle), expanding chip-burst-ring, zap-pop spark badge above chip, status dot burst
- Contact sync rewritten: replaced wall-clock interval (drifted vs CSS rotation) with rAF loop reading the ring's live CSS animation clock via getAnimations() — flash now fires at the exact moment the chip center crosses the stream intake point (180°), immune to hydration delay; PASS_SEQ/PASS_MS replaced by computed CONTACT_CROSSINGS
- globals.css: new keyframes opx-charge / opx-chip-burst / opx-zap-pop / opx-dot-burst; old persistent .chip-served state replaced by 0.95s forwards animation
- Cleanup: removed unused InfinityIcon import and dead useOdometer hook
- Verified via agent-browser wait --fn on .zap-pop presence: desktop 1440 shot catches n8n exactly ON the strip mid-power-up; mobile 390 catches Hermes charged with zap spark; hub 166 renders clean on both

Verification:
- bun run lint: clean
- Console: no page errors (only Fast Refresh logs)
- Screenshots kept: download/verify-contact-1.png, download/verify-contact-2.png

Stage Summary:
- DONE. Overlap eliminated (166 lives inside the hub now); strip-contact power-up effect shipped and animation-clock synced. Files touched: hero.tsx, globals.css

---
Task ID: 4
Agent: main (Super Z)
Task: Add the uploaded openproxy-docs.md as a Docs page on the site (/docs)

Work Log:
- Copied upload/openproxy-docs.md -> src/content/openproxy-docs.md (read at build time; page is fully static)
- Built src/lib/docs-parser.ts: minimal markdown block parser (headings, fenced code, tables, callout quotes, ordered/unordered lists with one nesting level, paragraphs, slugs) -> section model {id,title,blocks,subs} for TOC
- Bugs fixed in parser: (1) infinite loop — h1 title line fell through paragraph branch without consuming, hung the dev server event loop (had to kill + restart next-server via double-fork orphan pattern since sandbox reaps children between tool calls); (2) "## " prefix leaked into titles (regex #{3,4} -> #{2,4}); (3) preamble tagline quote became a phantom "Overview" section (now skip everything before first h2)
- Built src/components/docs/docs-ui.tsx (client): CodeBlock — dark console panel, language label, traffic dots, line-level tinting (comments/toml sections/json+yaml keys), copy button with legacy execCommand fallback; DocsToc — two-level sticky TOC with rAF scroll-spy (active = last heading top <= 112px)
- Built src/components/docs/docs-content.tsx (server): inline markdown renderer (bold/code/links/bare-url linkify), callouts (emerald note / amber important-caveat-limitation-key-distinction), styled tables, numbered/bulleted lists, h3 hover anchors, numbered section headers
- Created src/app/docs/page.tsx: premium header band (blueprint grid + aurora, eyebrow, h1, tagline, chips, Quickstart/GitHub CTAs), lg sidebar + mobile <details> TOC, closing quickstart CTA card, Footer; metadata/og; fs read at module scope
- Nav upgraded for cross-route use: props homeHref/linkPrefix/ctaHref + usePathname active state; "Docs" link added (desktop + mobile menu); footer Product column got Docs link + absolute /# anchors
- globals.css: html smooth scroll + prefers-reduced-motion guard
- Verified: copy button flips to "copied" via real CDP mouse click (headless clipboard needs activation); TOC click scrolls with correct 112px scroll-margin; scroll-spy tracks sections + subsections; tables/callouts/code blocks render on desktop + mobile

Verification:
- bun run lint: clean
- Parser standalone test: 13 sections, 24 code blocks, 6 tables, 7 callouts, correct slugs
- agent-browser: desktop 1440 + mobile 390 walkthroughs of /docs, TOC nav, copy button, mobile contents accordion; landing nav intact; no console/page errors
- Note: dev server was restarted detached (setsid double-fork) after the parser infinite-loop wedge

Stage Summary:
- DONE. Docs page live at /docs; files: src/content/openproxy-docs.md, src/lib/docs-parser.ts, src/components/docs/{docs-ui,docs-content}.tsx, src/app/docs/page.tsx, nav.tsx, final.tsx, globals.css

---
Task ID: 4-resume
Agent: main (Super Z)
Task: Post-resume re-verification of the /docs page (session was continued from summary; implementation was already on disk)

Work Log:
- Confirmed all Task 4 artifacts exist and dev server serves / and /docs with 200 (dev.log clean)
- bun run lint: clean
- agent-browser desktop 1440x900: header band + 2-level sidebar TOC + numbered sections + dark code blocks + endpoints METHOD/PATH/DESCRIPTION table all render correctly
- TOC click navigation works (API Reference -> scrollY 10445); scroll-spy active state follows headings (112px threshold behavior confirmed)
- Copy button: JS el.click() does NOT produce the copied state in headless (clipboard write throws, legacy execCommand path needs user activation) — real CDP mouse click (mouse move + down + up at button coords) flips it to "copied" as documented in Task 4
- Mobile 390x844: header band, chips, CTAs, CONTENTS <details> accordion opens with 2-level TOC + active highlight
- Cross-route nav: landing "/" -> click Docs -> lands on /docs with correct h1; no console/page errors
- Kept screenshots: download/verify-docs-desktop.png, download/verify-docs-mobile.png (other temp shots removed)

Stage Summary:
- VERIFIED. /docs page fully functional on desktop + mobile; no regressions on landing. No code changes needed in this pass.

---
Task ID: 5
Agent: main (Super Z)
Task: Make the hub's 166 RPM figure live ("this 166 RPM is not fixed should we do something to it?")

Work Log:
- Diagnosis: hub used <Counter to={166}> which counts 0->166 once on reveal then freezes forever — a dead number inside a "LIVE TOPOLOGY" console (mobile stream glass badge was hardcoded static 166 too)
- Built a module-scope shared rpm store in hero.tsx: rpmValue + subscriber set + armRpm() (0->166 count-up over 2.2s cubic ease-out via rAF, gated on first LiveRpm entering viewport) -> driftTick() (mean-reverting random walk around capacity 166, noise -2..+2, clamped [160,168], every 1.5-2.8s)
- surgeRpm(): +1..2 kick capped at 171, ignored while still counting up; wired into Orbit's rAF contact scheduler — fires on direct served flash AND inside the retry->served 550ms timeout, so the meter causally responds to the chip power-up effect from Task 3
- New <LiveRpm> component (useInView gate + store subscription); replaced hub Counter (desktop + compact) and the mobile glass badge figure — all instances render the SAME shared value, never disagree
- Left capacity/spec numbers untouched: left stat strip "166 RPM pooled throughput", RpmCard "166 RPM pooled" + 166 CEILING line, "80+40+16+50=166" caption, ticker text
- Note: at 1440x900 the hub sits below the -40px inView margin on load, so the count-up arms on first actual visibility (scroll) — verified intended

Verification:
- bun run lint: clean; GET / 200
- 9s sampling of hub value @250ms: 165->164->167->165 (drift) then 165->169 @7.75-8s (surge — 169 exceeds drift ceiling 168, proving contact kick) then decay 169->168 (mean reversion)
- Mobile 390: badge "168 rpm combined" + hub "168" in sync; 2.6s later both "163" — shared store keeps every meter identical
- Desktop screenshot shows hub at 168 RPM COMBINED with console counters live; console clean, no page errors
- Screenshots kept: download/verify-live-rpm-desktop.png, download/verify-live-rpm-mobile.png

Stage Summary:
- DONE. Hub RPM is now a live meter: counts up on reveal, breathes 160-168 around capacity, surges when a client powers up on the stream, decays back. All rpm readouts share one store. Files touched: hero.tsx only.

---
Task ID: 6
Agent: main (Super Z)
Task: Unpin the 166 RPM identity — pool size depends on the user's providers/keys ("can go to even 1000 RPM also and can be less also")

Work Log:
- rpm store upgraded from fixed capacity to a GROWING ceiling: RPM_START=166 (demo pool), rpmCap ratchets +2..5 every 8-14s once armed (tapers to +1 above 900, hard max 999); drift band and surge cap now key off rpmCap; growTick chain started alongside driftTick after count-up
- Copy changes (scale story, all "166 RPM" identity claims removed):
  - left stat strip: "166 RPM / pooled throughput" -> "1000+ RPM / pooled throughput"
  - RpmCard: "<Counter 166> RPM pooled / effective ceiling for every connected agent" -> "<Counter 1000+> rpm at scale / no fixed ceiling — the pool grows with every key you add"
  - sparkline label "166 CEILING" -> "POOL CEILING" (dashed line kept at demo-pool level)
  - provider-bars caption "80 + 40 + 16 + 50 = 166 RPM" -> "80 + 40 + 16 + 50 — a demo pool. stack keys and it scales past 1000 rpm" (also fixes pre-existing math bug: the old sum is actually 186)
  - event ticker "pace: 166 rpm budget shared" -> "pace: pooled rpm budget shared"
  - dashboard Capacity tab demo gauge "118 / 166 rpm" -> "312 / 440 rpm" (keeps the 71% saturation ratio)
- Kept: SVG path coordinate 166 (geometry), seeded sparkline 166 reference (demo pool), hub/mobile live numbers (now growing), provider demo rpms 80/40/16/50

Verification:
- bun run lint: clean; GET / 200
- 24s hub sampling @1s: drift ~167 (1-9s) -> 172 @11s (grow step) -> settles ~170 -> 172-173 @22-24s (second grow step); baseline climbed 166 -> ~174 with drift+surge intact
- Mobile 390 after ~1-2 min open: badge "181 rpm combined" + all hubs "181" — store sustained the climb (166 -> 181) and every meter stayed in sync
- innerText checks: "1000+ RPM", "1000+ rpm at scale", "no fixed ceiling", "POOL CEILING", "scales past 1000 rpm" all present; regex /166 RPM/ and "166 CEILING" gone
- Screenshot kept: download/verify-scale-rpm-card.png; console clean, no page errors

Stage Summary:
- DONE. RPM is no longer a fixed identity: the meter starts at the 166 demo pool and keeps ratcheting toward 999 as keys connect; all static claims now say 1000+ / no fixed ceiling. Files touched: hero.tsx, dashboard.tsx.

---
Task ID: 7
Agent: main (Super Z)
Task: Point all GitHub links at the real repo (github.com/shivamsharmahere/Open-Proxy) so users can star/view it

Work Log:
- Replaced all 11 references to the old placeholder repo (github.com/miztertea/nim-proxy) across nav.tsx, hero.tsx, docs/page.tsx, final.tsx
- Sub-paths preserved: /releases, /discussions, /blob/main/{CONTRIBUTING,SECURITY,LICENSE}.md, OpenSSF scorecard viewer uri
- src/content/openproxy-docs.md has no repo URLs (checked, no changes needed)

Verification:
- rg: no miztertea/nim-proxy refs left in src/
- bun run lint: clean
- Browser: collected every a[href*="github.com"] on / (10 links) and /docs (9 links) — all resolve to shivamsharmahere/Open-Proxy with correct sub-paths; no page errors

Stage Summary:
- DONE. Every GitHub entry point (nav icon, hero button, docs header, final CTA, footer link column) now targets github.com/shivamsharmahere/Open-Proxy.

---
Task ID: 8
Agent: main (Super Z)
Task: "make it star on github with logo instead of view on github"

Work Log:
- New shared client component src/components/landing/github-stars.tsx: StarCount — fetches stargazers_count from api.github.com/repos/shivamsharmahere/Open-Proxy in the visitor's browser, renders a small amber-star count chip; silently hidden when API unreachable, non-200, or 0 stars (SSR-safe: null until fetch resolves)
- hero.tsx + final.tsx: "View on GitHub" -> "Star on GitHub" (GitHub logo kept), each with <StarCount /> chip (dark variant on the dark final CTA)
- Nav icon-only GitHub button and docs header "GitHub" button intentionally unchanged

Verification:
- bun run lint: clean; / and /docs both 200
- Browser: hero + final CTA show "Star on GitHub" with logo (chip hidden in sandbox — api.github.com unreachable from headless env; graceful-hide path verified, will render in real browsers once repo has stars)
- Screenshot kept: download/verify-star-button.png; console clean

Stage Summary:
- DONE. Both GitHub CTAs now say "Star on GitHub" with the GitHub logo + live star-count chip (graceful fallback). Files: github-stars.tsx (new), hero.tsx, final.tsx.

---
Task ID: 9
Agent: main (Super Z)
Task: Reduce excessive vertical spacing between landing sections ("the space between the different sections is too much")

Work Log:
- Audit: every landing section used py-24 md:py-32 (96/128px per side -> 192-256px dead space between adjacent sections)
- Reduced uniformly to py-14 md:py-20 (56/80px -> 112/160px gaps) across: quickstart, bento, endpoint, pool, compare, audience, dashboard (DashboardSection + PrivacyBand), loadtest, infra (Infra + Security)
- Internal header->grid margins tightened mt-14 -> mt-10 (7 files), compare bottom strip mt-12 -> mt-10
- FinalCta: outer pb-24 pt-10 md:pb-32 -> pb-14 pt-6 md:pb-20; dark card py-20 md:py-28 -> py-16 md:py-24
- Hero top padding (pt-32 md:pt-40) untouched — it clears the fixed nav
- Added section[id] { scroll-margin-top: 96px } in globals.css so anchor/rail jumps land below the glass nav (Turbopack initially served stale CSS; verified after real content change invalidated cache)

Verification:
- bun run lint: clean; GET / and /docs 200
- Computed paddings on desktop: how/features/dashboard/quickstart all 80px/80px (was 128px); mobile how 56px (was 96px)
- Screenshot kept: download/verify-spacing.png

Stage Summary:
- DONE. Section rhythm tightened ~37% on desktop / ~42% on mobile while keeping premium breathing room. Files: 10 landing components + globals.css.

---
Task ID: 10
Agent: main (Super Z)
Task: Creative desktop-only scroll sidebar with scroll movement + giant FinStocks-style wordmark at the very end of the page

Work Log:
- New src/components/landing/scroll-rail.tsx (desktop-only, hidden below xl/1280px): fixed right-edge glass pill containing
  (1) vertical mono "scroll" label, (2) h-56 progress track with base line + spring-smoothed emerald gradient fill (useSpring on useScroll scrollYProgress, origin-top scaleY) + glowing traveler dot chasing the scroll position, (3) 9 scroll-spy nodes (top/how/pool/features/endpoints/dashboard/security/quickstart/start) — active node grows emerald with ring, label chip ("01".."09" + name) ALWAYS visible for the active section and slide-in on hover for others, click smooth-scrolls to the section, (4) live tabular percentage readout, (5) circular jump button: "Skip to end of page" (arrow-down) that flips to rotated "Back to top" past 92% progress
- Added missing section ids: pool -> #pool, endpoint -> #endpoints, infra Security -> #security, FinalCta -> #start (nav/footer anchors already used top/how/features/dashboard/quickstart)
- Scroll-spy: rAF-throttled passive scroll listener + offsets measured on mount/resize/+0.8s/+2.2s with MAX_SAFE_INTEGER fallback for missing nodes; reduced-motion respected for all programmatic scrolls
- Footer (final.tsx): restructured into grid / Watermark / legal bar; new Watermark component — giant "open-proxy" wordmark text-[17.5vw] leading-none tracking-[-0.045em], stone-300->transparent bg-clip-text gradient, whitespace-nowrap full-bleed; scroll-linked parallax via useScroll({ target, offset: ["start end","end end"] }) + useTransform y 34%->0% inside overflow-hidden wrapper, so it rises into place as the user reaches the end (movement on scroll down AND up); aria-hidden + select-none + pointer-events-none
- Watermark ships on both / and /docs (shared Footer)
- Fixed framer dev-only warning "container has a non-static position": window-target useScroll measures against <html>; added position: relative to the html rule in globals.css (no visual impact; production strips the warning anyway)
- ScrollRail wired into src/app/page.tsx only (after <Nav/>), so /docs keeps its own docs TOC without the rail
- Headless note: Tailwind v4 gates hover:/group-hover: behind @media (hover: hover) which is false in device-less headless Chrome — hover-only labels were untestable AND invisible during scroll, so active-label-always-visible was added (better UX + matches the "movement while scrolling" ask). Verified via matchMedia probe.

Verification:
- bun run lint: clean; GET / and /docs 200
- Rail at 1440px: renders at x=1374 (46x368), pct 0% at top; after scroll-to-#how pct=11% + active "How it works"; label chips flip 01->02->04->09 across the page
- Node click: "Go to Features" scrolls #features to viewport top with 96px scroll-margin; jump button reaches page end, pct=100%, arrow rotates 180deg, aria-label flips to "Back to top"; back-to-top returns to scrollY 0
- Watermark: 1432x252 at 1440 (full-bleed), transform translateY(34%) when 600px above bottom -> none at bottom (parallax live); renders on /docs too
- Mobile 390: rail display:none, watermark scales, sections 56px padding
- Console: clean after fix; agent-browser errors: none
- Screenshots kept: verify-rail-top.png, verify-rail-mid.png, verify-watermark.png, verify-mobile-end.png, verify-spacing.png (verify-rail-hover.png superseded by always-on active label)

Stage Summary:
- DONE. Desktop-only ScrollRail (progress fill + traveling glow dot + scroll-spy nodes with numbered labels + live % + skip-to-end/back-to-top) and the giant end-of-page "open-proxy" wordmark with scroll parallax are live on / (wordmark also on /docs). Spacing task recorded separately as Task 9. Files: scroll-rail.tsx (new), final.tsx, page.tsx, globals.css + section ids in pool/endpoint/infra/dashboard-adjacent components.

---
Task ID: 11
Agent: main (Super Z)
Task: Remove the "Bursts in. Violations out. Zero." load-test section

Work Log:
- Removed <LoadTest /> + its import from src/app/page.tsx (section sat between Security and Audience)
- Deleted src/components/landing/loadtest.tsx (no other references anywhere in src/)
- Scroll rail unaffected — load-test was never a rail node; flow now Infra -> Security -> Audience -> Quickstart -> FinalCta

Verification:
- bun run lint: clean; GET / 200
- Browser: "Violations out" and "exit-non-zero" absent from rendered page; section count 14 -> 13; rail intact; no page errors

Stage Summary:
- DONE. Load-test section fully removed. Files: page.tsx, loadtest.tsx (deleted).

---
Task ID: 12
Agent: main (Super Z)
Task: Day/night theme toggle — night theme styled after the dark CTA card aesthetic the user liked (warm charcoal + emerald)

Work Log:
- Re-tuned the existing .dark token block from blue (hue 260) to WARM CHARCOAL (hue 90): bg oklch(0.152 0.004 90) ~#141210, elevated surfaces ~#1c1917 (stone-900), stone-100 foreground, emerald ring/accents unchanged
- Built a curated override sheet in globals.css (unlayered html.dark rules beat @layer utilities): ink scale (stone-900->100 ... stone-300->500), surfaces (bg-white -> stone-900; white/60-90 -> dark glass; stone-50/100/200/300 -> white at 4/6/9/14%; bg-[#f5f4f2] dashboard mock -> dark console), emerald/amber tints -> translucent glows, all border-stone-900/* alphas -> white borders, hover variants, text accents (emerald-600/700/800 -> 400/300, amber/rose -> 400-level)
- GUARD on ink/surface/tint rules: :not(:is(.bg-stone-900 *, .bg-stone-950 *, [class*="0c0a09"] *)) so the PrivacyBand, FinalCta card and ALL code terminals keep their native palette (verified in screenshots)
- Design-system classes overridden: .glass, .diffuse-card, .blueprint-grid, .stage-dots, .grain (0.05), .nice-scroll, .shimmer, .chip-served -> new opx-charge-dark keyframes (dark end state instead of white)
- Nav CTA (a.bg-stone-900) becomes emerald primary with dark text in night mode — matching the reference card's CTA
- ThemeToggle component (theme-toggle.tsx): useSyncExternalStore on <html> class (MutationObserver subscription — no setState-in-effect, lint-clean), Sun/Moon icons swapped purely via CSS (dark:block/dark:hidden) so SSR/pre-hydration paint is always correct, View Transitions API cross-fade on toggle (reduced-motion aware), localStorage "opx-theme" persistence
- layout.tsx: inline no-FOUC script as first body child (applies stored theme, else prefers-color-scheme) + suppressHydrationWarning already present; viewport.themeColor now light/dark media pair
- Marquee edge fades + footer watermark got dark: gradient variants in JSX
- Second-pass sweep diffed every stone/white/emerald/amber/rose token against the sheet — added missing tints (bg-amber-50/70, bg-emerald-50/70, bg-emerald-100/70, bg-stone-900/[0.07|0.09], text-amber-700/800, extra borders) after docs callouts rendered light in night mode

Verification:
- bun run lint: clean (fixed react-hooks/set-state-in-effect by switching to useSyncExternalStore)
- Day mode byte-identical restore after toggling back (screenshot); starts light in headless (no color-scheme preference)
- Night: hero/mid/end screenshots — warm charcoal, emerald CTA, guarded dark surfaces untouched, dark watermark gradient, rail flipped
- Persistence: localStorage survives reload (dark stays dark)
- /docs night: header, TOC, prose, tables, code blocks, callouts all correct after second pass
- Mobile 390: toggle visible next to hamburger, hero night correct
- Console + page errors: clean on both routes

Stage Summary:
- DONE. Full day/night theming with nav toggle (desktop + mobile, / and /docs), warm-charcoal night palette matching the dark CTA reference, no-FOUC load, persisted preference, View Transition cross-fade. Files: globals.css, theme-toggle.tsx (new), nav.tsx, layout.tsx, marquee.tsx, final.tsx.
