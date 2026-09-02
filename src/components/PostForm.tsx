import { deletePostAction, savePostAction } from '@/lib/actions';
import type { Post } from '@/lib/types';

export default function PostForm({ post }: { post: Post }) {
  const isNew = !post.id;
  return (
    <div className="space-y-6">
      <form action={savePostAction} className="space-y-6">
        {post.id && <input type="hidden" name="id" value={post.id} />}

        <div className="rir-card p-5 space-y-4">
          <Field label="Title" name="title" defaultValue={post.title} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Author" name="author" defaultValue={post.author} />
            <Field label="Date" name="date" type="date" defaultValue={post.date} />
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Status
              </label>
              <select name="status" defaultValue={post.status} className="rir-input">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <Field
            label="URL slug"
            name="slug"
            defaultValue={post.slug}
            hint="Leave blank to generate from the title. The post lives at /news/<slug>."
          />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Excerpt
            </label>
            <textarea name="excerpt" defaultValue={post.excerpt} className="rir-input" rows={2} />
          </div>
        </div>

        <div className="rir-card p-5 space-y-3">
          <h3 className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>
            Body
          </h3>
          <div className="text-xs rounded-md p-3" style={{ background: '#efe7d7', color: 'var(--color-text-muted)' }}>
            <div className="font-semibold mb-1" style={{ color: 'var(--color-navy-900)' }}>
              Shortcodes &amp; formatting
            </div>
            <ul className="space-y-0.5">
              <li>
                <code>[rankings scope=&quot;master&quot;]</code> — embed the ranking table in a post.
              </li>
              <li>
                <code>## Heading</code>, <code>- list item</code>, <code>**bold**</code>, <code>[link](/results)</code>
              </li>
            </ul>
          </div>
          <textarea
            name="body"
            defaultValue={post.body}
            className="rir-input"
            rows={14}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
          />
        </div>

        <button type="submit" className="rir-btn rir-btn-primary">
          {isNew ? 'Create post' : 'Save post'}
        </button>
      </form>

      {post.id && (
        <form action={deletePostAction} className="rir-card p-5">
          <input type="hidden" name="id" value={post.id} />
          <button type="submit" className="rir-btn rir-btn-danger">
            Delete post
          </button>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = 'text',
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string | number;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </label>
      <input className="rir-input" type={type} name={name} defaultValue={defaultValue} />
      {hint && (
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {hint}
        </p>
      )}
    </div>
  );
}
