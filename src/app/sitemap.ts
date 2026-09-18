import type { MetadataRoute } from 'next';
import { getStandings, schoolSlug, getSiteBuild } from '@/lib/store/read';
import { listArticles } from '@/lib/store/stateStore';

export const dynamic = 'force-dynamic';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rugbyignite.co.za').replace(/\/$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [master, build, articles] = await Promise.all([
    getStandings('master'),
    getSiteBuild(),
    listArticles(200),
  ]);
  const lastmod = build.meta?.builtAt ? new Date(build.meta.builtAt) : new Date();

  const evergreen: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: lastmod, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/ranking`, lastModified: lastmod, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/how-it-works`, lastModified: lastmod, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE}/corrections`, lastModified: lastmod, changeFrequency: 'weekly', priority: 0.4 },
    { url: `${SITE}/stories`, lastModified: lastmod, changeFrequency: 'weekly', priority: 0.6 },
  ];

  const schools: MetadataRoute.Sitemap = master.map((r) => ({
    url: `${SITE}/school/${schoolSlug(r.name)}`,
    lastModified: lastmod,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const stories: MetadataRoute.Sitemap = articles.map((a) => {
    const [, slug] = a.slug.split('/');
    return {
      url: `${SITE}/stories/${a.season}/${slug}`,
      lastModified: new Date(a.generatedAt),
      changeFrequency: 'yearly',
      priority: 0.5,
    };
  });

  return [...evergreen, ...schools, ...stories];
}
