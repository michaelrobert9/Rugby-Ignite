'use client';

// Team name matching Match Pulse, with its crest — or a brand-coloured monogram
// when the organisation has no logo, or its crest URL fails to load (so a broken
// image never shows in the table).

import { useState } from 'react';
import { monogram } from './rankingCells';

export function TeamCell({ name, logoUrl, primaryColor }: { name: string; logoUrl: string | null; primaryColor: string | null }) {
  const [failed, setFailed] = useState(false);
  const showLogo = Boolean(logoUrl) && !failed;

  return (
    <div className="flex items-center gap-2">
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl as string}
          alt=""
          width={24}
          height={24}
          onError={() => setFailed(true)}
          style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }}
        />
      ) : (
        <span
          aria-hidden
          style={{
            width: 24, height: 24, borderRadius: 4, flexShrink: 0,
            background: primaryColor || 'var(--night)', color: 'var(--chalk)',
            fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {monogram(name)}
        </span>
      )}
      <span className="font-medium" style={{ color: 'var(--color-navy-900)' }}>{name}</span>
    </div>
  );
}
