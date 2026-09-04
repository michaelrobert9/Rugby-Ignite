// Shared WordPress (WXR / Gutenberg HTML) -> site markdown-lite converter.
// Used by import-wordpress-posts.mjs and import-wordpress-pages.mjs.

const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘',
  ldquo: '“', rdquo: '”', eacute: 'é', egrave: 'è', ouml: 'ö', euml: 'ë',
};

export function decode(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => (n in NAMED ? NAMED[n] : m));
}

export function cdata(block, tag) {
  const m = block.match(new RegExp(`<${tag.replace(':', '\\:')}>([\\s\\S]*?)</${tag.replace(':', '\\:')}>`));
  if (!m) return '';
  return m[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

export function inline(html) {
  return decode(
    html
      .replace(/<\s*br\s*\/?>/gi, ' ')
      .replace(/<\/?(strong|b)\s*>/gi, '**')
      .replace(/<\/?(em|i)\s*>/gi, '*')
      .replace(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
        const t = text.replace(/<[^>]+>/g, '').trim();
        return `[${t}](${href})`;
      })
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\*\*\s*\*\*/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function cellText(html) {
  return inline(html).replace(/\|/g, '/').trim();
}

function tableToMarkdown(tableHtml) {
  const rows = [];
  for (const tr of tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [];
    for (const c of tr[1].matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)) cells.push(cellText(c[1]));
    if (cells.length) rows.push(cells);
  }
  if (!rows.length) return '';
  const width = Math.max(...rows.map((r) => r.length));
  const pad = (r) => { while (r.length < width) r.push(''); return r; };
  const out = [];
  out.push('| ' + pad(rows[0]).join(' | ') + ' |');
  out.push('| ' + Array(width).fill('---').join(' | ') + ' |');
  for (const r of rows.slice(1)) out.push('| ' + pad(r).join(' | ') + ' |');
  return out.join('\n');
}

export function htmlToMarkdown(html) {
  let s = html.replace(/<!--[\s\S]*?-->/g, '');

  const tables = [];
  s = s.replace(/<table\b[\s\S]*?<\/table>/gi, (t) => { tables.push(tableToMarkdown(t)); return `\n TABLE${tables.length - 1} \n`; });

  // <details><summary>Q</summary>A</details>  ->  ### Q \n A
  s = s.replace(/<details\b[^>]*>\s*<summary\b[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi,
    (_, q, a) => `\n### ${inline(q)}\n${a}\n`);

  s = s.replace(/<figure\b[^>]*>([\s\S]*?)<\/figure>/gi, (_, inner) => inner);
  s = s.replace(/<img\b[^>]*>/gi, (img) => {
    const srcM = img.match(/\bsrc="([^"]*)"/i);
    const altM = img.match(/\balt="([^"]*)"/i);
    return srcM ? `\n![${altM ? decode(altM[1]) : ''}](${srcM[1]})\n` : '';
  });
  s = s.replace(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/gi, (_, t) => `\n*${inline(t)}*\n`);

  s = s.replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => `\n## ${inline(t)}\n`);
  s = s.replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => `\n## ${inline(t)}\n`);
  s = s.replace(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => `\n### ${inline(t)}\n`);
  s = s.replace(/<h4\b[^>]*>([\s\S]*?)<\/h4>/gi, (_, t) => `\n### ${inline(t)}\n`);

  s = s.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => `\n- ${inline(t)}`);
  s = s.replace(/<\/?(ul|ol)\b[^>]*>/gi, '\n');

  s = s.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (_, t) => `\n${inline(t)}\n`);

  s = s.replace(/<hr\b[^>]*\/?>/gi, '\n');
  s = s.replace(/<\/?(div|section|blockquote|span|summary|details)\b[^>]*>/gi, '\n');

  s = decode(
    s
      .replace(/<\/?(strong|b)\s*>/gi, '**')
      .replace(/<\/?(em|i)\s*>/gi, '*')
      .replace(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => `[${text.replace(/<[^>]+>/g, '').trim()}](${href})`)
      .replace(/<[^>]+>/g, ''),
  );

  s = s.replace(/ TABLE(\d+) /g, (_, i) => tables[Number(i)]);
  return s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function slugify(t) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

export function parseItems(xml) {
  return xml.split('<item>').slice(1).map((s) => '<item>' + s.split('</item>')[0]);
}
