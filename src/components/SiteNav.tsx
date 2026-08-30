'use client';

import { useState } from 'react';
import Link from 'next/link';

export interface NavItem {
  href: string;
  label: string;
}

const HAIRLINE = '1px solid rgba(244, 239, 230, 0.1)';

export default function SiteNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop: inline links */}
      <nav className="hidden md:flex items-center gap-5">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="rir-nav-link whitespace-nowrap">
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Mobile: hamburger button */}
      <button
        type="button"
        className="md:hidden inline-flex items-center justify-center p-2 -mr-2 rounded"
        style={{ color: 'var(--chalk)' }}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile: dropdown panel */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <nav
            id="mobile-nav"
            className="md:hidden absolute left-0 right-0 top-full z-50 shadow-lg"
            style={{ background: 'var(--night)', borderTop: HAIRLINE }}
          >
            <div className="rir-container flex flex-col py-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="py-3 text-sm font-medium"
                  style={{ color: 'var(--chalk)', borderBottom: HAIRLINE }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
