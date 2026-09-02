import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPost, listPublishedPosts } from '@/lib/data/posts';
import { RichText, type ShortcodeRenderer } from '@/lib/content';
import RankingsBlock from '@/components/RankingsBlock';
import type { Post } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function findPublished(slugParam: string): Promise<Post | undefined> {
  const slug = decodeURIComponent(slugParam);
  const direct = await getPost(slug);
  if (direct && direct.status === 'published') return direct;
  return (await listPublishedPosts()).find((p) => p.slug === slug);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
}

export async function generateMetadata(props: PageProps<'/news/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await findPublished(slug);
  if (!post) return {};
  return { title: `${post.title} — Rugby Ignite`, description: post.excerpt };
}

export default async function PostPage(props: PageProps<'/news/[slug]'>) {
  const { slug } = await props.params;
  const post = await findPublished(slug);
  if (!post) notFound();

  const renderShortcode: ShortcodeRenderer = (name, attrs, key) => {
    if (name !== 'rankings') return null;
    return (
      <RankingsBlock
        key={key}
        scope={attrs.scope ?? 'master'}
        province={attrs.province}
        toggle={attrs.toggle === 'true'}
      />
    );
  };

  return (
    <div className="rir-container py-8 space-y-4" style={{ maxWidth: '48rem' }}>
      <Link href="/news" className="text-xs hover:underline" style={{ color: 'var(--color-text-muted)' }}>
        ← News
      </Link>
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-navy-900)' }}>
        {post.title}
      </h1>
      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {fmtDate(post.date)} · {post.author}
      </div>
      <RichText body={post.body} renderShortcode={renderShortcode} />
    </div>
  );
}
