/**
 * Три листа из одной партии вариантов: ученик, учитель, разбор для
 * ученика — и «всё одним файлом» (три части, каждая с новой страницы).
 *
 * Листы ничего не генерируют: на входе готовый `VariantSet` (тот же
 * объект, что на экране), на выходе описание для шаблона lib/sheet
 * (`buildDocument`). Поэтому задачи на трёх листах всегда одни и те же.
 *
 *   Ученик  — шапка, поля, инструкция, задания с рисунками, бланк ответов.
 *             Ни ответов, ни пометок «банк/новая», ни построений, ни кода.
 *   Учитель — та же шапка, сразу таблица ответов (с источником и
 *             сложностью), затем задания с решениями по шагам и рисунками
 *             с построениями.
 *   Разбор  — задания и подробные ученические разборы с ответом.
 *
 * Длинное решение режется на куски по шагам: лист переносит шаги на
 * следующую страницу, а не теряет решение, которое выше страницы.
 */

import { VARIANT_SHEET as T } from '@/content/variant';
import { figure as figureHtml } from '@/lib/sheet/sheet.js';
import typo from '@/lib/sheet/typography.js';
import type { Figure, Numbering, VariantMeta, VariantSet, VariantTask } from './types';

export type SheetKind = 'uchenik' | 'uchitel' | 'razbor';
export type SheetChoice = SheetKind | 'vse';

export const SHEET_KINDS: readonly SheetKind[] = ['uchenik', 'uchitel', 'razbor'];

/** Клетка чертежа, мм: чуть мельче, чем у листов разделов, — лист компактный. */
const CELL = 3.0;

/** Рисунки разделов на листе варианта мельче: справа от текста — не шире этого, мм. */
const FIG_SCALE = 0.8;
const FIG_SIDE_MAX = 56;
/** Рисунок шире этого (до сжатия), мм, встаёт под условие. */
const FIG_WIDE = 72;
const FIG_BELOW_MAX = 110;

/** Размер рисунка на листе варианта: сжатие и правило «широкий — под текст». */
export function sheetFigure(f: Figure): { width: number | undefined; below: boolean } {
  if (f.width === undefined) return { width: undefined, below: f.below === true };
  const below = f.below === true || f.width > FIG_WIDE;
  const w = f.width * FIG_SCALE;
  return { width: Math.round(Math.min(w, below ? FIG_BELOW_MAX : FIG_SIDE_MAX) * 10) / 10, below };
}

/** Бланк ответов: клеток в строке и колонок строк. */
const BLANK_CELLS = 10;
const BLANK_COLUMNS = 3;

/* ── Номера и подписи ───────────────────────────────────────────── */

/** Номер задачи на листе: как в ЕГЭ или сквозной. */
export function sheetNo(task: VariantTask, index: number, numbering: Numbering): number {
  return numbering === 'ege' ? task.egeNumber : index + 1;
}

export function starsText(stars: number | null): string {
  return stars === null ? T.noLevel : '★'.repeat(stars) + '☆'.repeat(3 - stars);
}

/** Название работы из шапки. */
export function workTitle(
  meta: VariantMeta,
  kinds: readonly { id: string; label: string }[],
): string {
  if (meta.kind === 'custom') return meta.customTitle.trim() || 'Работа';
  return kinds.find((k) => k.id === meta.kind)?.label ?? 'Вариант в формате ЕГЭ';
}

/** Дата ГГГГ-ММ-ДД → «24.10.2026». */
export function dateRu(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m === null ? iso : `${m[3]}.${m[2]}.${m[1]}`;
}

/* ── Разрезание решения на куски ────────────────────────────────── */

const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'col', 'wbr', 'source']);
const TAG = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)\b[^>]*?(\/?)>/g;

interface Piece {
  html: string;
  /** Открывающий тег элемента верхнего уровня, если кусок — элемент. */
  open: string | null;
  name: string | null;
  inner: string;
}

/** Куски верхнего уровня: элементы целиком и текст между ними. */
function topLevel(html: string): Piece[] {
  const out: Piece[] = [];
  let depth = 0;
  let start = 0;
  let open: { tag: string; name: string; end: number } | null = null;
  TAG.lastIndex = 0;
  for (let m = TAG.exec(html); m !== null; m = TAG.exec(html)) {
    if (m[0].startsWith('<!--')) continue;
    const closing = m[1] === '/';
    const name = (m[2] ?? '').toLowerCase();
    const selfClosing = m[3] === '/' || VOID.has(name);
    if (!closing) {
      if (depth === 0) {
        const text = html.slice(start, m.index);
        if (text.trim() !== '') out.push({ html: text, open: null, name: null, inner: text });
        start = m.index;
        if (selfClosing) {
          out.push({ html: m[0], open: null, name, inner: '' });
          start = m.index + m[0].length;
          continue;
        }
        open = { tag: m[0], name, end: m.index + m[0].length };
      }
      if (!selfClosing) depth += 1;
    } else {
      depth -= 1;
      if (depth === 0 && open !== null) {
        const end = m.index + m[0].length;
        out.push({
          html: html.slice(start, end),
          open: open.tag,
          name: open.name,
          inner: html.slice(open.end, m.index),
        });
        start = end;
        open = null;
      }
      if (depth < 0) return [{ html, open: null, name: null, inner: html }];
    }
  }
  const rest = html.slice(start);
  if (rest.trim() !== '') out.push({ html: rest, open: null, name: null, inner: rest });
  return out;
}

/**
 * Куски решения для потока листа. Список шагов (`<ol>`) режется по
 * пунктам с сохранением нумерации (`start`), обёртка из нескольких
 * детей — по детям; остальное идёт целиком.
 */
export function splitSolution(html: string, depth = 0): string[] {
  const pieces = topLevel(html);
  return pieces.flatMap((p) => {
    if (p.open === null || p.name === null || depth > 1) return [p.html];
    const kids = topLevel(p.inner).filter((k) => k.html.trim() !== '');
    if (kids.length < 2 || p.html.length < 1500) return [p.html];
    if (p.name === 'ol' || p.name === 'ul') {
      let n = 1;
      const startAttr = /\bstart="(\d+)"/.exec(p.open);
      if (startAttr !== null) n = Number(startAttr[1]);
      return kids.map((k) => {
        const tag =
          p.name === 'ol' ? p.open?.replace(/^<ol\b(?![^>]*\bstart=)/, `<ol start="${n}"`) : p.open;
        if (k.name === 'li') n += 1;
        return `${tag ?? ''}${k.html}</${p.name ?? 'div'}>`;
      });
    }
    if (p.name !== 'div' && p.name !== 'section') return [p.html];
    return kids.flatMap((k) =>
      splitSolution(k.html, depth + 1).map((part) => `${p.open ?? ''}${part}</${p.name ?? 'div'}>`),
    );
  });
}

/* ── Куски листа ────────────────────────────────────────────────── */

function item(cls: string, html: string, attrs = ''): string {
  return `<div class="sheet-item ${cls}"${attrs}>${html}</div>`;
}

function figureItem(f: Figure | null, cls: string): string {
  if (f === null) return '';
  return item(
    cls,
    figureHtml(f.svg, { cell: CELL, frame: null, width: sheetFigure(f).width ?? null }),
  );
}

function card(task: VariantTask, no: number, prefix = '') {
  const size = task.figure === null ? null : sheetFigure(task.figure);
  return {
    no,
    id: task.taskId,
    questionHtml: prefix + task.statement,
    options: null,
    figureSvg: task.figure?.svg ?? null,
    figureWidth: size?.width,
    figureBelow: size?.below === true,
    solutionHtml: null,
  };
}

function instructionItem(text: string): string {
  return item(
    'var-instruction',
    `<p class="var-instruction__title">${typo.escape(T.instructionTitle)}</p>` +
      `<p class="var-instruction__text">${typo.text(text)}</p>`,
  );
}

/** Бланк ответов в стиле ЕГЭ: номер задания и клеточки. */
function blankItem(numbers: number[]): string {
  const cells = Array.from({ length: BLANK_CELLS }, () => '<i></i>').join('');
  const rows = numbers
    .map(
      (n) =>
        `<div class="var-blank__row"><span class="var-blank__no">${n}</span>` +
        `<span class="var-blank__cells">${cells}</span></div>`,
    )
    .join('');
  return item(
    'var-blank',
    `<p class="var-blank__title">${typo.escape(T.blankTitle)}</p>` +
      `<div class="var-blank__grid" style="grid-template-rows:repeat(${Math.ceil(numbers.length / BLANK_COLUMNS)},auto)">${rows}</div>`,
    ' data-keep-together="1"',
  );
}

/** Таблица ответов учителя: номер, ответ, источник, сложность. */
function keyItem(tasks: readonly VariantTask[], numbering: Numbering, code: string | null): string {
  const rows = tasks
    .map(
      (t, i) =>
        `<tr><th scope="row">${sheetNo(t, i, numbering)}</th>` +
        `<td class="var-key__answer" data-answer="${typo.attr(t.answer)}">${t.answerHtml}</td>` +
        `<td class="var-key__source">${typo.escape(t.source.label)}</td>` +
        `<td class="var-key__level">${typo.escape(starsText(t.difficulty))}</td></tr>`,
    )
    .join('');
  return item(
    'var-key',
    `<table class="var-key__table"><caption>${typo.escape(T.keyTitle)}` +
      (code === null ? '' : `<span class="var-key__code">${typo.escape(T.code(code))}</span>`) +
      `</caption>` +
      `<thead><tr><th>${T.blankNo}</th><th>${T.answer}</th><th>${T.keySource}</th><th>${T.keyLevel}</th></tr></thead>` +
      `<tbody>${rows}</tbody></table>`,
  );
}

function solutionHead(task: VariantTask, no: number, withMeta: boolean): string {
  const meta = withMeta
    ? `<span class="var-sol__meta">${typo.escape(task.source.label)} · ${typo.escape(starsText(task.difficulty))}</span>`
    : '';
  return `<p class="var-sol__head"><b>${typo.escape(T.task(no))}</b>${meta}</p>`;
}

/** Пометки для учителя: то, что на листе не так, как в разделе (нет рисунка). */
function teacherNotes(task: VariantTask): string {
  const notes = task.fallbacks.filter((f) => f.field === 'figure' || f.field === 'repeat');
  if (notes.length === 0) return '';
  return `<p class="var-sol__note">${notes.map((f) => typo.escape(f.note)).join('. ')}</p>`;
}

/* ── Описание листа ─────────────────────────────────────────────── */

interface SheetVariant {
  title: { chip: string; text: string; subtitle: string; variant: string };
  fields: unknown;
  blocks: unknown[];
}

function blocksUchenik(tasks: readonly VariantTask[], meta: VariantMeta): unknown[] {
  const numbers = tasks.map((t, i) => sheetNo(t, i, meta.numbering));
  return [
    {
      head: false,
      title: '',
      note: '',
      leadItems:
        meta.instruction && meta.instructionText.trim() !== ''
          ? [instructionItem(meta.instructionText)]
          : [],
      tasks: tasks.map((t, i) => card(t, numbers[i] ?? i + 1)),
    },
    { head: false, title: '', note: '', leadItems: [blankItem(numbers)], tasks: [] },
  ];
}

function blocksUchitel(
  tasks: readonly VariantTask[],
  meta: VariantMeta,
  code: string | null,
): unknown[] {
  const out: unknown[] = [
    {
      head: false,
      title: '',
      note: '',
      leadItems: [keyItem(tasks, meta.numbering, code)],
      tasks: [],
    },
    {
      head: true,
      title: T.solutionsTitle,
      note: '',
      tasks: [],
    },
  ];
  tasks.forEach((t, i) => {
    const no = sheetNo(t, i, meta.numbering);
    /* Нет решения учителя (у части прототипов №12) — разбор для ученика,
       он тоже по шагам; нет и его — честная строка и ответ. */
    const sol =
      t.solutionTeacher ??
      t.solutionStudent ??
      `<p>${typo.escape(T.noSolution)}</p><p class="var-razbor__answer"><b>${T.answer}:</b> ${t.answerHtml}</p>`;
    out.push({
      head: false,
      title: '',
      note: '',
      leadItems: [
        item(
          'var-sol var-sol--first',
          solutionHead(t, no, true) + teacherNotes(t),
          ' data-keep-with-next="1"',
        ),
      ],
      tasks: [card(t, no)],
    });
    out.push({
      head: false,
      title: '',
      note: '',
      leadItems: [
        figureItem(t.figureTeacher, 'var-sol var-sol__fig'),
        /* Строку «Ответ: …» ставит адаптер в конце решения (razborAnswer). */
        ...splitSolution(sol).map((chunk) => item('var-sol', chunk)),
      ].filter((x) => x !== ''),
      tasks: [],
    });
  });
  return out;
}

function blocksRazbor(tasks: readonly VariantTask[], meta: VariantMeta): unknown[] {
  const out: unknown[] = [];
  tasks.forEach((t, i) => {
    const no = sheetNo(t, i, meta.numbering);
    const sol = t.solutionStudent ?? t.solutionTeacher ?? `<p>${typo.escape(T.noSolution)}</p>`;
    out.push({
      head: false,
      title: '',
      note: '',
      leadItems: [
        item('var-sol var-sol--first', solutionHead(t, no, false), ' data-keep-with-next="1"'),
      ],
      tasks: [card(t, no)],
    });
    out.push({
      head: false,
      title: '',
      note: '',
      leadItems: splitSolution(sol).map((chunk) => item('var-sol var-razbor-item', chunk)),
      tasks: [],
    });
  });
  return out;
}

export interface VariantSheetOptions {
  workTitle: string;
  /**
   * Код варианта в таблице ответов учителя. На листе ученика кода нет
   * никогда: по коду на сайте собирается и лист с ответами.
   */
  showCode: boolean;
  /** Подпись варианта на листе; не задана — «Вариант n» по номеру в партии. */
  variantLabel?: (index: number) => string;
}

/** Описание документа для `buildDocument` (lib/sheet/sheet.js). */
export function variantSheetSpec(
  set: VariantSet,
  meta: VariantMeta,
  choice: SheetChoice,
  opts: VariantSheetOptions,
) {
  const kinds = choice === 'vse' ? SHEET_KINDS : [choice];
  const subtitleBase = [meta.topic.trim()].filter((x) => x !== '').join(' · ');
  const extra = [
    { label: `${T.duration}:`, value: meta.duration.trim() },
    { label: `${T.teacher}:`, value: meta.teacher.trim() },
  ];
  const variants: SheetVariant[] = kinds.flatMap((kind, ki) =>
    set.variants.map((v) => {
      const part =
        choice === 'vse'
          ? T.partOf(ki + 1, kinds.length, T.part[kind])
          : kind === 'uchenik'
            ? ''
            : T.part[kind];
      const subtitle = [subtitleBase, part].filter((x) => x !== '').join(' · ');
      const blocks =
        kind === 'uchenik'
          ? blocksUchenik(v.tasks, meta)
          : kind === 'uchitel'
            ? blocksUchitel(v.tasks, meta, opts.showCode ? set.code : null)
            : blocksRazbor(v.tasks, meta);
      return {
        title: {
          chip: T.chip[kind],
          text: opts.workTitle,
          subtitle,
          variant:
            meta.variantLabels === 'blank'
              ? T.variantBlank
              : (opts.variantLabel ?? T.variant)(v.index),
        },
        /* Поля «Фамилия / Класс / Дата» — только у листа ученика. */
        fields:
          kind === 'uchenik'
            ? { date: meta.date === '' ? '' : dateRu(meta.date), group: meta.group.trim(), extra }
            : null,
        blocks,
      };
    }),
  );
  const documentTitle = choice === 'vse' ? opts.workTitle : `${opts.workTitle} — ${T.part[choice]}`;
  return {
    theme: 'strict' as const,
    layout: 'single' as const,
    cell: CELL,
    head: T.head,
    runner: opts.workTitle,
    documentTitle,
    title: { chip: T.chip.uchenik, text: opts.workTitle, subtitle: subtitleBase },
    fields: null,
    variants,
    withAnswerLine: false,
    foot: T.foot,
    kit: null,
    qr: null,
  };
}
