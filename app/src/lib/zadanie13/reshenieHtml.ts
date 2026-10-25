/**
 * Решение задачи №13 разметкой — одна на все места: лист учителя
 * (экран и PDF), опорные задачи, тренажёр, онлайн-набор, разборы в
 * теории. Стили — app/zadaniya/13/reshenie13.css, он подключён и к
 * страницам раздела, и к страницам печати, и к сборке PDF в CI.
 *
 * Модуль изоморфный: на сборке им запечатываются решения, в браузере
 * — свежие задачи по «Ещё вариант».
 */

import { katex } from '../graph/katex';
import { typeset } from '../tex';
import { kletkiModeli, tablitsaHtml } from './html';
import { TABLE_HEAD } from './tablica';
import type { ShagBlok, SolutionStep, TableModel, TablitsaPeremennye } from './types';

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Знаки, после которых формулу можно перенести на новую строку. */
const OTNOSHENIE = /^(\s*\;\\Rightarrow\;\s*|\s*\\Rightarrow\s*|\s*=\s*|\s*\\le\s*|\s*\\ge\s*|\s*<\s*|\s*>\s*)/;

/**
 * Куски между верхними «=», «⇒», «<» — в фигурные скобки: KaTeX
 * переносит строку только после знака отношения, а не внутри скобок
 * вроде x(k^2 + k + 1).
 */
function poOtnosheniyam(tex: string): string {
  const kuski: string[] = [];
  let tek = '';
  let glubina = 0;
  for (let i = 0; i < tex.length; ) {
    const ost = tex.slice(i);
    if (ost.startsWith('\\left')) glubina++;
    else if (ost.startsWith('\\right')) glubina--;
    const c = tex[i]!;
    if (c === '{') glubina++;
    else if (c === '}') glubina--;
    const m = glubina === 0 ? OTNOSHENIE.exec(ost) : null;
    if (m && tek.trim()) {
      kuski.push(`{${tek}}`, m[0]);
      tek = '';
      i += m[0].length;
      continue;
    }
    tek += c;
    i++;
  }
  kuski.push(`{${tek}}`);
  return kuski.join('');
}

/**
 * Формула решения: строчный режим KaTeX, дроби — \dfrac. Длинная
 * цепочка переносится после «=» и не уезжает за край телефона; части
 * через \quad и \qquad — отдельными строками.
 */
const krupno = (tex: string) =>
  tex
    .replace(/\\frac(?=\{)/g, '\\dfrac')
    .split(/,\s*\\quad\s*|,?\s*\\qquad\s*/)
    .map(
      (chast) =>
        `<div class="z13-r-formula">${katex.renderToString(poOtnosheniyam(chast), { throwOnError: true })}</div>`,
    )
    .join('');

const stroka = (tex: string) => katex.renderToString(tex, { throwOnError: true });

/**
 * Стрелка над шапкой: от «Переплаты» к «Долгу на начало». Она живёт в
 * отдельной строке шапки, клетка которой растянута на столбцы 2–4; у
 * этих столбцов одна ширина (table-layout: fixed), поэтому центры их
 * заголовков всегда на 1/6 и 5/6 клетки — при любой ширине таблицы,
 * на экране и в печати, без пересчёта скриптом. Дуга тянется по ширине
 * (preserveAspectRatio="none", толщина линии не меняется), наконечник —
 * отдельный значок фиксированного размера на 1/6.
 */
function strelka(podpis: string): string {
  return (
    `<tr class="z13-r-strelka" aria-hidden="true"><td></td><td colspan="3">` +
    `<div class="z13-r-strelka__box">` +
    `<svg class="z13-r-strelka__duga" viewBox="0 0 600 40" preserveAspectRatio="none" focusable="false">` +
    `<path d="M500 40 C500 2 100 2 100 36" vector-effect="non-scaling-stroke"/></svg>` +
    `<svg class="z13-r-strelka__ostrie" viewBox="0 0 12 10" focusable="false"><path d="M0 0 L6 10 L12 0 Z"/></svg>` +
    `<span class="z13-r-strelka__text">${typeset(podpis)}</span>` +
    `</div></td><td></td></tr>`
  );
}

/** Таблица в переменных со стрелкой над шапкой. */
export function tablitsaPeremennyeHtml(t: TablitsaPeremennye): string {
  const h = TABLE_HEAD[t.scheme ?? 'dif'];
  const head =
    `<tr><th scope="col">${esc(h.period[t.period])}</th>` +
    h.cols.map((c) => `<th scope="col">${esc(c)}</th>`).join('') +
    `</tr>`;
  const body = t.rows
    .map((row) =>
      row === null
        ? /* Многоточие — текстом: \vdots у KaTeX несёт MathML-распорку с чёрным фоном. */
          `<tr class="z13-r-table__dots"><th scope="row">…</th>${'<td></td>'.repeat(4)}</tr>`
        : `<tr><th scope="row">${stroka(row.label)}</th>${row.cells.map((c) => `<td>${stroka(c)}</td>`).join('')}</tr>`,
    )
    .join('');
  const itog =
    t.itog === null
      ? ''
      : `<tr class="z13-r-table__itog"><th scope="row">Итого</th><td></td>` +
        `<td>${t.itog[0] ? stroka(t.itog[0]) : ''}</td><td>${stroka(t.itog[1])}</td><td></td></tr>`;
  return (
    `<figure class="z13-r-tab">` +
    (t.podpis ? `<figcaption>${typeset(t.podpis)}</figcaption>` : '') +
    `<div class="z13-r-tab__scroll"><table class="z13-r-table">` +
    `<colgroup><col class="z13-r-table__c0"><col><col><col><col></colgroup>` +
    `<thead>${t.strelka === null ? '' : strelka(t.strelka)}${head}</thead><tbody>${body}${itog}</tbody></table></div></figure>`
  );
}

function proporciya(rows: [string, string][], vyvod: string): string {
  const zapis = `\\begin{array}{rcl}${rows.map(([a, b]) => `${a} & \\text{—} & ${b}`).join('\\\\')}\\end{array}`;
  return `<div class="z13-r-proporciya">${krupno(zapis)}${krupno(vyvod)}</div>`;
}

function blokHtml(b: ShagBlok, kratko: boolean): string {
  switch (b.vid) {
    case 'formula':
      return krupno(b.tex);
    case 'text':
      return kratko ? '' : `<p>${typeset(b.text)}</p>`;
    case 'plashka':
      return kratko ? '' : `<p class="z13-r-plashka">${typeset(b.text)}</p>`;
    case 'melko':
      return kratko ? '' : `<p class="z13-r-melko">${typeset(b.text)}</p>`;
    case 'proporciya':
      return kratko ? krupno(b.vyvod) : proporciya(b.rows, b.vyvod);
    case 'tablitsa':
      return kratko ? '' : tablitsaPeremennyeHtml(b.t);
  }
}

export interface ReshenieOpts {
  /** Кратко для листа учителя: подписи шагов и формулы, без рамок, таблиц и пояснений. */
  kratko?: boolean;
}

/**
 * Шаги решения разметкой — по куску на шаг. Лист учителя кладёт каждый
 * кусок отдельно: пагинатор переносит шаги на следующую страницу, а не
 * режет длинное решение. Шаг «Ответ» не рисуется: строку ответа ставит
 * тот, кто показывает решение.
 */
export function reshenieChasti(
  solution: readonly SolutionStep[],
  tableModel: TableModel | null,
  opts: ReshenieOpts = {},
): string[] {
  const kratko = opts.kratko === true;
  return solution
    .filter((s) => s.title !== 'Ответ')
    .filter((s) => !(kratko && s.vid === 'ramka'))
    .map((s) => {
      const bloki = (s.bloki ?? []).map((b) => blokHtml(b, kratko)).join('');
      const formula = s.formula === undefined ? '' : krupno(s.formula);
      const table =
        s.table && tableModel !== null && !kratko ? tablitsaHtml(kletkiModeli(tableModel)) : '';
      const text = kratko && s.vid !== 'vnimanie' ? '' : ` ${typeset(s.text)}`;
      /* «Определяем тип платежа: долг уменьшается…» — текст со строчной идёт через двоеточие. */
      const znak = text !== '' && /^\p{Ll}/u.test(s.text) ? ':' : '.';
      const cls = s.vid === undefined ? 'z13-r-shag' : `z13-r-shag z13-r-shag--${s.vid}`;
      return `<div class="${cls}"><p class="z13-r-shag__head"><b>${typeset(s.title)}${znak}</b>${text}</p>${formula}${table}${bloki}</div>`;
    });
}

/** Решение одной разметкой: экран опорных задач, тренажёра, теории. */
export function reshenieHtml(
  solution: readonly SolutionStep[],
  tableModel: TableModel | null,
  opts: ReshenieOpts = {},
): string {
  return reshenieChasti(solution, tableModel, opts).join('');
}
