/**
 * Печатный лист №6 на общем шаблоне lib/sheet (buildDocument): шапка,
 * поля «Фамилия / Класс / Дата», карточки задач с рисунком, строка
 * ответа, место для решения, разбиение на страницы A4 (paginate.js) —
 * как у листов остальных генераторов.
 *
 * Разметку условия, рисунка и разбора дают компоненты раздела (Uslovie6,
 * Ris6, Razbor6, KartochkaTelo6) — без состояния, поэтому отрисовываются
 * в строку (`renderToStaticMarkup`); тот же ход у адаптера «Собрать
 * вариант» (lib/variant/adapters/z06), рисунок и разбор у них общие.
 *
 *   Ученик  — условия с рисунками (без выделений), строка «Ответ: ____».
 *   Учитель — те же задачи, ключ ответов варианта и разбор по шагам; шаги
 *             разбора — отдельные куски потока: разбор переносится на
 *             следующую страницу между шагами, а не рвётся посередине.
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { KartochkaTelo6 } from '@/components/tasks/zadanie6/KartochkaTelo6';
import { Razbor6 } from '@/components/tasks/zadanie6/Razbor6';
import { Ris6 } from '@/components/tasks/zadanie6/Ris6';
import { Uslovie6 } from '@/components/tasks/zadanie6/Uslovie6';
import { RamkaPrimer } from '@/components/teoriya/Ramki';
import { TEORIYA_6_DLYA_PROTOTIPA, vseKartochki6, type Kartochka6 } from '@/content/teoriya6';
import { GENERATOR_6 } from '@/content/zadanie6';
import typo from '@/lib/sheet/typography.js';
import { listSheetSpec, razborKuski, type ListVid } from '@/lib/sheetList';
import type { ZadachaLite } from './dannye';
import type { ModelLista } from './sborka';
import type { Ris, Solved, Uslovie } from './types';

/* ── Рисунок ────────────────────────────────────────────────────── */

/** Миллиметров в CSS-пикселе: рисунки №6 заданы в пикселях. */
const MM_V_PX = 25.4 / 96;
/** Дерево на листе №6 не шире 340 px (zadanie6.css, @media print). */
const DEREVO_MAX_PX = 340;
/** Шире — рисунок под условием, а не справа. */
const SBOKU_MAX_MM = 80;
/** Самый мелкий кегль подписей рисунков №6, px (probability.css):
    у диаграммы Эйлера — вероятности точек (.pr-eiler__p). */
const MIN_FONT_PX = { eiler: 11.5, derevo: 13 } as const;

export interface Figure6 {
  svg: string;
  width: number;
  below?: boolean;
}

/** Рисунок условия отдельно от текста: диаграмма Эйлера и дерево. */
export function otdelnyy(ris: Ris | undefined): ris is Extract<Ris, { vid: 'eiler' | 'derevo' }> {
  return ris !== undefined && (ris.vid === 'eiler' || ris.vid === 'derevo');
}

/** SVG рисунка Ris6 без обёртки <figure>: ширину и место задаёт лист. */
export function figure6(ris: Extract<Ris, { vid: 'eiler' | 'derevo' }>): Figure6 {
  const html = renderToStaticMarkup(createElement(Ris6, { ris }));
  /* Кегли подписей рисунка заданы в CSS (components/probability/
     probability.css, MIN_FONT_PX): лист узнаёт самый мелкий из
     data-min-font и печатает рисунок не мельче 10 pt (figureRules.js). */
  const svg = html
    .replace(/^<figure[^>]*>/, '')
    .replace(/<\/figure>$/, '')
    .replace(/^<svg/, `<svg data-min-font="${MIN_FONT_PX[ris.vid]}"`);
  const w = Number(/^<svg[^>]*\swidth="([\d.]+)"/.exec(svg)?.[1] ?? 0);
  const px = ris.vid === 'derevo' ? Math.min(w, DEREVO_MAX_PX) : w;
  const mm = Math.round(px * MM_V_PX);
  return { svg, width: mm, ...(mm > SBOKU_MAX_MM ? { below: true } : {}) };
}

/* ── Разбор ─────────────────────────────────────────────────────── */

/** Строка «**Ответ:** …» в шаге: ответ на листе стоит отдельно. */
const OTVET = /^\s*\*{0,2}Ответ:/;

/**
 * Разбор листа учителя (Razbor6) без строки ответа. Панель «Считаем с
 * умом» на экране свёрнута (<details>), на бумаге свёрнутая не
 * печатается — здесь она раскрыта.
 */
export function razbor6Html(s: Solved): string {
  const bezOtveta: Solved = {
    ...s,
    etapy: s.etapy.map((e) => ({ ...e, lines: e.lines.filter((l) => !OTVET.test(l)) })),
  };
  return renderToStaticMarkup(createElement(Razbor6, { s: bezOtveta })).replace(
    /<details class="z6-razbor__calc">/g,
    '<details class="z6-razbor__calc" open="">',
  );
}

/** Ответ строкой: десятичная запятая и настоящий минус. */
export function otvetText6(x: number): string {
  return String(x).replace('.', ',').replace('-', '−');
}

/* ── Лист ───────────────────────────────────────────────────────── */

export type Vid6 = ListVid;

export interface Sborka6 {
  model: ModelLista;
  zadachi: ReadonlyMap<string, ZadachaLite>;
  reshit: (z: ZadachaLite) => Solved;
  risunok: (z: ZadachaLite) => Ris | undefined;
}

/** Рамки теории: карточки теории прототипов блока, каждая один раз. */
function ramkiTeorii(prototipy: readonly string[]): string[] {
  const vse = vseKartochki6();
  const ids = [...new Set(prototipy.flatMap((p) => TEORIYA_6_DLYA_PROTOTIPA(p)?.kartochka ?? []))];
  return ids
    .flatMap((id) => vse.find((k) => k.id === id) ?? [])
    .map((k) => renderToStaticMarkup(createElement(KartochkaTelo6, { k: k as Kartochka6 })));
}

/** Условие задачи: текст (и таблица распределения), рисунок — отдельно. */
function uslovie(o: Sborka6, z: ZadachaLite): { html: string; figure: Figure6 | null } {
  const ris = o.risunok(z);
  const figure = otdelnyy(ris) ? figure6(ris) : null;
  const u: Uslovie = {
    text: z.text,
    ...(ris !== undefined && figure === null ? { ris } : {}),
    ...(z.posle === undefined ? {} : { posle: z.posle }),
  };
  const metka =
    z.source === 'analog'
      ? `<p class="z6-list__metka">${typo.escape(GENERATOR_6.analogMetka)}</p>`
      : '';
  return { html: renderToStaticMarkup(createElement(Uslovie6, { u })) + metka, figure };
}

/** Описание листа №6 для buildDocument (lib/sheetList.ts). */
export function sheetSpec6(o: Sborka6, vid: Vid6) {
  return listSheetSpec<ZadachaLite>(
    {
      chip: 'Задание 6',
      cls: 'z6',
      model: o.model,
      zadacha: (id) => o.zadachi.get(id),
      id: (z) => z.id,
      uslovie: (z) => uslovie(o, z),
      otvet: (z) => otvetText6(o.reshit(z).answer),
      razbor: (z) => razborKuski(razbor6Html(o.reshit(z)), 'z6'),
      teoriya: ramkiTeorii,
      primer: (z) => {
        const u = uslovie(o, z);
        return renderToStaticMarkup(
          createElement(
            RamkaPrimer,
            { title: TEORIYA_6_DLYA_PROTOTIPA(z.prototypeId)?.title ?? '', shagi: [] },
            createElement('div', { dangerouslySetInnerHTML: { __html: u.html } }),
            u.figure === null
              ? null
              : createElement('div', {
                  className: 'z6-sheet-primer-ris',
                  dangerouslySetInnerHTML: { __html: u.figure.svg },
                }),
            createElement('div', { dangerouslySetInnerHTML: { __html: razbor6Html(o.reshit(z)) } }),
          ),
        );
      },
    },
    vid,
  );
}
