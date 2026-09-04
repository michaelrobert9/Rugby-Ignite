import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { navPages } from "@/lib/data/pages";
import { getSiteSettings } from "@/lib/data/siteSettings";
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

export const metadata: Metadata = {
  title: "Rugby Ignite — School Rugby Rankings",
  description: "Ignite the passion. Honour the game. The complete record of South African school rugby.",
  icons: { icon: "/logo-icon.png", apple: "/logo-icon.png" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [nav, site] = await Promise.all([navPages(), getSiteSettings()]);
  const navItems = [
    ...nav.map((page) => ({ href: pageHref(page), label: page.navLabel })),
    { href: "/news", label: "News" },
    { href: "/admin", label: "Admin" },
  ];
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Serif:opsz,wght@8..144,500;8..144,600;8..144,700;8..144,800&family=IBM+Plex+Mono:wght@500;600&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {site.adsenseClient && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(site.adsenseClient)}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="min-h-full flex flex-col">
        <header className="relative" style={{ background: "var(--night)" }}>
          <div className="rir-container flex items-center justify-between h-16 gap-6">
            <Link href="/" className="flex items-center shrink-0" aria-label="Rugby Ignite home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-lockup.png" alt="Rugby Ignite" style={{ height: 40, width: "auto" }} />
            </Link>
            <SiteNav items={navItems} />
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer style={{ background: "var(--night)" }}>
          <div
            className="rir-container py-6 text-xs flex flex-wrap items-center gap-x-2 gap-y-1"
            style={{ color: "rgba(244,239,230,0.6)" }}
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
