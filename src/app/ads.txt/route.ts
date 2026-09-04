import { getSiteSettings } from '@/lib/data/siteSettings';

export const dynamic = 'force-dynamic';

// Serves /ads.txt. Uses the admin-provided contents if set; otherwise, when a
// publisher id is configured, generates the standard single-line AdSense entry.
export async function GET() {
  const { adsTxt, adsenseClient } = await getSiteSettings();
  let body = adsTxt.trim();
  if (!body && adsenseClient) {
    const pub = adsenseClient.replace(/^ca-/, ''); // ads.txt uses pub-…, not ca-pub-…
    body = `google.com, ${pub}, DIRECT, f08c47fec0942fa0`;
  }
  return new Response(body + '\n', {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
