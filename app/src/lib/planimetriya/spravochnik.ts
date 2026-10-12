/**
 * Шпаргалки к урокам задания №1 — плитка карточек прежней теории
 * (content/teoriya1.ts) HTML строкой: на отдельной странице
 * шпаргалки и на листе ученика. Плитка — заголовок, формула и
 * маленький чертёж. Живой чертёж печатается кадром в начальном
 * положении. Справочник по планиметрии для печати собирается
 * из своих данных — lib/planimetriya/spravochnik-pdf.ts.
 */

import { kartochka1, type Kartochka1 } from '../../content/teoriya1';
import { katex } from '../graph/katex';
import { typeset } from '../tex';
import { renderPlan } from './render';
import { risunokTeorii } from './teoriya';
import { zhivaya } from './zhivye';

const RAZMER = { shirina: 120, vysota: 84 };

function formula(tex: string): string {
  return katex.renderToString(tex, { throwOnError: true, displayMode: false });
}

function risunok(k: { risunok?: string; zhivoy?: string }): string {
  if (k.zhivoy !== undefined) {
    const z = zhivaya(k.zhivoy);
    return renderPlan(z.scena(z.nachalo), { chisla: true, ...RAZMER });
  }
  if (k.risunok === undefined) return '';
  const r = risunokTeorii(k.risunok);
  return renderPlan(r.scena, { ...r.optsii, ...RAZMER });
}

function plitka(k: Kartochka1): string {
  const pic = risunok(k);
  const tablica =
    k.tablica === undefined
      ? ''
      : `<table class="spr-tab">${[k.tablica.head, ...k.tablica.rows]
          .map((r) => `<tr>${r.map((c) => `<td>${typeset(c)}</td>`).join('')}</tr>`)
          .join('')}</table>`;
  return `<div class="spr-k">${
    pic === '' ? '' : `<span class="spr-k__pic pl-wrap">${pic}</span>`
  }<p class="spr-k__t">${typeset(k.title)}</p>${
    k.formula === undefined ? '' : `<p class="spr-k__f">${formula(k.formula)}</p>`
  }${tablica}</div>`;
}

/** Плитка карточек справочника без заголовка — шпаргалка на листе урока. */
export function plitkiHtml(kartochki: readonly string[]): string {
  return `<div class="spr-r spr-r--shp"><div class="spr-r__grid">${kartochki
    .map((id) => plitka(kartochka1(id)))
    .join('')}</div></div>`;
}

/** Шпаргалка к уроку: карточки урока плиткой справочника. */
export function shpargalkaHtml(kartochki: readonly string[], zagolovok: string): string {
  return `<section class="spr-r spr-r--shp"><h2 class="spr-r__t">${typeset(
    zagolovok,
  )}</h2><div class="spr-r__grid">${kartochki
    .map((id) => plitka(kartochka1(id)))
    .join('')}</div></section>`;
}
