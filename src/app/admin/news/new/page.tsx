import Link from 'next/link';
import PostForm from '@/components/PostForm';
import type { Post } from '@/lib/types';

export const dynamic = 'force-dynamic';

const BLANK: Post = {
  id: '',
  slug: '',
  title: '',
  excerpt: '',
  body: '',
  author: 'Rugby Ignite',
  date: new Date().toISOString().slice(0, 10),
  status: 'draft',
};

export default function NewPostPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/news" className="text-xs hover:underline" style={{ color: 'var(--color-text-muted)' }}>
          ← News
        </Link>
        <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
          New post
        </h2>
      </div>
      <PostForm post={BLANK} />
    </div>
  );
}
