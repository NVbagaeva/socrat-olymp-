/**
 * Печатный справочник по планиметрии и шпаргалки к урокам — HTML
 * строкой из тех же карточек теории (content/teoriya1.ts): один
 * источник содержания для вкладки «Теория», PDF-справочника и
 * шпаргалки на листе ученика.
 *
 * Плитка справочника — заголовок, формула и маленький чертёж; без
 * пояснений и примеров: справочник помещается на 2–4 листа A4.
 * Живой чертёж печатается кадром в начальном положении.
 */

import { RAZDELY_TEORII_1, kartochka1, type Fakt1, type Kartochka1 } from '../../content/teoriya1';
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

function plitkaFakta(f: Fakt1): string {
  return `<div class="spr-k spr-k--fakt"><span class="spr-k__pic pl-wrap">${risunok(
    f,
  )}</span><p class="spr-k__t">${f.no}. ${typeset(f.title)}</p>${
    f.formula === undefined
      ? `<p class="spr-k__s">${typeset(f.tekst)}</p>`
      : `<p class="spr-k__f">${formula(f.formula)}</p>`
  }</div>`;
}

/** Весь справочник: разделы по порядку вкладки «Теория», без примеров. */
export function spravochnikHtml(): string {
  return RAZDELY_TEORII_1.map((r, i) => {
    const plitki = [...r.kartochki.map(plitka), ...(r.fakty ?? []).map(plitkaFakta)].join('');
    return `<section class="spr-r"><h2 class="spr-r__t">${i + 1}. ${typeset(
      r.title,
    )}</h2><div class="spr-r__grid">${plitki}</div></section>`;
  }).join('');
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
