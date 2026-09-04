import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { navPages } from "@/lib/data/pages";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { getCurrentSeason, withSeason } from "@/lib/season";
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
    icons: { icon: "/logo-icon.png", apple: "/logo-icon.png" },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [nav, site] = await Promise.all([navPages(), getSiteSettings()]);
  const navItems = [
    ...nav.map((page) => ({ href: pageHref(page), label: page.navLabel })),
    { href: "/news", label: "News" },
    { href: "/admin", label: "Admin" },
  ];
  return (
    <html lang="en" className="h-full antialiased">
      {/* No custom <head>: the metadata head is injected automatically, and the
          brand type (Georgia + Courier New) is system-only, so no fonts load.
          The AdSense loader sits at the top of <body> when a publisher ID is set. */}
      <body className="min-h-full flex flex-col">
        {site.adsenseClient && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(site.adsenseClient)}`}
            crossOrigin="anonymous"
          />
        )}
        <header className="relative" style={{ background: "var(--night)" }}>
          <div className="rir-container flex items-center justify-between gap-6 py-3">
            <Link href="/" className="flex flex-col items-start shrink-0" style={{ gap: 4 }} aria-label="Rugby Ignite home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-lockup.png" alt="Rugby Ignite" style={{ height: 60, width: "auto" }} />
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 12,
                  color: "var(--muted)",
                  lineHeight: 1.2,
                }}
              >
                The ranking system school rugby deserves
              </span>
            </Link>
            <SiteNav items={navItems} />
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer style={{ background: "var(--night)" }}>
          <div
            className="rir-container py-6 text-xs flex flex-wrap items-center gap-x-2 gap-y-1"
            style={{ color: "var(--muted)" }}
          >
            <span style={{ color: "var(--chalk)", fontWeight: 600 }}>Ignite the passion.</span>
            <span style={{ color: "var(--ember)", fontWeight: 600 }}>Honour the game.</span>
            <span>The complete record of South African school rugby.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
