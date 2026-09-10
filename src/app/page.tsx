import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Marquee } from "@/components/landing/marquee";
import { Compare } from "@/components/landing/compare";
import { Pool } from "@/components/landing/pool";
import { Bento } from "@/components/landing/bento";
import { Endpoint } from "@/components/landing/endpoint";
import { DashboardSection, PrivacyBand } from "@/components/landing/dashboard";
import { Infra, Security } from "@/components/landing/infra";
import { LoadTest } from "@/components/landing/loadtest";
import { Audience } from "@/components/landing/audience";
import { Quickstart } from "@/components/landing/quickstart";
import { FinalCta, Footer } from "@/components/landing/final";

export default function Home() {
  return (
    <>
      <div className="grain-overlay" aria-hidden />
      <Nav />
      <main className="flex-1">
        <Hero />
        <Marquee />
        <Compare />
        <Pool />
        <Bento />
        <Endpoint />
        <DashboardSection />
        <PrivacyBand />
        <Infra />
        <Security />
        <LoadTest />
        <Audience />
        <Quickstart />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
