import { savePageAction } from '@/lib/actions';
import type { Page } from '@/lib/types';

export default function PageForm({ page }: { page: Page }) {
  return (
    <form action={savePageAction} className="space-y-6">
      <input type="hidden" name="id" value={page.id} />

      <div className="rir-card p-5 space-y-4">
        <Field label="Page title (H1)" name="title" defaultValue={page.title} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Nav label" name="navLabel" defaultValue={page.navLabel} />
          <Field label="Nav order" name="navOrder" type="number" defaultValue={page.navOrder} />
          <label className="flex items-end gap-2 text-sm pb-2">
            <input type="checkbox" name="showInNav" defaultChecked={page.showInNav} />
            Show in navigation
          </label>
        </div>
      </div>

      <div className="rir-card p-5 space-y-4">
        <h3 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
          URL &amp; SEO
        </h3>
        <Field
          label="URL / slug"
          name="slug"
          defaultValue={page.slug}
          hint="The page's web address (for SEO/reference). Home is /."
        />
        <Field label="Meta title (browser tab / search results)" name="metaTitle" defaultValue={page.metaTitle} />
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
            Meta description
          </label>
          <textarea name="metaDescription" defaultValue={page.metaDescription} className="rir-input" rows={2} />
        </div>
      </div>

      <div className="rir-card p-5 space-y-3">
        <h3 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
          Body
        </h3>
        <div className="text-xs rounded-md p-3" style={{ background: '#efe7d7', color: 'var(--color-text-muted)' }}>
          <div className="font-semibold mb-1" style={{ color: 'var(--color-navy-900)' }}>
            Shortcodes &amp; formatting
          </div>
          <ul className="space-y-0.5">
            <li>
              <code>[rankings]</code> — inserts this page&apos;s ranking table.
            </li>
            <li>
              <code>[rankings toggle=&quot;true&quot;]</code> — the Master / Season switcher (home page).
            </li>
            <li>
              <code>[rankings province=&quot;Western Cape&quot;]</code> — a specific province&apos;s table.
            </li>
            <li>
              <code>## Heading</code>, <code>- list item</code>, <code>**bold**</code>, <code>[link](/)</code>
            </li>
          </ul>
        </div>
        <textarea
          name="body"
          defaultValue={page.body}
          className="rir-input"
          rows={14}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
        />
      </div>

      <button type="submit" className="rir-btn rir-btn-primary">
        Save page
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = 'text',
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string | number;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </label>
      <input className="rir-input" type={type} name={name} defaultValue={defaultValue} />
      {hint && (
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {hint}
        </p>
      )}
    </div>
  );
}
