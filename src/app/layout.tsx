import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { navPages } from "@/lib/data/pages";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { getCurrentSeason, withSeason } from "@/lib/season";
import { ADSENSE_CLIENT } from "@/lib/adsense";
import { MATCHPULSE } from "@/lib/matchpulseLinks";
import type { Page } from "@/lib/types";
import SiteNav from "@/components/SiteNav";

// Route for a nav page: home -> '/', otherwise its stored slug.
function pageHref(page: Page): string {
  if (page.id === "home") return "/";
  return page.slug || "/";
}

// Deliberately not using next/font/google here: it fetches from Google Fonts
// at build time, which fails in offline/sandboxed environments. System fonts
// look clean for a data-table-heavy site like this and need no network call.

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings();
  const season = getCurrentSeason();
  return {
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
    { href: "/ranking", label: "Ranking" },
    { href: "/news", label: "News" },
    { href: "/how-it-works", label: "How the Rankings Work" },
    { href: "/admin", label: "Admin" },
  ];
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/* Brand Book v7.0 §05 — two families: Archivo Black (wordmark, ratings,
            headlines), self-hosted via @font-face in globals.css; Helvetica Neue
            (body / UI / labels) is a system stack with nothing to load. The
            font files are preloaded so the wordmark never flashes a fallback. */}
        <link
          rel="preload"
          href="/fonts/archivo-black-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {/* AdSense loader — loaded once, site-wide, so both Auto ads and the
            explicit rankings units can fill. Uses the configured publisher id,
            falling back to the site's own so the units always have a loader. */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(site.adsenseClient || ADSENSE_CLIENT)}`}
          crossOrigin="anonymous"
        />
        <header className="relative">
          {/* Top band — coal, carrying the mark + wordmark (the reversed lockup). */}
          <div style={{ background: "var(--coal)" }}>
            <div className="rir-container flex items-center py-6">
              <Link href="/" className="flex items-center shrink-0" style={{ gap: 14 }} aria-label="Rugby Ignite home">
                <span className="rir-mark" aria-hidden />
                <span className="flex flex-col" style={{ gap: 6 }}>
                  <span className="rir-wordmark">RUGBY IGNITE</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "clamp(9px, 2.6vw, 11px)",
                      color: "var(--on-coal-label)",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      lineHeight: 1.2,
                    }}
                  >
                    The ranking system school rugby deserves
                  </span>
                </span>
              </Link>
            </div>
          </div>
          {/* Menu bar — coal, sitting below the mark. */}
          <div style={{ background: "var(--coal)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="rir-container">
              <SiteNav items={navItems} />
            </div>
          </div>
          {/* Brand Book v7.0 — a 2px full-width heat rule closes the header. */}
          <div aria-hidden style={{ height: 2, background: "var(--heat-ramp-h)" }} />
        </header>
        <main className="flex-1">{children}</main>
        <footer style={{ background: "var(--night)" }}>
          <div className="rir-container py-6 text-xs" style={{ color: "var(--muted)" }}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span style={{ color: "var(--chalk)", fontWeight: 600 }}>Ignite the passion.</span>
              <span style={{ color: "var(--ember)", fontWeight: 600 }}>Honour the game.</span>
              <span>The complete record of South African school rugby.</span>
            </div>
            <div className="mt-2">
              Match data from{" "}
              <a href={MATCHPULSE.rugby} target="_blank" rel="noopener" style={{ color: "var(--chalk)", textDecoration: "underline" }}>
                Match Pulse
              </a>{" "}
              — Rugby Ignite does not record scores. First teams only. Not an official ranking, and not affiliated
              with or endorsed by World Rugby.
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/ranking" style={{ color: "var(--chalk)", textDecoration: "underline" }}>The full ranking</Link>
              <Link href="/how-it-works" style={{ color: "var(--chalk)", textDecoration: "underline" }}>How the rating works</Link>
              <Link href="/corrections" style={{ color: "var(--chalk)", textDecoration: "underline" }}>Corrections</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
