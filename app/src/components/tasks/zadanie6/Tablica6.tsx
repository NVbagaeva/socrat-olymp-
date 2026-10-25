import { clsx } from 'clsx';
import { Tex } from '@/components/ui/Tex';
import type { Tablica } from '@/lib/zadanie6/types';

/**
 * Таблица распределения задания №6: жирные заголовки строк слева, числа
 * по центру. На телефоне таблица не обрезается: она прокручивается
 * внутри своей рамки, а у края, за которым есть продолжение, видна тень
 * (фон с background-attachment: local — без скриптов). Подсветка
 * столбцов и строк бывает только в разборе.
 */
export function Tablica6({ t, className }: { t: Tablica; className?: string }) {
  const kolonki = new Set(t.vydelit ?? []);
  const stroki = new Set(t.vydelitStroki ?? []);
  return (
    <div className={clsx('z6-tablica', className)} role="region" aria-label="Таблица" tabIndex={0}>
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
}
