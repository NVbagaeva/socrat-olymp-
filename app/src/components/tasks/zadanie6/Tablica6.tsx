import { clsx } from 'clsx';
import { Tex } from '@/components/ui/Tex';
import type { Tablica } from '@/lib/zadanie6/types';

/**
 * Таблица распределения задания №6: жирные заголовки строк слева, числа
 * по центру. На телефоне таблица не обрезается: она прокручивается
 * внутри своей рамки, а у края, за которым есть продолжение, видна тень
 * (фон с background-attachment: local — без скриптов). Подсветка
 * столбцов и строк бывает только в разборе.
 *
 * Таблица из двух строк («значение / вероятность») в узком блоке
 * переворачивается: два столбца, значения идут вниз — читать удобнее,
 * прокручивать не нужно. В разметке оба вида, какой показать — решает
 * CSS по ширине блока (container query, zadanie6.css); скрытый вид
 * убран display: none и для чтения с экрана тоже. На печати — всегда
 * обычный.
 */
export function Tablica6({ t, className }: { t: Tablica; className?: string }) {
  const kolonki = new Set(t.vydelit ?? []);
  const stroki = new Set(t.vydelitStroki ?? []);
  const perevorot = t.stroki.length === 2 && (t.stroki[0]?.yach.length ?? 0) >= 3;
  const gorizontalnaya = (
    <div
      className={clsx('z6-tablica', perevorot ? 'z6-tablica--gor' : className)}
      role="region"
      aria-label="Таблица"
      tabIndex={0}
    >
      <table>
        <tbody>
          {t.stroki.map((s, i) => (
            <tr key={`${s.zag}${i}`} className={stroki.has(i) ? 'is-vydelena' : undefined}>
              <th scope="row">
                <Tex text={s.zag} />
              </th>
              {s.yach.map((c, j) => (
                <td key={j} className={kolonki.has(j) ? 'is-vydelen' : undefined}>
                  <Tex text={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  if (!perevorot) {
    return gorizontalnaya;
  }
  /* Перевёрнутый вид: строки исходной таблицы — столбцы, её столбцы —
     строки; выделение переходит вместе с ними. */
  const [a, b] = t.stroki as [Tablica['stroki'][number], Tablica['stroki'][number]];
  return (
    <div className={clsx('z6-tablica-blok', className)}>
      {gorizontalnaya}
      <div className="z6-tablica z6-tablica--vert" role="region" aria-label="Таблица">
        <table>
          <thead>
            <tr>
              {[a, b].map((s, i) => (
                <th key={i} scope="col" className={stroki.has(i) ? 'is-vydelen' : undefined}>
                  <Tex text={s.zag} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {a.yach.map((c, j) => (
              <tr key={j} className={kolonki.has(j) ? 'is-vydelena' : undefined}>
                <td className={stroki.has(0) ? 'is-vydelen' : undefined}>
                  <Tex text={c} />
                </td>
                <td className={stroki.has(1) ? 'is-vydelen' : undefined}>
                  <Tex text={b.yach[j] ?? ''} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
