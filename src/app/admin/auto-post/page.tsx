import Link from 'next/link';
import { getSiteSettings } from '@/lib/data/siteSettings';
import { getPost } from '@/lib/data/posts';
import { saveAutoPostAction, generateWeeklyPostNowAction, generateEosPostNowAction } from '@/lib/actions';

export const dynamic = 'force-dynamic';

function fmt(iso?: string): string {
  if (!iso) return 'never';
  return new Date(iso).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
}

export default async function AutoPostPage(props: PageProps<'/admin/auto-post'>) {
  const searchParams = await props.searchParams;
  const site = await getSiteSettings();
  const cfg = site.autoPost ?? {
    enabled: false, onlyWhenChanged: true, status: 'published' as const, eosEnabled: false, eosDelayDays: 3, eosPublishedSeasons: [],
  };
  const lastPost = cfg.lastPostId ? await getPost(cfg.lastPostId) : undefined;
  const ran = typeof searchParams.ran === 'string' ? searchParams.ran : '';

  return (
    <div className="space-y-6">
      {searchParams.saved === '1' && (
        <div className="rir-card p-4 text-sm" style={{ background: '#e9f7ee', borderColor: '#bfe3cc', color: 'var(--color-up)' }}>
          Auto-post settings saved.
        </div>
      )}
      {ran && (
        <div className="rir-card p-4 text-sm" style={{ background: ran.startsWith('skip') ? '#fdf3e7' : '#e9f7ee', borderColor: '#bfe3cc', color: 'var(--color-navy-900)' }}>
          {ran.startsWith('skip')
            ? `Nothing published — ${ran.slice(5).replace(/-/g, ' ')}.`
            : `Post created (${ran.split(':')[0]}).`}
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-navy-900)' }}>Auto-post</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Automatically publish a weekly ranking write-up to News (top 10, biggest movers, teams that dropped,
          key results and the full table), plus an end-of-season wrap-up. The words are generated from the live
          rankings — nothing is invented, and fallback copy is used when there isn&apos;t enough data yet.
        </p>
      </div>

      <form action={saveAutoPostAction} className="rir-card p-5 space-y-4">
        <label className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text)' }}>
          <input type="checkbox" name="enabled" defaultChecked={cfg.enabled} style={{ marginTop: 3 }} />
          <span><strong>Enable the weekly post.</strong> When on, the scheduler (below) publishes a weekly update.</span>
        </label>
        <label className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text)' }}>
          <input type="checkbox" name="onlyWhenChanged" defaultChecked={cfg.onlyWhenChanged} style={{ marginTop: 3 }} />
          <span><strong>Only post when the ranking changed</strong> since the last post. Off-season (no results, no change) is skipped. Untick to post every week regardless.</span>
        </label>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>Publish as</label>
          <select className="rir-input" name="status" defaultValue={cfg.status}>
            <option value="published">Published (live immediately)</option>
            <option value="draft">Draft (review before publishing)</option>
          </select>
        </div>

        <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 16 }} className="space-y-4">
          <label className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text)' }}>
            <input type="checkbox" name="eosEnabled" defaultChecked={cfg.eosEnabled} style={{ marginTop: 3 }} />
            <span><strong>Enable the end-of-season post.</strong> Published once per season, after the last fixture.</span>
          </label>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>Days after the last fixture before the end-of-season post</label>
            <input className="rir-input" name="eosDelayDays" type="number" min={0} step={1} defaultValue={cfg.eosDelayDays} style={{ maxWidth: 120 }} />
          </div>
        </div>

        <button type="submit" className="rir-btn rir-btn-primary">Save auto-post settings</button>
      </form>

      <div className="rir-card p-5 space-y-3">
        <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>Run now</h2>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Create a post immediately (ignores the enable + &ldquo;only when changed&rdquo; settings, so you can preview).
          It respects the Publish-as choice above.
        </p>
        <div className="flex flex-wrap gap-3">
          <form action={generateWeeklyPostNowAction}><button type="submit" className="rir-btn rir-btn-secondary">Generate weekly post now</button></form>
          <form action={generateEosPostNowAction}><button type="submit" className="rir-btn rir-btn-secondary">Generate end-of-season post now</button></form>
        </div>
        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Last run: {fmt(cfg.lastRunAt)}
          {lastPost && (
            <> · last post: <Link href={`/news/${lastPost.slug}`} className="rir-link" style={{ textDecoration: 'underline' }}>{lastPost.title}</Link> ({lastPost.status})</>
          )}
        </div>
      </div>

      <div className="rir-card p-5 text-sm space-y-2" style={{ color: 'var(--color-text-muted)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>Scheduling (once a week)</h2>
        <p>
          Firebase App Hosting has no built-in cron, so a scheduler calls the site once a week. Set up a
          <strong> Google Cloud Scheduler</strong> job (in the same project) with:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Frequency: <code>0 20 * * 0</code> (Sundays 20:00) — or whatever you prefer.</li>
          <li>Target: HTTP <strong>POST</strong> to <code>https://rugbyignite.co.za/api/auto-post</code></li>
          <li>Header: <code>x-ingest-secret: &lt;your INGEST_SECRET&gt;</code></li>
        </ul>
        <p>
          The endpoint publishes the weekly post (respecting the settings above) and the end-of-season post when
          it&apos;s due, so a single weekly job covers both. It&apos;s safe to call more often — an unchanged table
          is skipped and the season wrap-up only publishes once.
        </p>
      </div>
    </div>
  );
}
