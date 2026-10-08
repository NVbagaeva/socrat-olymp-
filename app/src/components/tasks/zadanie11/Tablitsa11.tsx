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

/** Подпись строки уравнения: стоит справа от неё, у таблицы смесей. */
export const PODPIS_URAVNENIYA = 'уравнение — по этой строке';
/** То же под таблицей на телефоне: справа места нет. */
export const PODPIS_URAVNENIYA_POD = 'Уравнение — по выделенной строке:';

/**
 * Таблица модели задачи №11: S | v | t, A | p | t или развёрнутая
 * таблица концентрации. Ячейки — текст с формулами в $…$, набирает
 * KaTeX. Первая колонка — подписи строк. Одна разметка на теорию,
 * тренажёр и лист учителя.
 *
 * Строка уравнения (table.uravnenie — у смесей это масса вещества)
 * подсвечена, справа от неё — выноска «уравнение — по этой строке».
 * Выноска стоит в отдельном столбце без рамок: так она всегда на
 * высоте своей строки. На узком экране (< 640 px) столбец скрыт, и
 * подпись встаёт под таблицей — в прокрутку вбок она не уходит.
 */
export function Tablitsa11({
  table,
  className,
  skryto,
  onOtkryt,
}: {
  table: Tablitsa;
  className?: string;
  /**
   * Тренажёр: клетки «строка:столбец», которые ещё не заполнены, —
   * пунктирные. Нажатие открывает клетку (onOtkryt).
   */
  skryto?: ReadonlySet<string>;
  onOtkryt?: (key: string) => void;
}) {
  const vynoska = table.uravnenie !== undefined;
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
              {vynoska ? <td className="z11-tab__vyn" aria-hidden="true" /> : null}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, r) => (
              <tr key={r} className={r === table.uravnenie ? 'is-uravnenie' : undefined}>
                {row.map((cell, c) =>
                  c === 0 ? (
                    <th key={c} scope="row">
                      <Tex text={cell} />
                    </th>
                  ) : (
                    <td key={c}>
                      {skryto?.has(`${r}:${c}`) ? (
                        <button
                          type="button"
                          className="z11-tab__pusto"
                          aria-label="Открыть клетку"
                          onClick={() => onOtkryt?.(`${r}:${c}`)}
                        />
                      ) : (
                        <Yacheyka text={cell} />
                      )}
                    </td>
                  ),
                )}
                {vynoska ? (
                  <td className="z11-tab__vyn">
                    {r === table.uravnenie ? (
                      <span className="z11-tab__vynoska">{PODPIS_URAVNENIYA}</span>
                    ) : null}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* На узком экране столбец выноски скрыт (CSS) — подпись под таблицей. */}
      {vynoska ? (
        <p className="z11-tab__vynoska-pod">
          <span aria-hidden="true">↑ </span>
          {PODPIS_URAVNENIYA_POD} <Tex text={table.rows[table.uravnenie ?? 0]?.[0] ?? ''} />
        </p>
      ) : null}
    </figure>
  );
}
