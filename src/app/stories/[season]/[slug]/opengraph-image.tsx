import { renderCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og';
import { readArticle } from '@/lib/store/stateStore';

export const runtime = 'nodejs';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = 'Rugby Ignite story';

export default async function Image(props: { params: Promise<{ season: string; slug: string }> }) {
  const { season, slug } = await props.params;
  const a = await readArticle(`${season}/${slug}`);
  if (!a) return renderCard({ eyebrow: 'RUGBY IGNITE · STORIES', title: 'School Rugby Rankings' });
  return renderCard({ eyebrow: a.dateline, title: a.title });
}
