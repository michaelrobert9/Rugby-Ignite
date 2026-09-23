import type { MetadataRoute } from 'next';
import { getStandings, getSiteBuild } from '@/lib/store/read';
import { listArticles } from '@/lib/store/stateStore';
import { PROVINCES } from '@/lib/matchpulse/provinces';
import { seasonYears } from '@/lib/season';

export const dynamic = 'force-dynamic';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rugbyignite.co.za').replace(/\/$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [master, build, articles] = await Promise.all([
    getStandings('master'),
    getSiteBuild(),
    listArticles(200),
  ]);
  const lastmod = build.meta?.builtAt ? new Date(build.meta.builtAt) : new Date();
  const present = new Set(master.map((r) => r.province).filter(Boolean) as string[]);

  const evergreen: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: lastmod, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/how-it-works`, lastModified: lastmod, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE}/corrections`, lastModified: lastmod, changeFrequency: 'weekly', priority: 0.4 },
  ];

  const activeProvinces = PROVINCES.filter((p) => present.has(p.name));
  const years = seasonYears(build.seasons);

  const provinces: MetadataRoute.Sitemap = activeProvinces.map((p) => ({
    url: `${SITE}/ranking/${p.key}`,
    lastModified: lastmod,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Each season year is its own page (national + per province) so it can rank on its own.
  const seasonPages: MetadataRoute.Sitemap = years.map((y) => ({
    url: `${SITE}/rankings/${y}`,
    lastModified: lastmod,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));
  const provinceSeasonPages: MetadataRoute.Sitemap = activeProvinces.flatMap((p) =>
    years.map((y) => ({
      url: `${SITE}/ranking/${p.key}/${y}`,
      lastModified: lastmod,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  );

  const stories: MetadataRoute.Sitemap = articles.map((a) => {
    const slug = a.slug.split('/')[1];
    return {
      url: `${SITE}/${a.season}/${slug}`,
      lastModified: new Date(a.generatedAt),
      changeFrequency: 'yearly',
      priority: 0.5,
    };
  });

  return [...evergreen, ...seasonPages, ...provinces, ...provinceSeasonPages, ...stories];
}
