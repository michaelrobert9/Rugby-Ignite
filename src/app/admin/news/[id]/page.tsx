import Link from 'next/link';
import { notFound } from 'next/navigation';
import PostForm from '@/components/PostForm';
import { getPost } from '@/lib/data/posts';

export const dynamic = 'force-dynamic';

export default async function EditPostPage(props: PageProps<'/admin/news/[id]'>) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const post = await getPost(id);
  if (!post) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link href="/admin/news" className="text-xs hover:underline" style={{ color: 'var(--color-text-muted)' }}>
            ← News
          </Link>
          <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
            Edit “{post.title}”
          </h2>
        </div>
        {post.status === 'published' && (
          <Link href={`/news/${encodeURIComponent(post.slug)}`} className="rir-btn rir-btn-secondary" target="_blank">
            View post ↗
          </Link>
        )}
      </div>

      {searchParams.saved === '1' && (
        <div className="rir-card p-4 text-sm" style={{ background: '#e9f7ee', borderColor: '#bfe3cc', color: 'var(--color-up)' }}>
          Post saved.
        </div>
      )}

      <PostForm post={post} />
    </div>
  );
}
