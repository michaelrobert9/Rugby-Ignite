import { renderCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og';
import { getSchoolBySlug } from '@/lib/store/read';

export const runtime = 'nodejs';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = 'School rating on Rugby Ignite';

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

export default async function Image(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const found = await getSchoolBySlug(slug);
  if (!found) {
    return renderCard({ eyebrow: 'RUGBY IGNITE', title: 'School Rugby Rankings' });
  }
  const { row, rank, total } = found;
  const delta = row.weekPoints == null || row.weekPoints === 0
    ? undefined
    : `${row.weekPoints > 0 ? '▲' : '▼'} ${Math.abs(row.weekPoints).toFixed(2)}`;
  return renderCard({
    eyebrow: `FIRST XV${row.province ? ` · ${row.province.toUpperCase()}` : ''}`,
    title: row.name,
    figure: row.rating.toFixed(2),
    figureLabel: `IGNITE RATING · ${ordinal(rank).toUpperCase()} OF ${total}`,
    delta,
  });
}
