/**
 * Таблицы и ответ задания №13 для показа: клетки в TeX и готовая
 * разметка. Модуль изоморфный: теория рисует клетки JSX-таблицей на
 * сервере, опорные задачи запечатывают разметку на сборке, а кнопка
 * «Ещё вариант» собирает её прямо в браузере.
 */

import { katex } from '../graph/katex';
import { typeset } from '../tex';
import { UNIT_LABEL } from './edinicy';
import { TABLE_FIELDS, TABLE_HEAD } from './tablica';
import type { ConditionTable, TableModel, Units } from './types';

/** Клетки таблицы: подписи столбцов текстом, подписи строк и клетки — TeX. */
export interface Kletki {
  head: string[];
  labels: string[];
  rows: string[][];
  itog?: string[];
}

/** Число из модели таблицы: целое — с пробелами по разрядам, дробь — до четырёх знаков. */
export function chislo(x: number): string {
  const r = Math.round(x * 10000) / 10000;
  const exact = Math.abs(r - x) < 1e-9;
  const [int, frac] = Math.abs(r).toFixed(4).replace(/0+$/, '').replace(/\.$/, '').split('.');
  const grouped =
    (int ?? '0').length > 4 ? (int ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, '\\,') : (int ?? '0');
  return `${exact ? '' : '\\approx '}${x < 0 ? '-' : ''}${grouped}${frac ? `{,}${frac}` : ''}`;
}

/** Таблица из модели движка: сокращённые строки 1, 2, 3, …, n. */
export function kletkiModeli(m: TableModel): Kletki {
  const h = TABLE_HEAD[m.scheme];
  const fields = TABLE_FIELDS[m.scheme];
  const labels: string[] = [];
  const rows: string[][] = [];
  for (const i of m.show) {
    if (i === 0) {
      labels.push('\\dots');
      rows.push(fields.map(() => '\\dots'));
      continue;
    }
    const row = m.rows[i - 1];
    if (!row) continue;
    labels.push(m.labels[i - 1] ?? String(i));
    rows.push(fields.map((f) => chislo(row[f] as number)));
  }
  const itog =
    m.totals && m.scheme === 'dif'
      ? ['', chislo(m.totals.change), chislo(m.totals.interest), '']
      : undefined;
  return { head: [h.period[m.period], ...h.cols], labels, rows, ...(itog ? { itog } : {}) };
}

/** Текст в клетке TeX: неразрывный пробел — «~», знак процента экранирован. */
function textTex(c: string): string {
  return `\\text{${c.replace(/%/g, '\\%').replace(/\u00a0/g, '~')}}`;
}

/** Таблица условия (график долга): клетки — текст. */
/**
 * Таблица условия на экран и в лист — строки по периодам, как все
 * таблицы раздела: «Дата | Долг» сверху, ниже строка на каждую дату.
 * В данных она записана как в задании («Дата | 15.01 | 15.02 …»).
 */
export function kletkiUsloviya(t: ConditionTable): Kletki {
  const periody = t.head.slice(1);
  return {
    head: [t.head[0] ?? '', ...t.rows.map((r) => r[0] ?? '')],
    labels: periody.map(textTex),
    rows: periody.map((_, j) => t.rows.map((r) => textTex(r[j + 1] ?? ''))),
  };
}

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function yacheyka(tex: string): string {
  return tex === '' ? '' : katex.renderToString(tex, { throwOnError: true });
}

/** Разметка таблицы — та же, что у таблицы теории (класс z13-tablitsa). */
export function tablitsaHtml(k: Kletki, podpis?: string): string {
  const head = k.head.map((h) => `<th scope="col">${escape(h)}</th>`).join('');
  const body = k.rows
    .map(
      (row, i) =>
        `<tr><th scope="row">${yacheyka(k.labels[i] ?? '')}</th>${row
          .map((c) => `<td>${yacheyka(c)}</td>`)
          .join('')}</tr>`,
    )
    .join('');
  const itog = k.itog
    ? `<tr class="z13-tablitsa__itog"><th scope="row">Итого</th>${k.itog
        .map((c) => `<td>${yacheyka(c)}</td>`)
        .join('')}</tr>`
    : '';
  const caption = podpis ? `<figcaption>${typeset(podpis)}</figcaption>` : '';
  return `<figure class="z13-tablitsa"><div class="z13-tablitsa__scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}${itog}</tbody></table></div>${caption}</figure>`;
}

/** «Ответ: 1 417,5 рублей», «Ответ: 12 %». */
export function otvetText(answer: number, units: Units): string {
  const [int, frac] = String(answer).split('.');
  const grouped = (int ?? '').length > 4 ? (int ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : int;
  const value = frac === undefined ? grouped : `${grouped},${frac}`;
  const label = UNIT_LABEL[units];
  return label === '' ? `${value}` : `${value} ${label}`;
}
