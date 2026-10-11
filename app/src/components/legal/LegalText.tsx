import type { Inline, LegalBlock } from '@/lib/legal/markdown';

function Inlines({ items }: { items: Inline[] }) {
  return (
    <>
      {items.map((x, i) =>
        x.kind === 'bold' ? (
          <strong key={i}>{x.text}</strong>
        ) : x.kind === 'link' ? (
          <a key={i} href={x.href}>
            {x.text}
          </a>
        ) : (
          <span key={i}>{x.text}</span>
        ),
      )}
    </>
  );
}

/** Текст документа: заголовки разделов с якорями, абзацы, списки. */
export function LegalText({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <>
      {blocks.map((b, i) =>
        b.type === 'h' ? (
          <h2 key={i} id={b.id} className="legal__h">
            {b.text}
          </h2>
        ) : b.type === 'p' ? (
          <p key={i}>
            <Inlines items={b.inlines} />
          </p>
        ) : (
          <ul key={i}>
            {b.items.map((it, j) => (
              <li key={j}>
                <Inlines items={it} />
              </li>
            ))}
          </ul>
        ),
      )}
    </>
  );
}
