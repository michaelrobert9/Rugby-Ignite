import React from 'react';
import Link from 'next/link';

// Lightweight, safe renderer for editable page bodies. Supports a small
// markdown subset (headings, lists, bold, italic, links) plus [shortcode]
// tokens on their own line. Everything is built as React nodes — no raw HTML —
// so authored content can't inject markup.

export type ShortcodeRenderer = (
  name: string,
  attrs: Record<string, string>,
  key: string,
) => React.ReactNode;

const ATTR_RE = /([\w-]+)="([^"]*)"/g;
const SHORTCODE_LINE_RE = /^\[([a-zA-Z][\w-]*)((?:\s+[\w-]+="[^"]*")*)\s*\]$/;

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const m of raw.matchAll(ATTR_RE)) attrs[m[1]] = m[2];
  return attrs;
}

// Inline formatting: **bold**, *italic*, [text](url).
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const tokenRe = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(tokenRe)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    const tok = m[0];
    if (tok.startsWith('**')) {
      out.push(<strong key={`${keyBase}-b${i}`}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith('*')) {
      out.push(<em key={`${keyBase}-i${i}`}>{tok.slice(1, -1)}</em>);
    } else {
      const lm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok);
      if (lm) {
        out.push(
          <Link key={`${keyBase}-l${i}`} href={lm[2]} className="rir-link hover:underline">
            {lm[1]}
          </Link>,
        );
      }
    }
    last = idx + tok.length;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function RichText({
  body,
  renderShortcode,
}: {
  body: string;
  renderShortcode: ShortcodeRenderer;
}) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const nodes: React.ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let k = 0;

  const flushPara = () => {
    if (!para.length) return;
    nodes.push(
      <p key={`p${k++}`} className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
        {renderInline(para.join(' '), `p${k}`)}
      </p>,
    );
    para = [];
  };
  const flushList = () => {
    if (!list.length) return;
    nodes.push(
      <ul key={`u${k++}`} className="list-disc pl-5 text-sm space-y-1" style={{ color: 'var(--color-text-muted)' }}>
        {list.map((li, j) => (
          <li key={j}>{renderInline(li, `u${k}-${j}`)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      return;
    }
    const sc = SHORTCODE_LINE_RE.exec(line);
    if (sc) {
      flushPara();
      flushList();
      nodes.push(renderShortcode(sc[1], parseAttrs(sc[2] || ''), `sc${i}`));
      return;
    }
    if (line.startsWith('### ')) {
      flushPara();
      flushList();
      nodes.push(<h3 key={`h${k++}`} className="text-base font-semibold">{line.slice(4)}</h3>);
      return;
    }
    if (line.startsWith('## ')) {
      flushPara();
      flushList();
      nodes.push(<h2 key={`h${k++}`} className="text-lg font-semibold">{line.slice(3)}</h2>);
      return;
    }
    if (line.startsWith('- ')) {
      flushPara();
      list.push(line.slice(2));
      return;
    }
    flushList();
    para.push(line);
  });
  flushPara();
  flushList();

  return <div className="rir-prose space-y-4">{nodes}</div>;
}
