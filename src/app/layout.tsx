import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import "./globals.css";
import { navPages } from "@/lib/data/pages";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { getCurrentSeason, withSeason } from "@/lib/season";
import { ADSENSE_CLIENT } from "@/lib/adsense";
import { MATCHPULSE } from "@/lib/matchpulseLinks";
import type { Page } from "@/lib/types";
import SiteNav from "@/components/SiteNav";
import Analytics from "@/components/Analytics";
import Logo from "@/components/Logo";

// Route for a nav page: home -> '/', otherwise its stored slug.
function pageHref(page: Page): string {
  if (page.id === "home") return "/";
  return page.slug || "/";
}

// Archivo Black (the wordmark / ratings / headline face) is self-hosted and
// loaded with next/font/local: it reads the font file from disk at build time
// (no network call, unlike next/font/google) and — crucially — emits it to
// /_next/static/media, which IS served on Firebase App Hosting. Referencing the
// file from /public via @font-face 404s there, so the CSS var falls through to
// the variable this exposes.
const archivoBlack = localFont({
  src: "../../public/fonts/archivo-black-latin.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-archivo-black",
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings();
  const season = getCurrentSeason();
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://rugbyignite.co.za").replace(/\/$/, "");
  return {
    metadataBase: new URL(base),
    title: withSeason(site.seoTitle || "Rugby Ignite — School Rugby Rankings", season),
    description: withSeason(site.seoDescription || "The complete record of South African school rugby.", season),
    keywords: site.seoKeywords ? withSeason(site.seoKeywords, season) : undefined,
    // The favicon / app icons come from the App Router file convention
    // (src/app/icon.png, apple-icon.png, favicon.ico), so no manual icons here.
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [nav, site] = await Promise.all([navPages(), getSiteSettings()]);
  // "How the Rankings Work" (methodology) sits after News, near the end.
  const METHODOLOGY_ID = "school-rugby-rankings-methodology";
  const primary = nav.filter((page) => page.id !== METHODOLOGY_ID);
  // "How the Rankings Work" now points at the method page rendered from the live
  // configuration (/how-it-works), not the CMS copy.
  const navItems = [
    ...primary.map((page) => ({ href: pageHref(page), label: page.navLabel })),
    { href: "/news", label: "News" },
    { href: "/how-it-works", label: "How the Rankings Work" },
  ];
  return (
    <html lang="en" className={`h-full antialiased ${archivoBlack.variable}`}>
      <body className="min-h-full flex flex-col">
        {/* AdSense loader — loaded once, site-wide, so both Auto ads and the
            explicit rankings units can fill. Uses the configured publisher id,
            falling back to the site's own so the units always have a loader. */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(site.adsenseClient || ADSENSE_CLIENT)}`}
          crossOrigin="anonymous"
        />
        {/* Google Analytics (GA4) — loads only when a measurement id is set, and
            not in the admin area. */}
        <Analytics id={site.gaMeasurementId ?? ""} />
        <header className="relative" style={{ background: "var(--paper)", borderBottom: "1px solid var(--rule)" }}>
          {/* v8 header — paper ground, the flame-shield lockup, single line, no tagline. */}
          <div className="rir-container flex items-center py-4">
            <Link href="/" className="shrink-0" aria-label="Rugby Ignite home">
              <Logo height={78} />
            </Link>
          </div>
          <div style={{ borderTop: "1px solid var(--rule)" }}>
            <div className="rir-container">
              <SiteNav items={navItems} />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer style={{ background: "var(--paper)", borderTop: "1px solid var(--rule)" }}>
          <div className="rir-container py-8 text-xs" style={{ color: "var(--body-2)" }}>
            <div style={{ marginBottom: 12 }}>
              <Logo variant="horizontal" height={34} />
            </div>
            <div style={{ maxWidth: "62ch", lineHeight: 1.8 }}>
              Match data from{" "}
              <a href={MATCHPULSE.rugby} target="_blank" rel="noopener" className="rir-link" style={{ textDecoration: "underline" }}>
                Match Pulse
              </a>{" "}
              — Rugby Ignite does not record scores. First teams only. Not an official ranking, and not affiliated
              with or endorsed by World Rugby.
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/ranking" className="rir-link" style={{ textDecoration: "underline" }}>The ranking</Link>
              <Link href="/how-it-works" className="rir-link" style={{ textDecoration: "underline" }}>How the rating works</Link>
              <Link href="/corrections" className="rir-link" style={{ textDecoration: "underline" }}>Corrections</Link>
              <Link href="/admin" className="rir-link" style={{ textDecoration: "underline" }}>Admin</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
