/**
 * Разбор текста правовых документов. Разметка в них простая —
 * заголовки «### », абзацы, списки «- » и **полужирный**, — поэтому
 * свой разбор на два десятка строк вместо библиотеки Markdown.
 */

export type Inline =
  { kind: 'text' | 'bold'; text: string } | { kind: 'link'; text: string; href: string };

export type LegalBlock =
  | { type: 'h'; id: string; text: string }
  | { type: 'p'; inlines: Inline[] }
  | { type: 'ul'; items: Inline[][] };

/* Адреса документов в тексте («budetege.ru/politika») становятся ссылками. */
const DOC_LINK = /budetege\.ru\/(politika|soglasie|soglashenie)/g;

function links(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(DOC_LINK)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ kind: 'text', text: text.slice(last, at) });
    out.push({ kind: 'link', text: m[0], href: `/${m[1]}/` });
    last = at + m[0].length;
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) });
  return out;
}

export function parseInline(text: string): Inline[] {
  return text
    .split('**')
    .flatMap((part, i): Inline[] =>
      part === '' ? [] : i % 2 === 1 ? [{ kind: 'bold', text: part }] : links(part),
    );
}

/** Якорь раздела: «1. Общие положения» → razdel-1, «Вариант Б — …» → variant-b. */
export function headingId(text: string): string {
  const num = /^(\d+)\./.exec(text);
  if (num) return `razdel-${num[1]}`;
  const variant = /^Вариант ([АБ])/.exec(text);
  if (variant) return variant[1] === 'А' ? 'variant-a' : 'variant-b';
  return `razdel-${text.length}`;
}

export function parseLegal(md: string): LegalBlock[] {
  const blocks: LegalBlock[] = [];
  let list: Inline[][] | null = null;

  for (const raw of md.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('- ')) {
      if (!list) {
        list = [];
        blocks.push({ type: 'ul', items: list });
      }
      list.push(parseInline(line.slice(2)));
      continue;
    }
    list = null;
    if (line === '') continue;
    if (line.startsWith('### ')) {
      const text = line.slice(4);
      blocks.push({ type: 'h', id: headingId(text), text });
    } else {
      blocks.push({ type: 'p', inlines: parseInline(line) });
    }
  }
  return blocks;
}

/** Текст раздела целиком, без разметки: для писем. */
export function plainText(blocks: LegalBlock[]): string {
  const inline = (xs: Inline[]) => xs.map((x) => x.text).join('');
  return blocks
    .map((b) =>
      b.type === 'h'
        ? b.text
        : b.type === 'p'
          ? inline(b.inlines)
          : b.items.map((it) => `— ${inline(it)}`).join('\n'),
    )
    .join('\n\n');
}

/** Блоки одного раздела: от заголовка с якорем до следующего заголовка. */
export function section(blocks: LegalBlock[], id: string): LegalBlock[] {
  const start = blocks.findIndex((b) => b.type === 'h' && b.id === id);
  if (start < 0) return [];
  const next = blocks.findIndex((b, i) => i > start && b.type === 'h');
  return blocks.slice(start + 1, next < 0 ? undefined : next);
}
