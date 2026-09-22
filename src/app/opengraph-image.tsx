import { renderCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og';

export const runtime = 'nodejs';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = 'Rugby Ignite — South African school rugby rankings';

export default async function Image() {
  return renderCard({
    eyebrow: 'SOUTH AFRICAN SCHOOL RUGBY',
    title: 'The ranking system school rugby deserves.',
    figureLabel: 'THE IGNITE RATING · FIRST TEAM',
  });
}
