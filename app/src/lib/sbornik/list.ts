/**
 * Лист генератора сборника: параметры в строке запроса → описание листа
 * для шаблона lib/sheet (buildDocument).
 *
 *   t=1.2:3,1.10:2  — типы и сколько задач каждого в варианте
 *   u=12            — уровни (1, 2, 3)
 *   v=2             — вариантов (1–4): задачи вариантов не повторяются
 *   s=k7f2          — зерно: тот же адрес — тот же лист
 *   th=print        — ч/б тема, иначе цветная
 *
 * Лист ученика — условия и строка «Ответ»; лист учителя — те же задачи
 * с решением по шагам и таблица ответов в конце.
 */

import answers from '@/lib/sheet/answers.js';
import { TIPY } from '@/content/sbornik';
import type { Otkrytoe, Uroven, ZadachaKlient } from './types';
import { otkryt } from './zamok';

/** Задача листа: условие и открытое решение. */
export type ZadachaLista = ZadachaKlient & Otkrytoe;

/** Решение закрыто в файле данных — лист открывает его сам. */
export function otkrytDlyaLista(z: ZadachaKlient): ZadachaLista {
  return { ...z, ...(JSON.parse(otkryt(z.zakryto, z.id)) as Otkrytoe) };
}

export interface ParametryLista {
  glava: number;
  tipy: { tip: string; k: number }[];
  urovni: Uroven[];
  varianty: number;
  zerno: string;
  tema: 'color' | 'print';
}

export const VARIANTOV_MAX = 4;
export const ZADACH_TIPA_MAX = 6;

export function zaprosLista(p: ParametryLista): string {
  const q = new URLSearchParams();
  q.set('t', p.tipy.map((t) => `${t.tip}:${t.k}`).join(','));
  q.set('u', p.urovni.join(''));
  if (p.varianty > 1) q.set('v', String(p.varianty));
  q.set('s', p.zerno);
  if (p.tema === 'print') q.set('th', 'print');
  return q.toString();
}

export function razobratZapros(glava: number, q: URLSearchParams): ParametryLista | null {
  const tipyGlavy = new Set((TIPY[glava] ?? []).map((t) => t.id));
  const tipy = (q.get('t') ?? '')
    .split(',')
    .map((chast) => {
      const [tip, k] = chast.split(':');
      return { tip: tip ?? '', k: Math.min(ZADACH_TIPA_MAX, Math.max(0, Math.floor(Number(k)))) };
    })
    .filter((t) => tipyGlavy.has(t.tip) && t.k > 0);
  if (tipy.length === 0) return null;
  const urovni = [...new Set((q.get('u') ?? '123').split('').map(Number))].filter(
    (u): u is Uroven => u === 1 || u === 2 || u === 3,
  );
  const v = Math.floor(Number(q.get('v') ?? '1'));
  return {
    glava,
    tipy,
    urovni: urovni.length === 0 ? [1, 2, 3] : urovni,
    varianty: Number.isFinite(v) ? Math.min(VARIANTOV_MAX, Math.max(1, v)) : 1,
    zerno: (q.get('s') ?? 'a').slice(0, 16),
    tema: q.get('th') === 'print' ? 'print' : 'color',
  };
}

/** Детерминированный генератор по строке-зерну (mulberry32 от хеша). */
function rng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BlokLista {
  title: string;
  tasks: ZadachaLista[];
}

/** Варианты: по каждому типу — k разных задач на вариант, без повторов между вариантами. */
export function sobratVarianty(p: ParametryLista, poTipam: Map<string, readonly ZadachaKlient[]>): BlokLista[][] {
  const rand = rng(`${p.zerno}:${p.glava}`);
  const varianty: BlokLista[][] = Array.from({ length: p.varianty }, () => []);
  for (const { tip, k } of p.tipy) {
    const pul = (poTipam.get(tip) ?? []).filter((z) => p.urovni.includes(z.uroven));
    const perem = [...pul];
    for (let i = perem.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [perem[i], perem[j]] = [perem[j]!, perem[i]!];
    }
    const nazvanie = (TIPY[p.glava] ?? []).find((t) => t.id === tip)?.nazvanie ?? tip;
    varianty.forEach((blocks, vi) => {
      const tasks = perem
        .slice(vi * k, vi * k + k)
        .sort((a, b) => a.uroven - b.uroven)
        .map(otkrytDlyaLista);
      if (tasks.length > 0) blocks.push({ title: `${tip}. ${nazvanie}`, tasks });
    });
  }
  return varianty;
}

const STROKA_OTVETA = '<p class="sheet-answer-line">Ответ:<span class="sheet-answer-blank"></span></p>';

function uslovieHtml(z: ZadachaKlient): string {
  return (
    `<p>${z.uslovieHtml}${z.formulaHtml === undefined ? '' : ':'}</p>` +
    (z.formulaHtml === undefined ? '' : `<div class="sb-list-formula">${z.formulaHtml}</div>`) +
    (z.dopolnenieHtml === undefined ? '' : `<p>${z.dopolnenieHtml}</p>`)
  );
}

function reshenieHtml(z: ZadachaLista): string {
  const shagi = z.shagi
    .map(
      (s) =>
        `<li class="sheet-step"><span class="sheet-step-text">${s.chtoHtml}</span>` +
        (s.formulaHtml === '' ? '' : ` <span class="sb-list-shag">${s.formulaHtml}</span>`) +
        '</li>',
    )
    .join('');
  return `<ol class="sheet-steps">${shagi}</ol><p class="sheet-task-answer">Ответ: <b>${z.otvetHtml}</b></p>`;
}

const HEAD = { course: 'Алгебра для поступающих в вузы', author: 'Багаева Н.В.', motto: 'Больше, чем подготовка' };

/** Описание листа для buildDocument. */
export function specLista(p: ParametryLista, varianty: BlokLista[][], sOtvetami: boolean) {
  let no = 0;
  const bloki = varianty.map((blocks) => {
    no = 0;
    return blocks.map((b) => ({
      title: b.title,
      note: '',
      set: b.title,
      tasks: b.tasks.map((z) => {
        no += 1;
        return {
          no,
          id: z.id,
          questionHtml: uslovieHtml(z),
          options: null,
          figureSvg: null,
          answer: z.otvetTex,
          answerHtml: z.otvetHtml,
          solutionHtml: sOtvetami ? reshenieHtml(z) : STROKA_OTVETA,
        };
      }),
    }));
  });
  const title = (variant?: string) => ({
    chip: `Глава ${p.glava}`,
    text: 'Сборник для поступающих в вузы',
    subtitle: sOtvetami ? 'Решения и ответы' : 'Задачи для решения',
    ...(variant === undefined ? {} : { variant }),
  });
  const otvety: string[] = [];
  if (sOtvetami) {
    otvety.push(answers.sectionHead('Ответы', 'по вариантам', { section: true }));
    bloki.forEach((blocks, i) => {
      if (bloki.length > 1) otvety.push(answers.subHead(`Вариант ${i + 1}`));
      for (const b of blocks) {
        otvety.push(
          answers.table(
            b.title,
            b.tasks.map((t) => ({ no: t.no, answer: t.answer, html: t.answerHtml })),
            3,
          ),
        );
      }
    });
  }
  return {
    theme: p.tema,
    layout: 'single',
    documentTitle: `Сборник для вузов. Глава ${p.glava}${sOtvetami ? ' — решения' : ''}`,
    head: HEAD,
    runner: `Сборник для вузов · Глава ${p.glava}`,
    title: title(bloki.length > 1 ? 'Вариант 1' : undefined),
    recap: null,
    blocks: bloki[0] ?? [],
    fields: { date: '' },
    ...(bloki.length > 1
      ? { variants: bloki.map((blocks, i) => ({ title: title(`Вариант ${i + 1}`), blocks })) }
      : {}),
    withAnswerLine: false,
    extraItems: otvety,
    foot: { course: 'Алгебра для поступающих в вузы', social: [] },
  };
}
