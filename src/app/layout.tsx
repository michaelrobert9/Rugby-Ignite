import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

// Deliberately not using next/font/google here: it fetches from Google Fonts
// at build time, which fails in offline/sandboxed environments. System fonts
// look clean for a data-table-heavy site like this and need no network call.

export const metadata: Metadata = {
  title: "Rugby Ignite — School Rugby Rankings",
  description: "The ranking system school rugby deserves.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header style={{ background: "var(--color-navy-900)" }}>
          <div className="rir-container flex items-center justify-between h-16 gap-6">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-md font-bold text-sm"
                style={{ background: "var(--color-gold-500)", color: "var(--color-navy-950)" }}
              >
                RI
              </span>
              <span className="text-white font-semibold tracking-tight">Rugby Ignite</span>
            </Link>
            <nav className="flex items-center gap-5 overflow-x-auto">
              <Link href="/" className="rir-nav-link">
                Rankings
              </Link>
              <Link href="/provinces" className="rir-nav-link">
                Provinces
              </Link>
              <Link href="/results" className="rir-nav-link">
                Results
              </Link>
              <Link href="/admin" className="rir-nav-link">
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t" style={{ borderColor: "var(--color-border)" }}>
          <div className="rir-container py-6 text-xs" style={{ color: "var(--color-text-muted)" }}>
            Rugby Ignite — the ranking system school rugby deserves. Prototype build, seeded from
            historical results; live scoring lives in Match Pulse.
          </div>
        </footer>
      </body>
    </html>
  );
}
