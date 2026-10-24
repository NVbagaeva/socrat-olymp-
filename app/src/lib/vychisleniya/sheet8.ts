'use client';

/**
 * Лист для печати задания №8: адрес → задачи → описание листа.
 *
 * Параметры варианта живут в адресе страницы печати: один и тот же
 * адрес всегда даёт один и тот же лист, а лист ученика и лист
 * с ответами по одному адресу содержат одни и те же задачи. Задачи
 * считает движок №8 в браузере, лист раскладывает тот же шаблон
 * lib/sheet/, что печатает сборники №4 и №12.
 *
 * Ответ ученику не нужен для проверки — лист печатный, «Проверить»
 * на нём нет, — поэтому здесь он хранится обычной строкой, как и
 * в генераторе №12: тот же уровень защиты, что у листа для печати
 * в остальных разделах (см. lib/generatorSheet.ts). Разбор решения
 * считается только для листа с ответами: student-запрос его вообще
 * не строит.
 *
 * Адреса общего генератора (ps=2): состав по прототипам с числом задач
 * и ключами позиций (lib/generator/obshchiy/klyuchi.ts), до четырёх
 * вариантов, замены, учитель в шапке и QR-код. Задача позиции — по seed
 * листа, варианту и ключу; задачи одного прототипа в варианте не
 * повторяются. Прежние адреса собираются как раньше.
 */

import type { SheetLayoutId, SheetThemeId } from '@/content/generator';
import contentSheet8 from '@/content/sheet8.js';
import {
  klyuchSlota,
  razobratSostav,
  slotySostava,
  sostavIzSlotov,
  sostavStroka,
} from '@/lib/generator/obshchiy/klyuchi';
import answers from '@/lib/sheet/answers.js';
import { answersItems } from '@/lib/sheet/answers8.js';
import { typeset } from '../tex';
import { generate, hasLevel } from './generate';
import { ru } from './numbers';
import { prototypeById } from './prototypes';
import { skillById, skillOfPrototype } from './skills';
import type { Generated, Level } from './types';

export interface SheetParams8 {
  /** Навыки: S1 … S11. */
  skills: string[];
  count: number;
  /** Уровень задач. null — любой. */
  level: Level | null;
  seed: string;
  theme: SheetThemeId;
  layout: SheetLayoutId;
  /** Вид работы: подзаголовок листа. */
  kind: string;
  /** Дата в подзаголовке, в записи ГГГГ-ММ-ДД. Пусто — даты нет. */
  date: string;
  /** Схема ps=2 (общий генератор): состав с ключами позиций. */
  poKlyucham?: boolean;
  /** Вариантов одной структуры (ps=2): 1–4. */
  variants?: number;
  /** Состав ps=2: прототип, число задач, ключ первой. */
  sostav?: { id: string; n: number; k?: number }[];
  /** Замены ps=2: «вариант.ключ» («2.8.A_0») → сколько раз заменяли. */
  zameny?: Record<string, number>;
  /** Учитель в шапке листа (ps=2); нет — как в шаблоне. */
  uchitel?: string;
  /** QR-код на лист ученика в строке названия (ps=2). */
  qr?: boolean;
}

export const VARIANTS_MAX = 4;

/** Строка адреса из параметров — тот же формат, что у листа №12. */
export function sheetQuery8(params: SheetParams8): string {
  const query = new URLSearchParams();
  if (params.poKlyucham === true) {
    query.set('ps', '2');
    query.set('s', sostavStroka(params.sostav ?? []));
    if ((params.variants ?? 1) > 1) query.set('v', String(params.variants));
    if (params.level !== null) query.set('l', params.level);
    query.set('seed', params.seed);
    query.set('t', params.theme);
    query.set('c', params.layout === 'double' ? '2' : '1');
    if (params.kind !== '') query.set('k', params.kind);
    if (params.date !== '') query.set('d', params.date);
    if (params.uchitel !== undefined && params.uchitel !== contentSheet8.head.author) {
      query.set('uch', params.uchitel);
    }
    if (params.qr === true) query.set('qr', '1');
    const z = Object.entries(params.zameny ?? {}).filter(([, k]) => k > 0);
    if (z.length > 0) query.set('z', z.map(([pos, k]) => `${pos}:${k}`).join(','));
    return query.toString();
  }
  query.set('s', params.skills.join(','));
  query.set('n', String(params.count));
  if (params.level !== null) {
    query.set('l', params.level);
  }
  query.set('seed', params.seed);
  query.set('t', params.theme);
  query.set('c', params.layout === 'double' ? '2' : '1');
  if (params.kind !== '') {
    query.set('k', params.kind);
  }
  if (params.date !== '') {
    query.set('d', params.date);
  }
  return query.toString();
}

/** Параметры из адреса. Чего в адресе нет — берётся по умолчанию. */
export function parseSheetQuery8(query: URLSearchParams): SheetParams8 {
  if (query.get('ps') === '2') return parseKlyuchi8(query);
  const skills = (query.get('s') ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
  const count = Number(query.get('n'));
  const level = query.get('l');
  return {
    skills,
    count: Number.isFinite(count) && count > 0 ? Math.floor(count) : 10,
    level: level === 'base' || level === 'advanced' ? level : null,
    seed: query.get('seed') ?? 'variant',
    theme: query.get('t') === 'print' ? 'print' : 'color',
    layout: query.get('c') === '2' ? 'double' : 'single',
    kind: query.get('k') ?? '',
    date: /^\d{4}-\d{2}-\d{2}$/.test(query.get('d') ?? '') ? (query.get('d') as string) : '',
  };
}

/** Адрес общего генератора (ps=2). */
function parseKlyuchi8(query: URLSearchParams): SheetParams8 {
  const sostav = sostavIzSlotov(
    slotySostava(
      razobratSostav(
        query.get('s') ?? '',
        true,
        /8\.[A-Z]/,
        (id) => prototypeById(id) !== undefined && skillOfPrototype(id) !== undefined,
      ),
    ),
  );
  const variants = Number(query.get('v'));
  const level = query.get('l');
  const zameny: Record<string, number> = {};
  for (const item of (query.get('z') ?? '').split(',')) {
    const [pos = '', k = ''] = item.split(':');
    if (/^\d+\.8\.[A-Z]_\d{1,2}$/.test(pos) && Number(k) > 0) zameny[pos] = Math.min(50, Number(k));
  }
  return {
    skills: [...new Set(sostav.map((x) => skillOfPrototype(x.id)?.id ?? ''))],
    count: sostav.reduce((a, x) => a + x.n, 0),
    level: level === 'base' || level === 'advanced' ? level : null,
    seed: (query.get('seed') ?? 'variant').slice(0, 24),
    theme: query.get('t') === 'print' ? 'print' : 'color',
    layout: query.get('c') === '2' ? 'double' : 'single',
    kind: (query.get('k') ?? '').slice(0, 60),
    date: /^\d{4}-\d{2}-\d{2}$/.test(query.get('d') ?? '') ? (query.get('d') as string) : '',
    poKlyucham: true,
    variants:
      Number.isFinite(variants) && variants > 1 ? Math.min(VARIANTS_MAX, Math.floor(variants)) : 1,
    sostav,
    zameny,
    ...(query.has('uch')
      ? {
          uchitel: (query.get('uch') ?? '')
            .replace(/[\u0000-\u001f<>]/g, '')
            .trim()
            .slice(0, 40),
        }
      : {}),
    ...(query.get('qr') === '1' ? { qr: true } : {}),
  };
}

interface SheetTask8 {
  /** Ключ позиции «вариант.ключ» (ps=2): для замены в генераторе. */
  pos?: string;
  no: number;
  id: string;
  questionHtml: string;
  options: null;
  figureSvg: null;
  answer: string;
  answerHtml: null;
  solutionHtml: string | null;
}

interface SheetBlock8 {
  title: string;
  note: string;
  set: string;
  tasks: SheetTask8[];
}

/** Разбор: список шагов и строка ответа, свёрстано под ту же CSS, что у №12. */
function razborHtml(lines: string[], answerText: string): string {
  const items = lines.map((line) => `<li class="sheet-step">${typeset(line)}</li>`).join('');
  return `<ol class="sheet-steps">${items}</ol><p class="sheet-task-answer">Ответ: <b>${answerText}</b></p>`;
}

/** Прототипы навыка, подходящие уровню; нет ни одного — берутся все навыка. */
function prototypesOf(skillId: string, level: Level | null): string[] {
  const skill = skillById(skillId);
  if (skill === undefined) {
    return [];
  }
  const fit = skill.prototypes.filter((id) => {
    const prototype = prototypeById(id);
    return prototype !== undefined && (level === null || hasLevel(prototype, level));
  });
  return fit.length > 0 ? fit : skill.prototypes;
}

const ATTEMPTS_PER_TASK = 30;

/** Задачи одного навыка: `want` штук, воспроизводимо по адресу. */
function tasksForSkill(
  skillId: string,
  level: Level | null,
  want: number,
  base: string,
  numberRef: { n: number },
  withAnswers: boolean,
): SheetTask8[] {
  const pool = prototypesOf(skillId, level);
  if (pool.length === 0) {
    return [];
  }
  const attempts = new Map<string, number>();
  const out: SheetTask8[] = [];
  let cursor = 0;
  let guard = 0;
  while (out.length < want && guard < want * ATTEMPTS_PER_TASK + ATTEMPTS_PER_TASK) {
    guard += 1;
    const proto = pool[cursor % pool.length] as string;
    cursor += 1;
    const attempt = attempts.get(proto) ?? 0;
    attempts.set(proto, attempt + 1);
    const seed = `${base}:${proto}:${attempt}`;
    try {
      const task = generate(proto, seed, level);
      numberRef.n += 1;
      const answerText = ru(task.otvet);
      out.push({
        no: numberRef.n,
        id: `${proto}|${seed}`,
        questionHtml: typeset(task.uslovie),
        options: null,
        figureSvg: null,
        answer: answerText,
        answerHtml: null,
        solutionHtml: withAnswers ? razborHtml(task.razbor, answerText) : null,
      });
    } catch {
      /* Параметры не подобрались на этом seed — берём следующий. */
    }
  }
  return out;
}

/** Задача позиции (ps=2): по seed позиции, без повтора уже взятых условий. */
function zadachaPozicii(
  id: string,
  seed: string,
  level: Level | null,
  nePovtor: ReadonlySet<string>,
): Generated | null {
  let first: Generated | null = null;
  for (let a = 0; a < ATTEMPTS_PER_TASK; a += 1) {
    try {
      const task = generate(id, a === 0 ? seed : `${seed}~${a}`, level);
      if (!nePovtor.has(task.uslovie)) return task;
      first ??= task;
    } catch {
      /* Параметры не подобрались на этом seed — берём следующий. */
    }
  }
  /* Условий у прототипа меньше, чем задач на листе: повтор лучше пропуска. */
  return first;
}

/**
 * Задачи позиций варианта (ps=2). Позиции одного прототипа считаются
 * по возрастанию ключа и не повторяют условий младших: перестановка
 * задач их не меняет, а удаление соседней — только если та совпала бы.
 * Каждая замена отличается и от прежних задач позиции.
 */
function zadachiVarianta(params: SheetParams8, variant: number): Map<string, Generated> {
  const sloty = slotySostava(params.sostav ?? []);
  const poryadok = sloty.slice().sort((a, b) => a.id.localeCompare(b.id) || a.k - b.k);
  const out = new Map<string, Generated>();
  const vzyato = new Map<string, Set<string>>();
  for (const slot of poryadok) {
    const key = klyuchSlota(slot);
    const base = `${params.seed}|${variant}|${key}`;
    const z = params.zameny?.[`${variant}.${key}`] ?? 0;
    const zanyato = vzyato.get(slot.id) ?? new Set<string>();
    let task = zadachaPozicii(slot.id, base, params.level, zanyato);
    const bylo = new Set([...zanyato, ...(task === null ? [] : [task.uslovie])]);
    for (let j = 1; j <= z && task !== null; j += 1) {
      task = zadachaPozicii(slot.id, `${base}|z${j}`, params.level, bylo) ?? task;
      bylo.add(task.uslovie);
    }
    if (task === null) continue;
    out.set(key, task);
    zanyato.add(task.uslovie);
    vzyato.set(slot.id, zanyato);
  }
  return out;
}

/** Блоки варианта (ps=2): подряд идущие задачи одного навыка, сквозная нумерация. */
function blokiPoKlyucham(params: SheetParams8, withAnswers: boolean, variant: number) {
  const zadachi = zadachiVarianta(params, variant);
  const out: SheetBlock8[] = [];
  let no = 0;
  for (const slot of slotySostava(params.sostav ?? [])) {
    const task = zadachi.get(klyuchSlota(slot));
    const skill = skillOfPrototype(slot.id);
    if (task === undefined || skill === undefined) continue;
    no += 1;
    const answerText = ru(task.otvet);
    const t: SheetTask8 = {
      pos: `${variant}.${klyuchSlota(slot)}`,
      no,
      id: `${slot.id}|${task.seed}`,
      questionHtml: typeset(task.uslovie),
      options: null,
      figureSvg: null,
      answer: answerText,
      answerHtml: null,
      solutionHtml: withAnswers ? razborHtml(task.razbor, answerText) : null,
    };
    const last = out[out.length - 1];
    if (last !== undefined && last.set === skill.id) last.tasks.push(t);
    else out.push({ title: skill.nazvanie, note: '', set: skill.id, tasks: [t] });
  }
  return out;
}

/** Все варианты листа (ps=2); у прежнего адреса вариант один. */
export function sheetVariants8(params: SheetParams8, withAnswers: boolean): SheetBlock8[][] {
  if (params.poKlyucham !== true) return [sheetBlocks8(params, withAnswers)];
  return Array.from({ length: params.variants ?? 1 }, (_, i) =>
    blokiPoKlyucham(params, withAnswers, i + 1),
  );
}

/** Блоки листа: по одному на навык, сквозная нумерация задач. */
export function sheetBlocks8(params: SheetParams8, withAnswers: boolean): SheetBlock8[] {
  if (params.poKlyucham === true) return blokiPoKlyucham(params, withAnswers, 1);
  const numberRef = { n: 0 };
  const skills = params.skills;
  const base = Math.floor(params.count / Math.max(1, skills.length));
  let rest = params.count - base * skills.length;

  return skills
    .map((skillId) => {
      const extra = rest > 0 ? 1 : 0;
      rest -= extra;
      const want = base + extra;
      const tasks = tasksForSkill(skillId, params.level, want, params.seed, numberRef, withAnswers);
      return {
        title: skillById(skillId)?.nazvanie ?? skillId,
        note: '',
        set: skillId,
        tasks,
      };
    })
    .filter((block) => block.tasks.length > 0);
}

/** «18.09.2026» из записи ГГГГ-ММ-ДД. */
export function dateText8(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
}

/** Подзаголовок листа: вид работы и дата, что есть. */
export function subtitleOf8(params: Pick<SheetParams8, 'kind' | 'date'>): string {
  return [params.kind, params.date === '' ? '' : dateText8(params.date)]
    .filter((part) => part !== '')
    .join(' · ');
}

/**
 * Описание листа для шаблона. Ученику — строка «Ответ: ____» и ни
 * одного ответа в тексте карточки; учителю — те же задачи с коротким
 * разбором внутри карточки и сводная таблица «Ответы» в конце.
 */
export function sheetSpec8(
  params: SheetParams8,
  withAnswers: boolean,
  /** QR-код на лист ученика, SVG: считает страница печати по своему адресу. */
  qrSvg?: string,
) {
  if (params.poKlyucham === true) return specPoKlyucham(params, withAnswers, qrSvg);
  const blocks = sheetBlocks8(params, withAnswers);
  return {
    theme: params.theme,
    layout: params.layout,
    documentTitle:
      `${contentSheet8.title.chip}. ${contentSheet8.title.text}` +
      (params.kind ? ` — ${params.kind}` : ''),
    head: contentSheet8.head,
    runner: contentSheet8.runner,
    title: {
      chip: contentSheet8.title.chip,
      text: contentSheet8.title.text,
      subtitle: subtitleOf8(params),
    },
    recap: null,
    blocks,
    withAnswerLine: !withAnswers,
    extraItems: withAnswers ? answersItems(blocks) : [],
    foot: contentSheet8.foot,
  };
}

/** Раздел «Ответы» листа ps=2: таблица на блок, у нескольких вариантов — с подзаголовком. */
function answersItemsVariantov(variants: SheetBlock8[][]): string[] {
  if (variants.length === 1) return answersItems(variants[0] ?? []);
  const items: string[] = [
    answers.sectionHead('Ответы', 'по навыкам, сквозная нумерация', { section: true }),
  ];
  variants.forEach((blocks, i) => {
    items.push(answers.subHead(`Вариант ${i + 1}`));
    for (const block of blocks) {
      items.push(
        answers.table(
          block.title,
          block.tasks.map((task) => ({ no: task.no, answer: task.answer, html: null })),
          5,
        ),
      );
    }
  });
  return items;
}

function titleOf(params: SheetParams8, variant?: string, qrSvg?: string) {
  return {
    chip: contentSheet8.title.chip,
    text: contentSheet8.title.text,
    /* Лист генератора без вида работы и даты — подпись по умолчанию. */
    subtitle: subtitleOf8(params) || contentSheet8.title.subtitle,
    ...(variant === undefined ? {} : { variant }),
    ...(params.qr === true && qrSvg !== undefined ? { qr: qrSvg } : {}),
  };
}

/** Лист ps=2: варианты, поле даты, учитель в шапке, QR-код. */
function specPoKlyucham(params: SheetParams8, withAnswers: boolean, qrSvg?: string) {
  const variants = sheetVariants8(params, withAnswers);
  return {
    theme: params.theme,
    layout: params.layout,
    documentTitle:
      `${contentSheet8.title.chip}. ${contentSheet8.title.text}` +
      (params.kind ? ` — ${params.kind}` : ''),
    head:
      params.uchitel === undefined
        ? contentSheet8.head
        : { ...contentSheet8.head, author: params.uchitel },
    runner: contentSheet8.runner,
    title: titleOf(params, undefined, qrSvg),
    recap: null,
    blocks: variants[0] ?? [],
    fields: { date: params.date === '' ? '' : dateText8(params.date) },
    ...(variants.length > 1
      ? {
          variants: variants.map((list, i) => ({
            title: titleOf(params, `Вариант ${i + 1}`, qrSvg),
            blocks: list,
          })),
        }
      : {}),
    withAnswerLine: !withAnswers,
    extraItems: withAnswers ? answersItemsVariantov(variants) : [],
    foot: contentSheet8.foot,
  };
}

const STROKA_OTVETA =
  '<p class="sheet-answer-line">Ответ:<span class="sheet-answer-blank"></span></p>';

/**
 * «Всё одним файлом» генератора: листы ученика всех вариантов (со
 * строкой ответа), затем листы учителя и таблица ответов.
 */
export function sheetSpecVse8(params: SheetParams8, qrSvg?: string) {
  const uchenik = sheetVariants8(params, false);
  const uchitel = sheetVariants8(params, true);
  const n = uchenik.length;
  const nazvanie = (i: number, reshenie: boolean) => {
    const t = titleOf(params, n > 1 ? `Вариант ${i + 1}` : undefined, qrSvg);
    return reshenie
      ? { ...t, subtitle: [t.subtitle, contentSheet8.resheniya].filter(Boolean).join(' · ') }
      : t;
  };
  const spec = specPoKlyucham({ ...params, poKlyucham: true }, true, qrSvg);
  return {
    ...spec,
    blocks: [],
    variants: [
      ...uchenik.map((blocks, i) => ({
        title: nazvanie(i, false),
        blocks: blocks.map((b) => ({
          ...b,
          tasks: b.tasks.map((t) => ({ ...t, solutionHtml: STROKA_OTVETA })),
        })),
      })),
      ...uchitel.map((blocks, i) => ({ title: nazvanie(i, true), blocks })),
    ],
    withAnswerLine: false,
  };
}
