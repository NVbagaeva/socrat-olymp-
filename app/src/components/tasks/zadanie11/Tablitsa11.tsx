import { clsx } from 'clsx';
import { Tex } from '@/components/ui/Tex';
import { katex } from '@/lib/graph/katex';
import type { Tablitsa } from '@/lib/zadanie11/types';

/**
 * Ячейка таблицы. Ячейка-формула набирается с крупными дробями
 * (опция displayFrac, как в ключе учителя): 50/x в таблице должно
 * читаться, а не быть мелкой строчной дробью. Подписи с текстом —
 * обычным Tex.
 */
function Yacheyka({ text }: { text: string }) {
  const m = /^\$([^$]+)\$$/.exec(text);
  if (m === null || m[1] === undefined) {
    return <Tex text={text} />;
  }
  const html = katex.renderToString(m[1], { throwOnError: false, displayFrac: true });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Таблица модели задачи №11: S | v | t, A | p | t или развёрнутая
 * таблица концентрации. Ячейки — текст с формулами в $…$, набирает
 * KaTeX. Первая колонка — подписи строк. Одна разметка на теорию,
 * тренажёр и лист учителя.
 */
export function Tablitsa11({ table, className }: { table: Tablitsa; className?: string }) {
  return (
    <figure className={clsx('z11-tab', `z11-tab--${table.vid}`, className)}>
      {table.title === undefined ? null : (
        <figcaption className="z11-tab__title">
          <Tex text={table.title} />
        </figcaption>
      )}
      <div className="z11-tab__scroll">
        <table>
          <thead>
            <tr>
              {table.head.map((h, i) => (
                <th key={i} scope="col">
                  <Tex text={h} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) =>
                  c === 0 ? (
                    <th key={c} scope="row">
                      <Tex text={cell} />
                    </th>
                  ) : (
                    <td key={c}>
                      <Yacheyka text={cell} />
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
