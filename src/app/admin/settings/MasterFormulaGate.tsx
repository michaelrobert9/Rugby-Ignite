'use client';

import { useState } from 'react';

// Locks the Master formula so it can't be changed by accident. A disabled
// <fieldset> both greys out and, crucially, stops its inputs from being
// submitted — so while it's locked the saved values are left exactly as they
// are (the server action falls back to the current value for any absent field).
export default function MasterFormulaGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <div>
      <label
        className="flex items-center gap-2 text-sm cursor-pointer mb-3"
        style={{ color: unlocked ? 'var(--ember)' : 'var(--color-text-muted)' }}
      >
        <input
          type="checkbox"
          checked={unlocked}
          onChange={(e) => setUnlocked(e.target.checked)}
        />
        <span>
          {unlocked
            ? 'Unlocked — take care, these values change every historical rating.'
            : '🔒 Locked. Tick to edit the Master formula.'}
        </span>
      </label>
      <fieldset
        disabled={!unlocked}
        style={{ opacity: unlocked ? 1 : 0.55, border: 'none', margin: 0, padding: 0 }}
      >
        {children}
      </fieldset>
    </div>
  );
}
