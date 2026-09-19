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
 */

import type { SheetLayoutId, SheetThemeId } from '@/content/generator';
import contentSheet8 from '@/content/sheet8.js';
import { answersItems } from '@/lib/sheet/answers8.js';
import { typeset } from '../tex';
import { generate, hasLevel } from './generate';
import { ru } from './numbers';
import { prototypeById } from './prototypes';
import { skillById } from './skills';
import type { Level } from './types';

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
}

/** Строка адреса из параметров — тот же формат, что у листа №12. */
export function sheetQuery8(params: SheetParams8): string {
  const query = new URLSearchParams();
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

interface SheetTask8 {
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

/** Блоки листа: по одному на навык, сквозная нумерация задач. */
export function sheetBlocks8(params: SheetParams8, withAnswers: boolean): SheetBlock8[] {
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
  return [params.kind, params.date === '' ? '' : dateText8(params.date)].filter((part) => part !== '').join(' · ');
}

/**
 * Описание листа для шаблона. Ученику — строка «Ответ: ____» и ни
 * одного ответа в тексте карточки; учителю — те же задачи с коротким
 * разбором внутри карточки и сводная таблица «Ответы» в конце.
 */
export function sheetSpec8(params: SheetParams8, withAnswers: boolean) {
  const blocks = sheetBlocks8(params, withAnswers);
  return {
    theme: params.theme,
    layout: params.layout,
    documentTitle: `${contentSheet8.title.chip}. ${contentSheet8.title.text}` + (params.kind ? ` — ${params.kind}` : ''),
    head: contentSheet8.head,
    runner: contentSheet8.runner,
    title: { chip: contentSheet8.title.chip, text: contentSheet8.title.text, subtitle: subtitleOf8(params) },
    recap: null,
    blocks,
    withAnswerLine: !withAnswers,
    extraItems: withAnswers ? answersItems(blocks) : [],
    foot: contentSheet8.foot,
  };
}
