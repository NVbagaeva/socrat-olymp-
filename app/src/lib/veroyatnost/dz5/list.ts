/**
 * Печатные листы задач-шаблонов №5: «Домашняя работа» и генератор.
 *
 * Тот же шаблон lib/sheet/, что у листов №4, №5 и №12: здесь только
 * куски разметки. Листов три вида:
 *   uchenik   — задачи со строкой «Ответ: ____», без ответов;
 *   otvety    — только таблица ответов (для учителя);
 *   resheniya — только решения по шагам (для учителя);
 *   uchitel   — лист учителя генератора: задачи, ответы и решения.
 * Пометка типа задачи на печать не выходит: она есть только на экране
 * учителя.
 */

import content from '@/content/sheet12.js';
import answers from '@/lib/sheet/answers.js';
import typo from '@/lib/sheet/typography.js';
import type { Zadacha5 } from './tipy';

export type VidLista = 'uchenik' | 'otvety' | 'resheniya' | 'uchitel';

export interface ListParams {
  vid: VidLista;
  theme: 'color' | 'print';
  layout: 'single' | 'double';
  /** Шапка: плашка, название, подзаголовок (вид работы, дата). */
  title: { chip: string; text: string; subtitle: string };
  /** Дата в строке «Фамилия, имя / Класс / Дата», ДД.ММ.ГГГГ. Пусто — пустая строка. */
  date: string;
  /** Варианты: у ДЗ один, у генератора до четырёх. */
  naVarianty: Zadacha5[][];
}

/** Ширина диаграммы Эйлера на листе, мм. */
const SHIRINA_RISUNKA = 62;

/** Условие с абзацами: формулы — заглушки KaTeX, абзацы — через перенос. */
export function uslovieHtml(uslovie: string): string {
  return uslovie
    .split('\n\n')
    .map((abzats) => typo.mathText(abzats))
    .join('<br>');
}

function zadachiLista(zadachi: Zadacha5[]) {
  return zadachi.map((z, i) => ({
    no: i + 1,
    id: z.id,
    questionHtml: uslovieHtml(z.uslovie),
    options: null,
    figureSvg: z.risunok,
    figureWidth: z.risunok === null ? undefined : SHIRINA_RISUNKA,
    answer: '',
    answerHtml: null,
  }));
}

/* Таблица «номер — ответ», по две задачи в строке: у задач из
   нескольких частей ответ длинный («а) нет; б) 0,052; в) 0,52»).
   Колонки «метод» нет: тип задачи на печать не выходит. */
function klyuch(zadachi: Zadacha5[]): string[] {
  return [
    answers.table(
      '',
      zadachi.map((z, i) => ({ no: i + 1, answer: z.otvet, html: null })),
      2,
    ),
  ];
}

function resheniya(zadachi: Zadacha5[]): string[] {
  return zadachi.map((z, i) =>
    answers.fullSolution(
      i + 1,
      /* Двоеточие перед формулой ставит сам шаблон листа. */
      z.reshenie.map((s) =>
        s.tex === undefined
          ? { title: s.text, formulas: [] }
          : { title: s.text.replace(/:\s*$/, ''), formulas: [s.tex] },
      ),
      z.otvet,
    ),
  );
}

/** Раздел «по вариантам»: подзаголовок «Вариант K», если вариантов несколько. */
function poVariantam(naVarianty: Zadacha5[][], kusok: (z: Zadacha5[]) => string[]): string[] {
  const many = naVarianty.length > 1;
  return naVarianty.flatMap((v, i) => [
    ...(many ? [answers.subHead(`Вариант ${i + 1}`)] : []),
    ...kusok(v),
  ]);
}

/** Описание листа для buildDocument. */
export function list5Spec(params: ListParams) {
  const { vid, naVarianty } = params;
  const base = {
    theme: params.theme,
    layout: params.layout,
    cell: 3.4,
    documentTitle: [params.title.chip, params.title.text, params.title.subtitle]
      .filter(Boolean)
      .join(' · '),
    head: content.head,
    runner: `${params.title.chip} · ${params.title.text}`,
    recap: null,
    foot: content.foot,
    fields: { date: params.date },
  };

  /* Ответы или решения отдельно: задач на листе нет, раздел идёт
     сразу под шапкой, без разрыва страницы. */
  if (vid === 'otvety' || vid === 'resheniya') {
    return {
      ...base,
      title: params.title,
      /* Лист учителя: строки «Фамилия, имя / Класс» на нём не нужно. */
      fields: undefined,
      blocks: [],
      leadItems: poVariantam(naVarianty, vid === 'otvety' ? klyuch : resheniya),
      withAnswerLine: false,
      extraItems: [],
    };
  }

  const uchitel = vid === 'uchitel';
  const extraItems = uchitel
    ? [
        answers.sectionHead('Ответы', 'Только для учителя', { section: naVarianty.length > 1 }),
        ...poVariantam(naVarianty, klyuch),
        answers.sectionHead('Решения', 'по шагам, как на странице решений'),
        ...poVariantam(naVarianty, resheniya),
      ]
    : [];
  const bloki = (zadachi: Zadacha5[]) => [
    { title: '', note: '', set: '', head: false, tasks: zadachiLista(zadachi) },
  ];

  if (naVarianty.length > 1) {
    return {
      ...base,
      title: params.title,
      variants: naVarianty.map((v, i) => ({
        title: { ...params.title, variant: `Вариант ${i + 1}` },
        blocks: bloki(v),
      })),
      blocks: [],
      withAnswerLine: !uchitel,
      extraItems,
    };
  }
  return {
    ...base,
    title: params.title,
    blocks: bloki(naVarianty[0] ?? []),
    withAnswerLine: !uchitel,
    extraItems,
  };
}
