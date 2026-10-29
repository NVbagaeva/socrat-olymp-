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

import { VARIANT_SCREEN, VARIANT_SHEET as T, standardInstruction } from '@/content/variant';
import { BALLY, MAX_BALL, MAX_PART2, ballText } from '@/content/variantOnline/bally';
import { CHAST2_TEXT } from '@/content/variantOnline/chast2Text';
import {
  kriteriiHtml,
  ramkaHtml,
  razborHtml,
  reshenieHtml,
  strokaHtml,
  teoremaHtml,
  teoremyZadach,
  uslovieHtml,
} from '@/lib/povyshennye/chast2/html';
import type { Chast2Zadacha } from '@/lib/povyshennye/chast2/types';
import { figure as figureHtml } from '@/lib/sheet/sheet.js';
import { solutionLength, spaceFor, type SheetSpace } from '@/lib/sheet/space.js';
import typo from '@/lib/sheet/typography.js';
import { codeWithSpace } from './code';
import type { Figure, FigureSize, Numbering, VariantMeta, VariantSet, VariantTask } from './types';

export type SheetKind = 'uchenik' | 'uchitel' | 'razbor';
export type SheetChoice = SheetKind | 'vse';

export const SHEET_KINDS: readonly SheetKind[] = ['uchenik', 'uchitel', 'razbor'];

/** Клетка чертежа для «обычных» рисунков, мм: лист компактный. */
const CELL = 3.0;

/**
 * Рисунки «обычные» (meta.figures = 'normal') на листе варианта мельче:
 * справа от текста — не шире FIG_SIDE_MAX мм. Под условие рисунок
 * встаёт, только если так просит раздел (дерево, мост).
 *
 * «Крупные» (по умолчанию) раскладывает шаблон листа по правилам
 * lib/sheet/figureRules.js: клетчатый рисунок — клеткой 7 мм под
 * условием, остальные — не уже 40 % строки и не мельче, чем нужно
 * подписям. Ширина раздела для них — только нижняя граница.
 */
const FIG_SCALE = 0.8;
const FIG_SIDE_MAX = 50;
const FIG_BELOW_MAX = 110;

/** Размер рисунка на листе варианта. */
export function sheetFigure(
  f: Figure,
  figures: FigureSize = 'large',
): { width: number | undefined; below: boolean } {
  const below = f.below === true;
  if (figures === 'large' || f.width === undefined) return { width: f.width, below };
  const w = f.width * FIG_SCALE;
  return { width: Math.round(Math.min(w, below ? FIG_BELOW_MAX : FIG_SIDE_MAX) * 10) / 10, below };
}

/* ── Номера и подписи ───────────────────────────────────────────── */

/** Номер задачи на листе: как в ЕГЭ или сквозной. */
export function sheetNo(task: VariantTask, index: number, numbering: Numbering): number {
  return numbering === 'ege' ? task.egeNumber : index + 1;
}

/**
 * Звёзды для экрана (фильтры, предпросмотр вне листа). На листы
 * сложность не печатается никогда.
 */
export function starsText(stars: number | null): string {
  return stars === null ? VARIANT_SCREEN.noLevel : '★'.repeat(stars) + '☆'.repeat(3 - stars);
}

/** Инструкция листа: своя или стандартная для типа работы. */
export function instructionFor(meta: VariantMeta): string {
  const own = meta.instructionText.trim();
  return own !== '' ? own : standardInstruction(meta.kind);
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
 * детей — по детям; глубже не режется: этап решения раздела (плашка с
 * заголовком и выкладками) остаётся целым.
 */
export function splitSolution(html: string, depth = 0): string[] {
  const pieces = topLevel(html);
  return pieces.flatMap((p) => {
    if (p.open === null || p.name === null || depth > 0) return [p.html];
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

/* Короткий кусок-заголовок («Решаем», «Рассуждаем», подпись шага) не
   остаётся последним на странице: уезжает вниз вместе со следующим. */
const HEAD_CHUNK = /^<(p|h\d|b|strong)\b[^>]*>[^<]{0,80}<\/\1>$/;

function solutionItem(cls: string, chunk: string): string {
  const head = chunk.includes('var-razbor__h') || HEAD_CHUNK.test(chunk.trim());
  return item(cls, chunk, head ? ' data-keep-with-next="1"' : '');
}

function figureItem(f: Figure | null, cls: string, figures: FigureSize): string {
  if (f === null) return '';
  return item(
    cls,
    figureHtml(f.svg, {
      cell: CELL,
      frame: null,
      width: sheetFigure(f, figures).width ?? null,
      figures,
    }),
  );
}

/**
 * Карточка задачи. answerLine — строка «Ответ: ____» после задания, как
 * в КИМ: у листа ученика. Будущее «место для решения» встаёт между
 * условием и этой строкой.
 */
function card(
  task: VariantTask,
  no: number,
  figures: FigureSize,
  answerLine = false,
  plashka = false,
) {
  const size = task.figure === null ? null : sheetFigure(task.figure, figures);
  return {
    ...(plashka ? { badge: ballText(BALLY[task.egeNumber]) } : {}),
    no,
    id: task.taskId,
    questionHtml: task.statement,
    options: null,
    figureSvg: task.figure?.svg ?? null,
    figureWidth: size?.width,
    figureBelow: size?.below === true,
    solutionHtml: null,
    answerLine,
  };
}

function instructionItem(text: string): string {
  return item(
    'var-instruction',
    `<p class="var-instruction__title">${typo.escape(T.instructionTitle)}</p>` +
      `<p class="var-instruction__text">${typo.text(text)}</p>`,
  );
}

/**
 * Таблица ответов учителя: номер, ответ, источник. Сложность на листах
 * не печатается — её видно только на экране.
 */
function keyItem(
  tasks: readonly VariantTask[],
  numbering: Numbering,
  code: string | null,
  istochnik: boolean,
): string {
  const rows = tasks
    .map(
      (t, i) =>
        `<tr><th scope="row">${sheetNo(t, i, numbering)}</th>` +
        `<td class="var-key__answer" data-answer="${typo.attr(t.answer)}">${t.answerHtml}</td>` +
        (istochnik ? `<td class="var-key__source">${typo.escape(t.source.label)}</td>` : '') +
        '</tr>',
    )
    .join('');
  return item(
    'var-key',
    `<table class="var-key__table"><caption>${typo.escape(T.keyTitle)}` +
      (code === null ? '' : `<span class="var-key__code">${typo.escape(T.code(code))}</span>`) +
      `</caption>` +
      `<thead><tr><th>${T.keyNo}</th><th>${T.answer}</th>` +
      (istochnik ? `<th>${T.keySource}</th>` : '') +
      `</tr></thead>` +
      `<tbody>${rows}</tbody></table>`,
  );
}

function solutionHead(task: VariantTask, no: number, withMeta: boolean): string {
  const meta = withMeta
    ? `<span class="var-sol__meta">${typo.escape(task.source.label)}</span>`
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

/**
 * Лист ученика. Место для решения (lib/sheet/space.js): по настройке,
 * своя для номера задания ЕГЭ, «авто» — по длине решения учителя.
 */
function blocksUchenik(
  tasks: readonly VariantTask[],
  meta: VariantMeta,
  space: SheetSpace | undefined,
  plashka = false,
): unknown[] {
  const text = instructionFor(meta);
  return [
    {
      head: false,
      title: '',
      note: '',
      leadItems: meta.instruction && text !== '' ? [instructionItem(text)] : [],
      tasks: tasks.map((t, i) => {
        const field =
          space === undefined
            ? null
            : spaceFor(space, t.egeNumber, solutionLength(t.solutionTeacher ?? t.solutionStudent));
        const c = card(t, sheetNo(t, i, meta.numbering), meta.figures, true, plashka);
        return field === null ? c : { ...c, space: field };
      }),
    },
  ];
}

function blocksUchitel(
  tasks: readonly VariantTask[],
  meta: VariantMeta,
  code: string | null,
  istochnik: boolean,
  c2: readonly Chast2Zadacha[] | null = null,
): unknown[] {
  const out: unknown[] = [
    {
      head: false,
      title: '',
      note: '',
      leadItems: [
        keyItem(tasks, meta.numbering, code, istochnik),
        ...(c2 === null ? [] : [key2Item(c2)]),
      ],
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
          solutionHead(t, no, istochnik) + teacherNotes(t),
          ' data-keep-with-next="1"',
        ),
      ],
      tasks: [card(t, no, meta.figures, false, c2 !== null)],
    });
    out.push({
      head: false,
      title: '',
      note: '',
      leadItems: [
        figureItem(t.figureTeacher, 'var-sol var-sol__fig', meta.figures),
        /* Строку «Ответ: …» ставит адаптер в конце решения (razborAnswer). */
        ...splitSolution(sol).map((chunk) => solutionItem('var-sol', chunk)),
      ].filter((x) => x !== ''),
      tasks: [],
    });
  });
  return out;
}

function blocksRazbor(
  tasks: readonly VariantTask[],
  meta: VariantMeta,
  plashka = false,
): unknown[] {
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
      tasks: [card(t, no, meta.figures, false, plashka)],
    });
    out.push({
      head: false,
      title: '',
      note: '',
      leadItems: splitSolution(sol).map((chunk) => solutionItem('var-sol var-razbor-item', chunk)),
      tasks: [],
    });
  });
  return out;
}

/* ── Часть 2 (задания 14–20) ───────────────────────────────────── */

/** Часть 2 на листе ученика: по странице на задание или без места для решения. */
export type Mesto2 = 'stranica' | 'net';

function card2(z: Chast2Zadacha) {
  return {
    no: z.no,
    id: `c2-${z.no}`,
    badge: ballText(MAX_BALL[z.no]),
    questionHtml: uslovieHtml(z.uslovie),
    options: null,
    figureSvg: z.risunok,
    figureWidth: z.risunok === null ? undefined : 60,
    figureBelow: false,
    solutionHtml: null,
    answerLine: false,
  };
}

/** Заголовок части 2: с новой страницы, инструкция и максимум. */
function part2Head(): string {
  const C = CHAST2_TEXT;
  return item(
    'var-part2-head',
    `<p class="var-part2-head__t">${typo.escape(C.partTitle)}</p>` +
      `<p class="var-part2-head__instr">${typo.escape(C.part2InstrList)}</p>` +
      `<p class="var-part2-head__max"><b>${typo.escape(C.part2Max(ballText(MAX_PART2)))}</b></p>`,
    ' data-page-break="1" data-keep-with-next="1"',
  );
}

/**
 * Лист ученика, часть 2. «По странице на задание» (по умолчанию): каждое
 * задание — с новой страницы, под условием поле в клетку до конца листа
 * (lib/sheet/sheet.js, pageItems; высоту ставит набор). Первое задание
 * стоит на одной странице с заголовком части. «Без места» — задания
 * подряд.
 */
function blocksUchenik2(zadachi: readonly Chast2Zadacha[], mesto: Mesto2): unknown[] {
  return [
    {
      head: false,
      title: '',
      note: '',
      leadItems: [part2Head()],
      tasks: zadachi.map((z, i) =>
        mesto === 'stranica' ? { ...card2(z), page: true, pageBreak: i > 0 } : card2(z),
      ),
    },
  ];
}

function key2Item(zadachi: readonly Chast2Zadacha[]): string {
  const rows = zadachi
    .map(
      (z) =>
        `<tr><th scope="row">${z.no}</th><td class="var-key__answer">${strokaHtml(z.otvet, 'list')}</td>` +
        `<td>${MAX_BALL[z.no]}</td></tr>`,
    )
    .join('');
  return item(
    'var-key var-key--2',
    `<table class="var-key__table"><caption>${typo.escape(CHAST2_TEXT.partTitle)}: ответы</caption>` +
      `<thead><tr><th>${T.keyNo}</th><th>${T.answer}</th><th>Баллы</th></tr></thead><tbody>${rows}</tbody></table>`,
  );
}

function blocksUchitel2(zadachi: readonly Chast2Zadacha[]): unknown[] {
  const out: unknown[] = [];
  zadachi.forEach((z, i) => {
    out.push({
      head: false,
      title: '',
      note: '',
      leadItems: [
        ...(i === 0 ? [part2Head()] : []),
        item(
          'var-sol var-sol--first',
          `<p class="var-sol__head"><b>${typo.escape(T.task(z.no))}</b></p>`,
          ' data-keep-with-next="1"',
        ),
      ],
      tasks: [card2(z)],
    });
    out.push({
      head: false,
      title: '',
      note: '',
      leadItems: [
        ...splitSolution(reshenieHtml(z, 'list')).map((chunk) =>
          solutionItem('var-sol c2-sol', chunk),
        ),
        item(
          'var-sol',
          `<p class="var-razbor__answer"><b>${T.answer}:</b> ${strokaHtml(z.otvet, 'list')}</p>`,
        ),
        ...(z.snoska === undefined ? [] : [item('var-sol', ramkaHtml(z.snoska, 'list'))]),
        item('var-sol c2-krit-item', kriteriiHtml(z)),
      ],
      tasks: [],
    });
  });
  /* Теоремы, на которые ссылаются решения: формулировка, чертёж, доказательство. */
  const ids = teoremyZadach(zadachi);
  if (ids.length > 0) {
    out.push({
      head: false,
      title: '',
      note: '',
      leadItems: [
        item(
          'var-part2-head',
          `<p class="var-part2-head__t">Теоремы, на которые ссылаются решения</p>`,
          ' data-page-break="1" data-keep-with-next="1"',
        ),
        ...ids.map((id) => item('var-teor', teoremaHtml(id, 200))),
      ],
      tasks: [],
    });
  }
  return out;
}

function blocksRazbor2(zadachi: readonly Chast2Zadacha[]): unknown[] {
  const out: unknown[] = [];
  zadachi.forEach((z, i) => {
    out.push({
      head: false,
      title: '',
      note: '',
      leadItems: [
        ...(i === 0 ? [part2Head()] : []),
        item(
          'var-sol var-sol--first',
          `<p class="var-sol__head"><b>${typo.escape(T.task(z.no))}</b></p>`,
          ' data-keep-with-next="1"',
        ),
      ],
      tasks: [card2(z)],
    });
    out.push({
      head: false,
      title: '',
      note: '',
      leadItems: [
        solutionItem('var-sol var-razbor-item', razborHtml(z)),
        item(
          'var-sol',
          `<p class="var-razbor__answer"><b>${T.answer}:</b> ${strokaHtml(z.otvet, 'list')}</p>`,
        ),
      ],
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
  /**
   * Колонка «Источник» у учителя. Нет у вариантов раздела повышенной
   * сложности: источник у всех задач один — сам вариант.
   */
  istochnik?: boolean;
  /** Место для решения на листе ученика; код в таблице учителя — с ним. */
  space?: SheetSpace;
  /** Хвост кода для места для решения (encodeSpace): к коду в таблице. */
  spaceToken?: string;
  /**
   * Часть 2 варианта (по номеру варианта в наборе); null — у варианта
   * её нет. Есть — у заданий плашки баллов, часть 2 с новой страницы.
   */
  chast2?: (index: number) => readonly Chast2Zadacha[] | null;
  /** Часть 2 на листе ученика: по странице на задание (по умолчанию) или без места. */
  mesto2?: Mesto2;
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
      const c2 = opts.chast2?.(v.index) ?? null;
      const pl = c2 !== null;
      const blocks =
        kind === 'uchenik'
          ? [
              ...blocksUchenik(v.tasks, meta, opts.space, pl),
              ...(c2 === null ? [] : blocksUchenik2(c2, opts.mesto2 ?? 'stranica')),
            ]
          : kind === 'uchitel'
            ? [
                ...blocksUchitel(
                  v.tasks,
                  meta,
                  opts.showCode ? codeWithSpace(set.code, opts.spaceToken ?? '') : null,
                  opts.istochnik ?? true,
                  c2,
                ),
                ...(c2 === null ? [] : blocksUchitel2(c2)),
              ]
            : [...blocksRazbor(v.tasks, meta, pl), ...(c2 === null ? [] : blocksRazbor2(c2))];
      return {
        title: {
          chip: kind === 'uchenik' && c2 !== null ? T.chipDvuh : T.chip[kind],
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
    figures: meta.figures,
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
