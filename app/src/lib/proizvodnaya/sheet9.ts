'use client';

/**
 * Лист для печати задания №9: адрес → задачи → описание листа.
 *
 * Параметры варианта живут в адресе страницы печати: один и тот же
 * адрес всегда даёт один и тот же лист, а лист ученика и лист
 * учителя по одному адресу содержат одни и те же задачи и одни и те
 * же рисунки условий. Задачи считает движок №9 в браузере, лист
 * раскладывает общий шаблон lib/sheet/.
 *
 * Адрес: g=I,II — группы; p=9.2.1,… — конкретные прототипы (пусто —
 * все прототипы групп); n — число задач; seed; t=color|print;
 * c=1|2 — колонки; k — вид работы; d — дата; r=0|1|2 — число
 * разобранных примеров на группу (по умолчанию 2).
 *
 * Рисунки. У ученика — режим 'student': только то, что даёт условие.
 * У учителя на том же месте — режим 'teacher' со вспомогательными
 * построениями; рисунок ученика лежит в task.figureCondition, по нему
 * проверка комплекта сверяет, что наборы одни. Разобранные примеры в рамках теории —
 * всегда режима 'teacher': пример показывает, как решают.
 *
 * Ответ и разбор по этапам считаются только для листа учителя и
 * примеров; student-запрос разбор своих задач не строит.
 */

import type { SheetLayoutId, SheetThemeId } from '@/content/generator';
import contentSheet9 from '@/content/sheet9.js';
import { answerHtml, answersItems } from '@/lib/sheet/answers9.js';
import { buildDocument, exampleItem } from '@/lib/sheet/sheet.js';
import typo from '@/lib/sheet/typography.js';
import { generate as generateRaw, opornayaSeed } from './generate';
import { PROTOTYPES, prototypeById } from './prototypes';
import { pustoyOtchet, renderFigura } from './render';
import { GRUPPY, gruppaById } from './skills';
import { ru } from './tex';
import type { Generated, Gruppa } from './types';

/* Задача считается долго (движок подбирает рисунок), а лист ученика,
   лист учителя и проверка комплекта просят одни и те же seed: результат
   запоминается. Функция чистая, поэтому запоминание ничего не меняет. */
const CACHE_MAX = 400;
const generated = new Map<string, Generated>();
function generate(prototypeId: string, seed: string): Generated {
  const key = `${prototypeId}|${seed}`;
  const hit = generated.get(key);
  if (hit !== undefined) {
    return hit;
  }
  const task = generateRaw(prototypeId, seed);
  if (generated.size >= CACHE_MAX) {
    generated.clear();
  }
  generated.set(key, task);
  return task;
}

export interface SheetParams9 {
  /** Группы прототипов: I … V. */
  groups: Gruppa[];
  /** Конкретные прототипы 9.x.y; пусто — все прототипы выбранных групп. */
  prototypes: string[];
  count: number;
  seed: string;
  theme: SheetThemeId;
  layout: SheetLayoutId;
  /** Вид работы: подзаголовок листа. */
  kind: string;
  /** Дата в подзаголовке, в записи ГГГГ-ММ-ДД. Пусто — даты нет. */
  date: string;
  /** Разобранных примеров на тип (группу): 0, 1 или 2. */
  ramki: 0 | 1 | 2;
}

/** По умолчанию — полный набор: два разобранных примера на группу. */
export const RAMKI_DEFAULT = 2;

export function defaultSheetParams9(): SheetParams9 {
  return {
    groups: GRUPPY.map((g) => g.id),
    prototypes: [],
    count: 10,
    seed: 'variant',
    theme: 'color',
    layout: 'single',
    kind: '',
    date: '',
    ramki: RAMKI_DEFAULT,
  };
}

/** Строка адреса из параметров: g=I,II&p=…&n=&seed=&t=&c=&k=&d=&r=. */
export function sheetQuery9(params: SheetParams9): string {
  const query = new URLSearchParams();
  query.set('g', params.groups.join(','));
  if (params.prototypes.length > 0) {
    query.set('p', params.prototypes.join(','));
  }
  query.set('n', String(params.count));
  query.set('seed', params.seed);
  query.set('t', params.theme);
  query.set('c', params.layout === 'double' ? '2' : '1');
  if (params.kind !== '') {
    query.set('k', params.kind);
  }
  if (params.date !== '') {
    query.set('d', params.date);
  }
  query.set('r', String(params.ramki));
  return query.toString();
}

function groupsOfPrototypes(ids: string[]): Gruppa[] {
  return GRUPPY.filter((g) => PROTOTYPES.some((p) => p.gruppa === g.id && ids.includes(p.id))).map(
    (g) => g.id,
  );
}

/** Параметры из адреса. Чего в адресе нет — берётся по умолчанию. */
export function parseSheetQuery9(query: URLSearchParams): SheetParams9 {
  const known = new Set<string>(GRUPPY.map((g) => g.id));
  const list = (name: string) =>
    (query.get(name) ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '');
  const prototypes = list('p').filter((id) => prototypeById(id) !== undefined);
  let groups = list('g').filter((id): id is Gruppa => known.has(id));
  if (groups.length === 0) {
    groups = prototypes.length > 0 ? groupsOfPrototypes(prototypes) : GRUPPY.map((g) => g.id);
  }
  const count = Number(query.get('n'));
  const ramki = query.get('r');
  return {
    groups,
    prototypes,
    count: Number.isFinite(count) && count > 0 ? Math.floor(count) : 10,
    seed: query.get('seed') ?? 'variant',
    theme: query.get('t') === 'print' ? 'print' : 'color',
    layout: query.get('c') === '2' ? 'double' : 'single',
    kind: query.get('k') ?? '',
    date: /^\d{4}-\d{2}-\d{2}$/.test(query.get('d') ?? '') ? (query.get('d') as string) : '',
    ramki: ramki === '0' ? 0 : ramki === '1' ? 1 : RAMKI_DEFAULT,
  };
}

/* ── Лист ─────────────────────────────────────────────────────────── */

/** Клетка рисунка условия на листе, мм: в две колонки чуть мельче. */
const CELL: Record<SheetLayoutId, number> = { single: 3.4, double: 3.0 };
/** Клетка рисунка в разобранном примере, мм. */
const EXAMPLE_CELL_MM = 5.6;
/* Лист учителя читают с рисунком построений и разбором: рисунок
   стоит под условием на всю ширину колонки, клетка крупнее, чем у
   ученика, но не шире колонки. */
/* 6 мм на клетку: числа осей печатаются кеглем около 6,5 pt, подпись графика — около 10 pt. */
const TEACHER_CELL: Record<SheetLayoutId, number> = { single: 6.0, double: 3.6 };
const TEACHER_MAX_MM: Record<SheetLayoutId, number> = { single: 160, double: 84 };
const EXAMPLE_MAX_MM = 150;

export interface SheetTask9 {
  no: number;
  id: string;
  questionHtml: string;
  options: null;
  figureSvg: string | null;
  /** Ширина рисунка условия, мм: клетка у всех окон одна. */
  figureWidth?: number;
  /** Рисунок условия в режиме 'student' — один и тот же на обоих листах. */
  figureCondition: string | null;
  /** Рисунок под условием, на всю ширину колонки (лист учителя). */
  figureBelow?: boolean;
  answer: string;
  answerHtml: null;
  solutionHtml: string | null;
}

export interface SheetBlock9 {
  /** Плашка с номером группы перед названием. */
  id: string;
  title: string;
  note: string;
  set: string;
  tasks: SheetTask9[];
  /** Рамка «Запомни» и разобранные примеры группы — готовые куски потока. */
  theory: string[];
}

interface Drawn {
  svg: string;
  /** Ширина в миллиметрах при заданной клетке. */
  width: (cellMm: number) => number;
}

function drawFigure(task: Generated, rezhim: 'student' | 'teacher'): Drawn | null {
  if (task.risunok === null) {
    return null;
  }
  const report = pustoyOtchet();
  const svg = renderFigura(task.risunok, { rezhim }, report);
  return { svg, width: (cellMm) => Math.round((report.width / report.cell) * cellMm * 100) / 100 };
}

/** Ответ-число формулой (настоящий минус, десятичная запятая). */
function answerLine(answerText: string): string {
  return `<p class="sheet-task-answer">${typo.text(contentSheet9.labels.answer)}: <b>${answerHtml(answerText)}</b></p>`;
}

/** Разбор ЭТАПАМИ: «Заголовок этапа.» и строки; шаг «Ответ» — строкой под списком. */
function razborHtml(task: Generated, answerText: string): string {
  const items = task.shagi
    .filter((s) => s.zagolovok !== 'Ответ')
    .map((s) => {
      /* Строки этапа — каждая с новой строки: выкладки не сливаются. */
      const lines = s.stroki.map((line) => typo.mathText(line.replace(/\*\*/g, ''))).join('<br>');
      return `<li class="sheet-step"><b>${typo.mathText(s.zagolovok)}.</b><br>${lines}</li>`;
    })
    .join('');
  return `<ol class="sheet-steps z9-razbor">${items}</ol>${answerLine(answerText)}`;
}

function sheetTask(
  task: Generated,
  no: number,
  layout: SheetLayoutId,
  withAnswers: boolean,
): SheetTask9 {
  const answerText = ru(task.otvet);
  const condition = drawFigure(task, 'student');
  /* У учителя на месте рисунка условия стоит тот же рисунок в режиме
     'teacher' (со вспомогательными построениями); рисунок ученика
     лежит в figureCondition — по нему проверка сверяет наборы. */
  const shown = withAnswers ? drawFigure(task, 'teacher') : condition;
  return {
    no,
    id: `${task.prototype}|${task.seed}`,
    questionHtml: typo.mathText(task.uslovie),
    options: null,
    figureSvg: shown === null ? null : shown.svg,
    ...(shown === null
      ? {}
      : withAnswers
        ? {
            figureWidth: Math.min(shown.width(TEACHER_CELL[layout]), TEACHER_MAX_MM[layout]),
            figureBelow: true,
          }
        : { figureWidth: shown.width(CELL[layout]) }),
    figureCondition: condition === null ? null : condition.svg,
    answer: withAnswers ? answerText : '',
    answerHtml: null,
    solutionHtml: withAnswers ? razborHtml(task, answerText) : null,
  };
}

const ATTEMPTS_PER_TASK = 30;

/** Прототипы группы, попавшие в выбор: по умолчанию — все прототипы группы. */
function poolOf(group: Gruppa, params: SheetParams9): string[] {
  const all = PROTOTYPES.filter((p) => p.gruppa === group).map((p) => p.id);
  const chosen = all.filter((id) => params.prototypes.includes(id));
  return chosen.length > 0 ? chosen : all;
}

/** Задачи одной группы: `want` штук, прототипы по кругу, воспроизводимо по адресу. */
function tasksForGroup(
  pool: string[],
  want: number,
  params: SheetParams9,
  numberRef: { n: number },
  withAnswers: boolean,
): SheetTask9[] {
  const out: SheetTask9[] = [];
  if (pool.length === 0) {
    return out;
  }
  const attempts = new Map<string, number>();
  const seen = new Set<string>();
  let cursor = 0;
  let guard = 0;
  while (out.length < want && guard < want * ATTEMPTS_PER_TASK + ATTEMPTS_PER_TASK) {
    guard += 1;
    const proto = pool[cursor % pool.length] as string;
    cursor += 1;
    const attempt = attempts.get(proto) ?? 0;
    attempts.set(proto, attempt + 1);
    const seed = `${params.seed}:${proto}:${attempt}`;
    try {
      const task = generate(proto, seed);
      const key = `${proto}|${task.uslovie}|${task.signature}|${task.otvet}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      numberRef.n += 1;
      out.push(sheetTask(task, numberRef.n, params.layout, withAnswers));
    } catch {
      /* Параметры не подобрались на этом seed — берём следующий. */
    }
  }
  return out;
}

/* ── Рамки теории ─────────────────────────────────────────────────── */

/** Рамка «Запомни» по группе: оформление рамки «Повторяем» шаблона. */
function zapomniItem(group: Gruppa): string {
  const lines = (contentSheet9.zapomni as Record<string, string[]>)[group] ?? [];
  if (lines.length === 0) {
    return '';
  }
  const items = lines
    .map(
      (line, i) =>
        `<li class="sheet-recap-item"><span class="sheet-recap-no">${i + 1}</span><span>${typo.mathText(line)}</span></li>`,
    )
    .join('');
  return (
    /* «Запомни» не держится за следующим куском: пример с крупным рисунком
       может не поместиться, и тогда цепочка «заголовок → Запомни → пример»
       оставляла бы заголовок группы один на странице. Заголовок держится
       за «Запомни», а пример при нехватке места уходит на следующую. */
    '<div class="sheet-item sheet-zapomni"><section class="sheet-recap">' +
    '<div class="sheet-recap-main">' +
    `<h2 class="sheet-recap-title">${typo.text(contentSheet9.labels.zapomni)}</h2>` +
    `<ul class="sheet-recap-list">${items}</ul>` +
    '</div></section></div>'
  );
}

/**
 * Разобранный пример: полностью разобранная задача прототипа. Первый —
 * по seed опорной задачи «<id>#opornaya»; второй — другой прототип
 * группы с его опорной задачей, а у группы из одного прототипа — тот
 * же прототип по seed «<id>#primer2».
 */
export function primerSeed(prototypeId: string): string {
  return `${prototypeId}#primer2`;
}

function exampleOf(prototypeId: string, seed: string): string {
  let task: Generated;
  try {
    task = generate(prototypeId, seed);
  } catch {
    return '';
  }
  const answerText = ru(task.otvet);
  const drawn = drawFigure(task, 'teacher');
  return exampleItem({
    label: contentSheet9.labels.example,
    title: prototypeById(prototypeId)?.nazvanie ?? '',
    conditionHtml: typo.mathText(task.uslovie),
    solutionHtml: razborHtml(task, answerText),
    figureSvg: drawn === null ? null : drawn.svg,
    figureWidth:
      drawn === null ? undefined : Math.min(drawn.width(EXAMPLE_CELL_MM), EXAMPLE_MAX_MM),
    figureBelow: true,
  });
}

function theoryOf(group: Gruppa, pool: string[], ramki: number): string[] {
  if (ramki === 0 || pool.length === 0) {
    return [];
  }
  const real = pool.filter((id) => prototypeById(id)?.zaglushka !== true);
  const from = real.length > 0 ? real : pool;
  const out: string[] = [zapomniItem(group)];
  for (let i = 0; i < ramki; i += 1) {
    const second = i === 1;
    const proto = from[i % from.length] as string;
    const seed = second && from.length === 1 ? primerSeed(proto) : opornayaSeed(proto);
    out.push(exampleOf(proto, seed));
  }
  return out.filter((item) => item !== '');
}

/** Блоки листа: по одному на группу, сквозная нумерация задач. */
export function sheetBlocks9(params: SheetParams9, withAnswers: boolean): SheetBlock9[] {
  const numberRef = { n: 0 };
  const groups = params.groups;
  const base = Math.floor(params.count / Math.max(1, groups.length));
  let rest = params.count - base * groups.length;

  return groups
    .map((group) => {
      const extra = rest > 0 ? 1 : 0;
      rest -= extra;
      const pool = poolOf(group, params);
      const tasks = tasksForGroup(pool, base + extra, params, numberRef, withAnswers);
      return {
        id: group,
        title: gruppaById(group)?.nazvanie ?? group,
        note: '',
        set: group,
        tasks,
        theory: theoryOf(group, pool, params.ramki),
      };
    })
    .filter((block) => block.tasks.length > 0);
}

/** Задача фиксированного набора: прототип и seed (банк сборника PDF). */
export interface FixedTask9 {
  prototype: string;
  seed: string;
  /** Номер варианта в банке: попадает в идентификатор задачи. */
  n: number;
}

/**
 * Блоки по фиксированному набору задач — для сборника PDF: те же
 * карточки, рамки и разбор, что у листа генератора, но задачи берутся
 * не по seed адреса, а из банка.
 */
export function fixedBlocks9(
  plan: { group: Gruppa; tasks: FixedTask9[] }[],
  options: { layout: SheetLayoutId; ramki: 0 | 1 | 2 },
  withAnswers: boolean,
): SheetBlock9[] {
  let no = 0;
  return plan
    .map(({ group, tasks }) => {
      const pool = PROTOTYPES.filter((p) => p.gruppa === group).map((p) => p.id);
      return {
        id: group,
        title: gruppaById(group)?.nazvanie ?? group,
        note: '',
        set: group,
        tasks: tasks.map((item) => {
          no += 1;
          const built = sheetTask(
            generate(item.prototype, item.seed),
            no,
            raskladka(options.layout, withAnswers),
            withAnswers,
          );
          return { ...built, id: `${item.prototype}#${item.n}` };
        }),
        theory: theoryOf(group, pool, options.ramki),
      };
    })
    .filter((block) => block.tasks.length > 0);
}

/** «18.09.2026» из записи ГГГГ-ММ-ДД. */
export function dateText9(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
}

/** Подзаголовок листа: вид работы и дата, что есть. */
export function subtitleOf9(params: Pick<SheetParams9, 'kind' | 'date'>): string {
  return [params.kind, params.date === '' ? '' : dateText9(params.date)]
    .filter((part) => part !== '')
    .join(' · ');
}

/**
 * Поток листа «по группам»: полоса группы, затем её рамки теории,
 * затем задачи. Шаблон кладёт рамки только перед всеми блоками
 * (leadItems), поэтому порядок собирает сам шаблон: каждая группа
 * проходит через buildDocument отдельно, а из его раскладки берутся
 * готовые куски потока. Так карточки задач, полосы и раскладка в две
 * колонки остаются работой шаблона, а не копией его разметки.
 */
function flowOf(spec: Record<string, unknown>, block: SheetBlock9): string[] {
  const html = buildDocument({ ...spec, blocks: [block], leadItems: [], extraItems: [] }, {});
  const open = html.indexOf('<script type="application/json" id="sheet-spec">');
  const start = html.indexOf('>', open) + 1;
  const end = html.indexOf('</script>', start);
  const items = (JSON.parse(html.slice(start, end).replace(/<\\\//g, '</')) as { items: string[] })
    .items;
  /* Первый кусок — полоса группы, за ней рамки, затем задачи. */
  return [items[0] as string, ...block.theory, ...items.slice(1)];
}

/**
 * Описание листа для шаблона. Ученику — строка «Ответ: ____», рамки
 * теории и ни одного ответа в карточках; учителю — те же задачи с
 * разбором по этапам, рисунком построений и сводной таблицей
 * «Ответы» в конце.
 *
 * blocks нужны проверкам и отпечатку комплекта; печатает лист
 * `printSpec9(spec)` — тот же набор, но с готовым потоком.
 */
export function sheetSpec9(params: SheetParams9, withAnswers: boolean) {
  const own = { ...params, layout: raskladka(params.layout, withAnswers) };
  return specOfBlocks9(sheetBlocks9(own, withAnswers), own, withAnswers);
}

/**
 * Лист учителя всегда в одну колонку: рисунок с построениями стоит под
 * условием на всю ширину, а решение этапами в половину страницы не
 * помещается — в две колонки строка задач занимала бы целую страницу.
 * Набор задач от раскладки не зависит, поэтому листы ученика и учителя
 * по-прежнему содержат одни и те же задачи.
 */
export function raskladka(layout: SheetLayoutId, withAnswers: boolean): SheetLayoutId {
  return withAnswers ? 'single' : layout;
}

/** Описание листа по готовым блокам: лист генератора и сборник PDF. */
export function specOfBlocks9(
  blocks: SheetBlock9[],
  params: Pick<SheetParams9, 'theme' | 'layout' | 'kind' | 'date'>,
  withAnswers: boolean,
) {
  const layout = raskladka(params.layout, withAnswers);
  const base = {
    theme: params.theme,
    layout,
    cell: CELL[layout],
    documentTitle:
      `${contentSheet9.title.chip}. ${contentSheet9.title.text}` +
      (params.kind ? ` — ${params.kind}` : ''),
    head: contentSheet9.head,
    runner: contentSheet9.runner,
    title: {
      chip: contentSheet9.title.chip,
      text: contentSheet9.title.text,
      subtitle: subtitleOf9(params),
    },
    recap: null,
    withAnswerLine: !withAnswers,
    foot: contentSheet9.foot,
  };
  const flow = blocks.flatMap((block) => flowOf(base, block));
  return {
    ...base,
    blocks,
    leadItems: flow,
    extraItems: withAnswers
      ? answersItems(blocks, contentSheet9.labels.answers, contentSheet9.labels.answersNote)
      : [],
  };
}

/**
 * Спецификация для buildDocument: поток уже собран в leadItems, поэтому
 * блоки с задачами второй раз не раскладываются.
 */
export function printSpec9<T extends { blocks: unknown[] }>(spec: T): T {
  return { ...spec, blocks: [] };
}
