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
 * разобранных примеров на группу (по умолчанию 2); u — номер урока в
 * серии (0 — первый урок, в адресе не пишется).
 *
 * Серия уроков. Задачи берутся из банка (bank.ts, до двадцати
 * вариантов на прототип). Код комплекта (seed) задаёт порядок вариантов
 * каждого прототипа, номер урока — место в этом порядке: урок u
 * продолжает поток с того места, где закончился урок u − 1. Всё, что
 * нужно уроку, выводится из кода и номера урока (seedUroka) — ни
 * истории, ни localStorage: серия восстанавливается по коду на любом
 * устройстве и в любом порядке. Уроки одной серии не повторяют задачи,
 * пока в банке есть неиспользованные; когда банк прототипа исчерпан,
 * поток идёт по нему заново в том же порядке.
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
import { buildDocument, exampleItem, figure as sheetFigure } from '@/lib/sheet/sheet.js';
import typo from '@/lib/sheet/typography.js';
import { generate as generateRaw, opornayaSeed } from './generate';
import { PROTOTYPES, prototypeById } from './prototypes';
import { pustoyOtchet, renderFigura } from './render';
import { GRUPPY, gruppaById } from './skills';
import { BANK } from './bank';
import { rngOf } from './rng';
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
  /** Номер урока в серии: 0, 1, … — сдвиг по потоку вариантов банка (серия — seed). */
  urok: number;
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
    urok: 0,
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
  if (params.urok > 0) {
    query.set('u', String(params.urok));
  }
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
  const urok = Number(query.get('u'));
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
    urok: Number.isFinite(urok) && urok > 0 ? Math.floor(urok) : 0,
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
  /** Лист учителя: задача кусками потока — условие с рисунком и этапы разбора. */
  kuski?: string[];
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
  /** Разобранные примеры группы «прототип|seed»: по ним проверка сверяет листы. */
  primery: string[];
}

interface Drawn {
  svg: string;
  /** Ширина в миллиметрах при заданной клетке. */
  width: (cellMm: number) => number;
  /** Размер рисунка в клетках: по нему решается, встанет ли он сбоку. */
  kletokX: number;
  kletokY: number;
}

function drawFigure(task: Generated, rezhim: 'student' | 'teacher'): Drawn | null {
  if (task.risunok === null) {
    return null;
  }
  const report = pustoyOtchet();
  const svg = renderFigura(task.risunok, { rezhim }, report);
  return {
    svg,
    width: (cellMm) => Math.round((report.width / report.cell) * cellMm * 100) / 100,
    kletokX: report.width / report.cell,
    kletokY: report.height / report.cell,
  };
}

/** Ответ-число формулой (настоящий минус, десятичная запятая). */
function answerLine(answerText: string): string {
  return `<p class="sheet-task-answer">${typo.text(contentSheet9.labels.answer)}: <b>${answerHtml(answerText)}</b></p>`;
}

/** Этапы разбора без шага «Ответ»: ответ стоит строкой под списком. */
function etapy(task: Generated): Generated['shagi'] {
  return task.shagi.filter((s) => s.zagolovok !== 'Ответ');
}

/** Один этап: «Заголовок этапа.» и строки — каждая с новой строки, выкладки не сливаются. */
function etapHtml(s: Generated['shagi'][number]): string {
  const lines = s.stroki.map((line) => typo.mathText(line.replace(/\*\*/g, ''))).join('<br>');
  return `<li class="sheet-step"><b>${typo.mathText(s.zagolovok)}.</b><br>${lines}</li>`;
}

/** Список этапов с номера start (нумерация не сбивается, когда разбор перенесён). */
function etapyHtml(list: Generated['shagi'], start: number): string {
  const from = start > 1 ? ` start="${start}"` : '';
  return `<ol class="sheet-steps z9-razbor"${from}>${list.map(etapHtml).join('')}</ol>`;
}

/** Разбор ЭТАПАМИ: «Заголовок этапа.» и строки; шаг «Ответ» — строкой под списком. */
function razborHtml(task: Generated, answerText: string): string {
  return `${etapyHtml(etapy(task), 1)}${answerLine(answerText)}`;
}

/* ── Лист учителя: задача кусками ─────────────────────────────────── */

/** Ширина текста карточки задачи в одну колонку, мм: лист 210 − поля 2·14 − номер и отступы. */
const KOLONKA_MM = 164;
/** Ширина текста рамки примера, мм: слева у рамки ещё плашка «Пример». */
const KOLONKA_PRIMERA_MM = 148;
/** Клетка рисунка, который стоит справа от разбора, мм. */
const SBOKU_CELL_MM = 4.5;
/** Зазор между разбором и рисунком и отступ списка этапов, мм. */
const ZAZOR_MM = 8;
/* Оценка высоты этапа: строка разбора (10,5 pt с интерлиньяжем) — около
   5,6 мм, средний знак — около 1,9 мм. Нужна только для того, чтобы
   решить, сколько этапов поставить рядом с рисунком; ошибка оценки
   меняет лишь то, где разбор перенесётся, а не его целостность. */
const STROKA_MM = 5.6;
const ZNAK_MM = 1.9;

interface MestoRisunka {
  html: string;
  widthMm: number;
  heightMm: number;
  sboku: boolean;
}

/**
 * Где стоит рисунок учителя. Если при клетке 4,5 мм он не шире
 * половины колонки — справа от разбора; иначе — под условием, клетка
 * 6 мм, не шире колонки.
 */
function mestoRisunka(drawn: Drawn, kolonka: number): MestoRisunka {
  const sbokuW = drawn.kletokX * SBOKU_CELL_MM;
  if (sbokuW <= kolonka / 2) {
    return {
      html: sheetFigure(drawn.svg, { width: sbokuW }),
      widthMm: sbokuW,
      heightMm: drawn.kletokY * SBOKU_CELL_MM,
      sboku: true,
    };
  }
  const w = Math.min(drawn.width(TEACHER_CELL.single), TEACHER_MAX_MM.single, kolonka);
  return {
    html: sheetFigure(drawn.svg, { width: w }),
    widthMm: w,
    heightMm: (w * drawn.kletokY) / drawn.kletokX,
    sboku: false,
  };
}

function dlinaTeksta(line: string): number {
  return line.replace(/\\[a-zA-Z]+/g, 'x').replace(/[{}$^_*]/g, '').length;
}

function vysotaEtapa(etap: Generated['shagi'][number], shirinaMm: number): number {
  const naStroku = Math.max(10, Math.floor(shirinaMm / ZNAK_MM));
  let lines = 1;
  for (const line of etap.stroki) {
    lines += Math.max(1, Math.ceil(dlinaTeksta(line) / naStroku));
  }
  return lines * STROKA_MM + 1;
}

type Obertka = (inner: string, kind: 'first' | 'cont', last: boolean) => string;

/**
 * Куски потока разобранной задачи на листе учителя.
 *
 * Первый кусок неделим: условие и рисунок никогда не расходятся по
 * страницам; у разобранного примера с ними неделим и первый этап. Рисунок сбоку стоит
 * рядом с первыми этапами, их столько, сколько по высоте закрывают
 * рисунок. Остальные этапы — по куску на этап: разбор переносится на
 * следующую страницу только между этапами. Ответ — вместе с последним
 * этапом.
 */
function kuskiRazbora(
  golova: string,
  task: Generated,
  drawn: Drawn | null,
  kolonka: number,
  obertka: Obertka,
  sPervymEtapom: boolean,
): string[] {
  const list = etapy(task);
  const answer = answerLine(ru(task.otvet));
  const mesto = drawn === null ? null : mestoRisunka(drawn, kolonka);
  let n: number;
  let first: string;
  if (mesto !== null && mesto.sboku) {
    const tekstW = kolonka - mesto.widthMm - ZAZOR_MM;
    let h = 0;
    n = 0;
    while (n < list.length && h < mesto.heightMm * 0.85) {
      h += vysotaEtapa(list[n] as Generated['shagi'][number], tekstW);
      n += 1;
    }
    first =
      golova +
      `<div class="z9-ryad"><div class="z9-ryad-tekst">${etapyHtml(list.slice(0, n), 1)}</div>` +
      `${mesto.html}</div>` +
      (n >= list.length ? answer : '');
  } else {
    /* Под широким рисунком: у примера с ним неделим и первый этап (пример
       начинается там, где видно, как его решают), у задачи — только
       условие с рисунком, этапы переносятся по одному. */
    n = Math.min(sPervymEtapom ? 1 : 0, list.length);
    first =
      golova +
      (mesto === null ? '' : `<div class="z9-pod-usloviem">${mesto.html}</div>`) +
      (n > 0 ? etapyHtml(list.slice(0, n), 1) : '') +
      (n >= list.length ? answer : '');
  }
  const out = [obertka(first, 'first', n >= list.length)];
  for (let i = n; i < list.length; i += 1) {
    const last = i === list.length - 1;
    out.push(
      obertka(
        etapyHtml([list[i] as Generated['shagi'][number]], i + 1) + (last ? answer : ''),
        'cont',
        last,
      ),
    );
  }
  return out;
}

function klassKuska(kind: 'first' | 'cont', last: boolean): string {
  return `z9-kusok z9-kusok--${kind}${last ? ' z9-kusok--last' : ''}`;
}

/** Задача учителя кусками: одна карточка .sheet-task с номером, дальше — продолжение. */
function kuskiZadachi(task: Generated, no: number, id: string): string[] {
  const golova = `<p class="sheet-task-question">${typo.mathText(task.uslovie)}</p>`;
  return kuskiRazbora(
    golova,
    task,
    drawFigure(task, 'teacher'),
    KOLONKA_MM,
    obertkaZadachi(no, id),
    false,
  );
}

function obertkaZadachi(no: number, id: string): Obertka {
  return (inner, kind, last) =>
    kind === 'first'
      ? `<div class="sheet-item sheet-tasks sheet-tasks--single ${klassKuska(kind, last)}">` +
        `<article class="sheet-task sheet-task--single z9-zadacha" data-task="${typo.attr(id)}">` +
        `<span class="sheet-task-no">${no}</span><div class="sheet-task-body z9-telo">${inner}</div>` +
        '</article></div>'
      : `<div class="sheet-item ${klassKuska(kind, last)}"><div class="z9-prodolzhenie">${inner}</div></div>`;
}

function sheetTask(
  task: Generated,
  no: number,
  layout: SheetLayoutId,
  withAnswers: boolean,
  id = `${task.prototype}|${task.seed}`,
): SheetTask9 {
  const answerText = ru(task.otvet);
  const condition = drawFigure(task, 'student');
  /* У учителя на месте рисунка условия стоит тот же рисунок в режиме
     'teacher' (со вспомогательными построениями); рисунок ученика
     лежит в figureCondition — по нему проверка сверяет наборы. */
  const shown = withAnswers ? drawFigure(task, 'teacher') : condition;
  return {
    no,
    id,
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
    ...(withAnswers ? { kuski: kuskiZadachi(task, no, id) } : {}),
  };
}

const ATTEMPTS_PER_TASK = 30;

/** Прототипы группы, попавшие в выбор: по умолчанию — все прототипы группы. */
function poolOf(group: Gruppa, params: SheetParams9): string[] {
  const all = PROTOTYPES.filter((p) => p.gruppa === group).map((p) => p.id);
  const chosen = all.filter((id) => params.prototypes.includes(id));
  return chosen.length > 0 ? chosen : all;
}

/**
 * Seed урока серии: код комплекта и номер урока, больше ничего. Первый
 * урок — сам код (лист как до серий). Им строятся задачи, которых нет в
 * банке, — порядок вариантов банка задаёт код, а место в нём — номер урока.
 */
export function seedUroka(kod: string, urok: number): string {
  return urok === 0 ? kod : `${kod}~u${urok}`;
}

/** Варианты банка прототипа в порядке серии: перестановка по коду комплекта. */
function bankOrder(proto: string, seriya: string): string[] {
  const seeds = (BANK.find((e) => e.prototype === proto)?.variants ?? []).map((v) => v.seed);
  return rngOf(`${seriya}|${proto}`).sample(seeds, seeds.length);
}

/**
 * Задачи одной группы: `want` штук, прототипы по кругу, воспроизводимо
 * по адресу. Урок u занимает в потоке группы места u·want … u·want +
 * want − 1; место i — прототип pool[i mod L] и его вариант номер
 * ⌊i / L⌋ в порядке серии. Соседние уроки поэтому не пересекаются, пока
 * у прототипа хватает вариантов банка.
 */
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
  const orders = new Map(pool.map((proto) => [proto, bankOrder(proto, params.seed)]));
  const zapasnoy = seedUroka(params.seed, params.urok);
  const seen = new Set<string>();
  const start = params.urok * want;
  let i = start;
  while (out.length < want && i < start + want * ATTEMPTS_PER_TASK + ATTEMPTS_PER_TASK) {
    const proto = pool[i % pool.length] as string;
    const occurrence = Math.floor(i / pool.length);
    i += 1;
    const order = orders.get(proto) ?? [];
    const fromBank = order[occurrence % Math.max(order.length, 1)];
    /* Прототипа нет в банке или его варианты уже стоят на этом листе
       (на один прототип просят больше задач, чем в банке) — задача по
       seed адреса, как раньше: лист не повторяет задачу внутри себя. */
    const seed =
      fromBank !== undefined && !seen.has(`${proto}|${fromBank}`)
        ? fromBank
        : `${zapasnoy}:${proto}:${occurrence}`;
    try {
      const task = generate(proto, seed);
      const key = `${proto}|${task.seed}`;
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
    title: typo.mathText(prototypeById(prototypeId)?.nazvanie ?? ''),
    conditionHtml: typo.mathText(task.uslovie),
    solutionHtml: razborHtml(task, answerText),
    figureSvg: drawn === null ? null : drawn.svg,
    figureWidth:
      drawn === null ? undefined : Math.min(drawn.width(EXAMPLE_CELL_MM), EXAMPLE_MAX_MM),
    figureBelow: true,
  });
}

/**
 * Разобранный пример на листе учителя — кусками, как задача: заголовок,
 * условие, рисунок и первый этап неделимы, дальше этапы по одному.
 * Так пример начинается на странице с «Запомни», если на ней хватает
 * места под условие, рисунок и первый этап.
 */
function exampleKuski(prototypeId: string, seed: string): string[] {
  let task: Generated;
  try {
    task = generate(prototypeId, seed);
  } catch {
    return [];
  }
  const label = typo.text(contentSheet9.labels.example);
  const golova =
    `<p class="sheet-example-title">${typo.mathText(prototypeById(prototypeId)?.nazvanie ?? '')}</p>` +
    `<p class="sheet-task-question">${typo.mathText(task.uslovie)}</p>`;
  return kuskiRazbora(
    golova,
    task,
    drawFigure(task, 'teacher'),
    KOLONKA_PRIMERA_MM,
    (inner, kind, last) =>
      `<div class="sheet-item sheet-example z9-primer ${klassKuska(kind, last)}">` +
      (kind === 'first'
        ? `<span class="sheet-example-label">${label}</span>`
        : `<span class="sheet-example-label z9-nevidim" aria-hidden="true">${label}</span>`) +
      `<div class="sheet-example-text">${inner}</div></div>`,
    true,
  );
}

/** Разобранные примеры группы: прототип и seed — одни на листах ученика и учителя. */
function primeryOf(pool: string[], ramki: number): { proto: string; seed: string }[] {
  if (ramki === 0 || pool.length === 0) {
    return [];
  }
  const real = pool.filter((id) => prototypeById(id)?.zaglushka !== true);
  const from = real.length > 0 ? real : pool;
  const out: { proto: string; seed: string }[] = [];
  for (let i = 0; i < ramki; i += 1) {
    const second = i === 1;
    const proto = from[i % from.length] as string;
    out.push({ proto, seed: second && from.length === 1 ? primerSeed(proto) : opornayaSeed(proto) });
  }
  return out;
}

function theoryOf(group: Gruppa, pool: string[], ramki: number, withAnswers: boolean): string[] {
  const primery = primeryOf(pool, ramki);
  if (primery.length === 0) {
    return [];
  }
  const out: string[] = [zapomniItem(group)];
  for (const { proto, seed } of primery) {
    /* Лист ученика не меняется: пример там — одна рамка. */
    if (withAnswers) {
      out.push(...exampleKuski(proto, seed));
    } else {
      out.push(exampleOf(proto, seed));
    }
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
        theory: theoryOf(group, pool, params.ramki, withAnswers),
        primery: primeryOf(pool, params.ramki).map((p) => `${p.proto}|${p.seed}`),
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
          return sheetTask(
            generate(item.prototype, item.seed),
            no,
            raskladka(options.layout, withAnswers),
            withAnswers,
            `${item.prototype}#${item.n}`,
          );
        }),
        theory: theoryOf(group, pool, options.ramki, withAnswers),
        primery: primeryOf(pool, options.ramki).map((p) => `${p.proto}|${p.seed}`),
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
export function subtitleOf9(
  params: Pick<SheetParams9, 'kind' | 'date'> & { urok?: number },
): string {
  /* Урок серии со второго: по коду комплекта и этому номеру лист
     восстанавливается. Первый урок номера не пишет — лист как до серий. */
  const urok = params.urok !== undefined && params.urok > 0 ? `урок ${params.urok + 1}` : '';
  return [params.kind, params.date === '' ? '' : dateText9(params.date), urok]
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
  /* Первый кусок — полоса группы, за ней рамки, затем задачи. У листа
     учителя задачи свои — кусками (kuskiZadachi), карточки шаблона не нужны. */
  const zadachi = block.tasks.every((t) => t.kuski !== undefined)
    ? block.tasks.flatMap((t) => t.kuski as string[])
    : items.slice(1);
  return [items[0] as string, ...block.theory, ...zadachi];
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
  params: Pick<SheetParams9, 'theme' | 'layout' | 'kind' | 'date'> & { urok?: number },
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
    /* Таблица «Ответы» у учителя идёт сразу за задачами, а не с новой
       страницы: полный разбор уже стоит в каждой задаче, отдельная
       страница под короткую таблицу листу не нужна. */
    extraItems: withAnswers
      ? answersItems(blocks, contentSheet9.labels.answers, contentSheet9.labels.answersNote).map(
          (item: string) => item.replace(' data-page-break="1"', ''),
        )
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
