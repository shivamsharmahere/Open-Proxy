import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "open-proxy — Run AI agents without fighting rate limits",
  description:
    "One OpenAI-compatible endpoint for all your AI providers and API keys. open-proxy queues, paces, load-balances, retries and fails over across your keys — so your agents keep running instead of hitting 429s.",
  keywords: [
    "open-proxy",
    "rate limit",
    "OpenAI-compatible proxy",
    "AI agents",
    "NVIDIA NIM",
    "OpenRouter",
    "TokenRouter",
    "load balancing",
    "self-hosted",
  ],
  authors: [{ name: "open-proxy contributors" }],
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "open-proxy — Run AI agents without fighting rate limits",
    description:
      "One proxy, every provider, zero 429s. Merge NVIDIA NIM, OpenRouter, TokenRouter and OpenAI keys into one intelligent pool.",
    siteName: "open-proxy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "open-proxy — Run AI agents without fighting rate limits",
    description: "One proxy, every provider, zero 429s.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#141210" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{var t=localStorage.getItem("opx-theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})()',
          }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
