import { getSiteSettings } from '@/lib/data/siteSettings';
import { saveSeoAction } from '@/lib/actions';
import { getCurrentSeason, withSeason } from '@/lib/season';

export const dynamic = 'force-dynamic';

export default async function SeoSettingsPage(props: PageProps<'/admin/seo'>) {
  const searchParams = await props.searchParams;
  const site = await getSiteSettings();
  const season = getCurrentSeason();

  return (
    <div className="space-y-6">
      {searchParams.saved === '1' && (
        <div className="rir-card p-4 text-sm" style={{ background: '#e9f7ee', borderColor: '#bfe3cc', color: 'var(--color-up)' }}>
          SEO settings saved.
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-navy-900)' }}>SEO</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Site-wide search-engine settings. Use <code>{'{season}'}</code> anywhere the current year should appear —
          it becomes <strong>{season}</strong> now and rolls over automatically each year.
        </p>
      </div>

      <form action={saveSeoAction} className="space-y-6">
        <div className="rir-card p-5 space-y-4">
          <Field label="Meta title" name="seoTitle" defaultValue={site.seoTitle} preview={withSeason(site.seoTitle, season)} />
          <TextArea label="Meta description" name="seoDescription" defaultValue={site.seoDescription} preview={withSeason(site.seoDescription, season)} />
          <TextArea label="Keywords (comma-separated)" name="seoKeywords" defaultValue={site.seoKeywords} preview={site.seoKeywords ? withSeason(site.seoKeywords, season) : '—'} />
          <button type="submit" className="rir-btn rir-btn-primary">Save SEO settings</button>
        </div>
      </form>

      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        These set the site&apos;s default title, description and keywords (used on the home page and as the
        site-wide default). Individual pages can still carry their own title/description in Pages.
      </p>
    </div>
  );
}

function Field({ label, name, defaultValue, preview }: { label: string; name: string; defaultValue: string; preview: string }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</label>
      <input className="rir-input" name={name} defaultValue={defaultValue} />
      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Now: {preview}</p>
    </div>
  );
}

function TextArea({ label, name, defaultValue, preview }: { label: string; name: string; defaultValue: string; preview: string }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</label>
      <textarea className="rir-input" name={name} rows={3} defaultValue={defaultValue} />
      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Now: {preview}</p>
    </div>
  );
}
