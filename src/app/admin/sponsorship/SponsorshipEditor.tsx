'use client';

import { useState } from 'react';
import { saveSponsorAction } from '@/lib/actions';
import type { Sponsor } from '@/lib/data/siteSettings';

interface Scope {
  key: string; // 'main' or a province key
  label: string; // "Main" or the province name
  sponsor: Sponsor; // the raw stored sponsor for this scope (empty if none)
}

// Tabbed editor: a Main sponsor plus one tab per province, each sold and edited
// on its own. Every tab posts the same server action with a hidden `scope`.
export default function SponsorshipEditor({ scopes, initialScope }: { scopes: Scope[]; initialScope: string }) {
  const start = scopes.some((s) => s.key === initialScope) ? initialScope : scopes[0].key;
  const [active, setActive] = useState(start);
  const cur = scopes.find((s) => s.key === active) ?? scopes[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1" style={{ borderBottom: '1px solid var(--rule)' }}>
        {scopes.map((s) => {
          const on = s.key === active;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setActive(s.key)}
              className="px-3 py-2 text-sm font-semibold"
              style={{
                color: on ? 'var(--ink)' : 'var(--body-2)',
                borderBottom: `3px solid ${on ? 'var(--ember-deep)' : 'transparent'}`,
                marginBottom: -1,
                background: 'none',
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Remount on tab change so the fields reset to that scope's stored values. */}
      <form key={active} action={saveSponsorAction} className="rir-card p-5 space-y-4">
        <input type="hidden" name="scope" value={active} />

        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-navy-900)' }}>
            {cur.key === 'main' ? 'Main sponsor' : `${cur.label} sponsor`}
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {cur.key === 'main'
              ? 'Shown on the home page and used on any province that has no sponsor of its own.'
              : `Shown only on the ${cur.label} pages. Leave blank to inherit the main sponsor.`}
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
            Sponsor name
          </label>
          <input className="rir-input" name="sponsorName" defaultValue={cur.sponsor.name} placeholder="e.g. Acme Sports" />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
            Logo image URL (optional)
          </label>
          <input className="rir-input" name="sponsorLogoUrl" defaultValue={cur.sponsor.logoUrl} placeholder="https://…/sponsor-logo.png" />
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            If set, the logo image shows instead of the name. Use a transparent PNG/SVG; it renders about 30px tall.
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
            Sponsor link (optional)
          </label>
          <input className="rir-input" name="sponsorUrl" defaultValue={cur.sponsor.url} placeholder="https://sponsor.example" />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
            Lead-in text
          </label>
          <input className="rir-input" name="sponsorLabel" defaultValue={cur.sponsor.label} placeholder="In association with" />
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            The small line before the sponsor. Leave blank for the default “In association with”.
          </p>
        </div>

        <button type="submit" className="rir-btn rir-btn-primary">
          Save {cur.key === 'main' ? 'main sponsor' : `${cur.label} sponsor`}
        </button>
      </form>
    </div>
  );
}
