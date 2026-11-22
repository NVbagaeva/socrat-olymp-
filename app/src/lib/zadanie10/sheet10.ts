/**
 * Печатный лист №10 на общем шаблоне lib/sheet: модель листа
 * (sborka.ts) раскладывает общий сборщик lib/sheetList.ts.
 *
 *   Ученик  — условия, у задачи моста — чертёж (lib/zadanie10/chertezh/
 *             most, режим ученика), по выбору — иллюстрации (k=1), строка
 *             «Ответ: ____».
 *   Учитель — ключ и ответы; разбор — чертёж моста с построениями и шаги.
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Abzacy, RamkaFormula, RamkaPrimer, RamkaVazhno } from '@/components/teoriya/Ramki';
import { Tex } from '@/components/ui/Tex';
import { bezSsylok, RAZDELY_TEORII_10 } from '@/content/teoriya10';
import { GEN_UI } from '@/content/generatorUi';
import typo from '@/lib/sheet/typography.js';
import { listSheetSpec, type ListVid } from '@/lib/sheetList';
import { chertezhMosta } from './chertezh/most';
import type { ZadachaLite } from './dannye';
import type { ModelLista } from './sborka';
import type { Prototype } from './types';
import { nomerRazdela } from '@/content/struktura';

export type Vid10 = ListVid;

/** Иллюстрация прототипа: картинки сайта (webp и png). */
export interface Ill10 {
  webp: string;
  png: string;
  alt: string;
  width: number;
  height: number;
}

export interface Sborka10 {
  model: ModelLista;
  zadachi: ReadonlyMap<string, ZadachaLite>;
  proto: (id: string) => Prototype;
  ill: Readonly<Record<string, Ill10>>;
  /** Иллюстрации на листе: у урока или по k=1. */
  kartinki: boolean;
}

/** Ширина чертежа моста на листе, мм. */
const SHIRINA_MM = { most: 84 };

function mostSvg(z: ZadachaLite, rezhim: 'uchenik' | 'uchitel'): string {
  const p = z.params as Record<string, number | string>;
  return chertezhMosta({ a: Number(p.a), b: Number(p.b), c: Number(p.c), x: Number(p.x) }, rezhim)
    .svg;
}

/** Ответ строкой: десятичная запятая. */
export function otvetText10(x: number): string {
  return String(x).replace('.', ',').replace('-', '−');
}

function tex(text: string): string {
  return renderToStaticMarkup(createElement(Tex, { text }));
}

/**
 * Картинка сюжета к условию: справа от текста, компактно — размеры
 * задаёт общий класс «картинка к задаче» (styles/kartinka-zadachi.css
 * на экране, lib/sheet/sheet.css на бумаге), а не файл.
 */
function kartinka(o: Sborka10, z: ZadachaLite): string {
  const ill = o.ill[z.prototypeId];
  if (!o.kartinki || ill === undefined) return '';
  return (
    `<picture class="zadacha-kartinka zadacha-kartinka--sboku z10-list__kartinka">` +
    `<source type="image/webp" srcset="${typo.attr(ill.webp)}">` +
    `<img src="${typo.attr(ill.png)}" alt="${typo.attr(ill.alt)}" width="${ill.width}" height="${ill.height}"></picture>`
  );
}

/** Рамки теории блока: формулы прототипов и «Важно!» разделов теории. */
export function ramkiTeorii10(o: Sborka10, prototipy: readonly string[]): string[] {
  const razdely = RAZDELY_TEORII_10.filter((r) => r.prototipy.some((p) => prototipy.includes(p)));
  const formuly = prototipy.map((id) =>
    renderToStaticMarkup(
      createElement(RamkaFormula, { formula: o.proto(id).formula, podpis: o.proto(id).title }),
    ),
  );
  const vazhno = razdely.flatMap((r) => {
    /* Примеров на листе нет — отсылки «(см. пример …)» убираем. */
    const najden = r.bloki.find((b) => b.vid === 'vazhno');
    const v = najden ? bezSsylok(najden) : undefined;
    return v && v.vid === 'vazhno'
      ? [
          renderToStaticMarkup(
            createElement(
              RamkaVazhno,
              { title: `Важно! ${r.title}` },
              createElement(Abzacy, { paras: v.paras }),
            ),
          ),
        ]
      : [];
  });
  return [...formuly, ...vazhno];
}

/** Условие: текст и картинка сюжета (источник — отдельной пометкой листа учителя); у моста на листе ученика — чертёж. */
export function uslovie10(
  o: Sborka10,
  z: ZadachaLite,
  vid: Vid10,
  /** Разобранный пример — без картинки сюжета, как рамка примера на бумаге. */
  bezKartinki = false,
): { html: string; figure: { svg: string; width: number } | null } {
  const most = z.prototypeId === 'P01' && vid === 'uchenik';
  /* Картинка обтекается текстом — в разметке стоит перед ним. У моста
     на листе ученика справа уже чертёж: вторую картинку не ставим. */
  const ris = bezKartinki || most ? '' : kartinka(o, z);
  return {
    html: `${ris}<p class="z10-list__uslovie">${tex(z.text)}</p>`,
    figure: most ? { svg: mostSvg(z, 'uchenik'), width: SHIRINA_MM.most } : null,
  };
}

/** Разбор учителя кусками: чертёж моста с построениями, затем шаги. */
export function razbor10(o: Sborka10, z: ZadachaLite): string[] {
  const s = o.proto(z.prototypeId).solve(z.params);
  const most =
    z.prototypeId === 'P01'
      ? [
          `<div class="z10-list__most" style="width:${SHIRINA_MM.most}mm">${mostSvg(z, 'uchitel')}</div>`,
        ]
      : [];
  return [
    ...most,
    ...s.etapy.map(
      (e) =>
        `<div class="z10-list__shag"><p class="z10-list__shag-title">${typo.escape(
          e.title,
        )}</p>${e.lines.map((l) => `<p class="z10-list__shag-line">${tex(l)}</p>`).join('')}</div>`,
    ),
  ];
}

/** Разобранный пример: рамка с условием, шагами и чертежом моста. */
export function primer10(o: Sborka10, z: ZadachaLite): string {
  const s = o.proto(z.prototypeId).solve(z.params);
  return renderToStaticMarkup(
    createElement(
      RamkaPrimer,
      {
        title: o.proto(z.prototypeId).title,
        uslovie: z.text,
        shagi: s.etapy.map((e) => ({
          label: e.title.replace(/^Шаг \d+\.\s*/, ''),
          paras: e.lines,
        })),
      },
      z.prototypeId === 'P01'
        ? createElement('div', {
            className: 'z10-list__most',
            dangerouslySetInnerHTML: { __html: mostSvg(z, 'uchitel') },
          })
        : null,
    ),
  );
}

/** Описание листа №10 для buildDocument (lib/sheetList.ts). */
export function sheetSpec10(o: Sborka10, vid: Vid10) {
  return listSheetSpec<ZadachaLite>(
    {
      chip: `Задание ${nomerRazdela('prikladnye-zadachi')}`,
      cls: 'z10',
      model: o.model,
      zadacha: (id) => o.zadachi.get(id),
      id: (z) => z.id,
      uslovie: (z) => uslovie10(o, z, vid),
      otvet: (z) => otvetText10(o.proto(z.prototypeId).solve(z.params).answer),
      istochnik: (zs) =>
        GEN_UI.istochnikStroka(
          zs.flatMap((z, k) => (z.source === 'fipi' ? [k + 1] : [])),
          zs.length,
        ),
      razbor: (z) => razbor10(o, z),
      teoriya: (prototipy) => ramkiTeorii10(o, prototipy),
      primer: (z) => primer10(o, z),
    },
    vid,
  );
}
