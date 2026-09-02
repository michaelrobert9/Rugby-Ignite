import Link from 'next/link';
import { listPosts } from '@/lib/data/posts';

export const dynamic = 'force-dynamic';

export default async function AdminNewsPage() {
  const posts = await listPosts();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
            News ({posts.length})
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Weekly updates, results and announcements. Drafts stay hidden until published.
          </p>
        </div>
        <Link href="/admin/news/new" className="rir-btn rir-btn-primary">
          + New post
        </Link>
      </div>
      <div className="rir-table-wrap">
        <table className="rir-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Author</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td className="rir-data">{p.date}</td>
                <td className="font-medium">{p.title}</td>
                <td>{p.author}</td>
                <td>
                  <span
                    className="rir-badge"
                    style={
                      p.status === 'published'
                        ? { background: '#e9f7ee', color: 'var(--color-up)' }
                        : { background: '#efe7d7', color: 'var(--color-text-muted)' }
                    }
                  >
                    {p.status}
                  </span>
                </td>
                <td>
                  <Link href={`/admin/news/${p.id}`} className="text-xs hover:underline" style={{ color: 'var(--color-navy-900)' }}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
