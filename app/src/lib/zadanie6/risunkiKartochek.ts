/**
 * Рисунки карточек по теории №6 — строкой SVG, на сборке
 * (lib/kartochki/podgotovka). Теория и тренажёр рисуют диаграмму Эйлера
 * React'ом (components/probability/EilerDiagramma.tsx), а карточкам
 * нужна готовая строка, и react-dom/server в серверной странице Next не
 * разрешает. Здесь та же раскладка (eilerRaskladka.ts) и те же классы
 * (probability.css), поэтому рисунок на карточке выглядит как в теории.
 */

import { EILER, raskladkaEilera } from '@/components/probability/eilerRaskladka';
import type { Ris } from './types';

export type RisEilera = Extract<Ris, { vid: 'eiler' }>;

/** Число из TeX в подпись рисунка: «0{,}05» → «0,05», «-3» → «−3» (как Ris6). */
function chislo(t: string): string {
  return t
    .replace(/\{,\}/g, ',')
    .replace(/\\,/g, ' ')
    .replace(/^-/, '−')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;');
}

/** Диаграмма Эйлера с точками-исходами строкой SVG. */
export function eilerSvg(ris: RisEilera, opyt = 'S'): string {
  const tochki = ris.tochki.map((t) => ({ x: chislo(t.x), ...(t.p ? { p: chislo(t.p) } : {}) }));
  const r = raskladkaEilera(tochki, ris.zerno);
  const alt =
    `Диаграмма Эйлера: опыт ${opyt}, ${tochki.length} элементарных событий; ` +
    tochki.map((t) => (t.p ? `${t.x} (вероятность ${t.p})` : t.x)).join(', ');
  const telo = r.tochki
    .map((t, i) => {
      const dano = tochki[i];
      if (dano === undefined) return '';
      const p =
        t.veroyatnost && dano.p
          ? `<text class="pr-eiler__p" x="${t.veroyatnost.x - t.veroyatnost.halfW + 1}" y="${t.veroyatnost.y + t.veroyatnost.halfH - 1}">${dano.p}</text>`
          : '';
      return (
        `<g class="pr-eiler__tochka"><circle cx="${t.cx}" cy="${t.cy}" r="${EILER.r}"/>` +
        `<text class="pr-eiler__x" x="${t.znachenie.x}" y="${t.znachenie.y + t.znachenie.halfH - 1}" text-anchor="middle">${dano.x}</text>${p}</g>`
      );
    })
    .join('');
  return (
    `<figure class="z6-ris z6-ris--eiler"><svg data-engine="veroyatnost" class="pr-eiler pr-is-default" viewBox="0 0 ${r.w} ${r.h}" width="${r.w}" height="${r.h}" role="img" aria-label="${alt}">` +
    `<rect class="pr-eiler__opyt" x="${EILER.pole}" y="${EILER.pole}" width="${r.w - 2 * EILER.pole}" height="${r.h - 2 * EILER.pole}" rx="3"/>` +
    `<text class="pr-math pr-eiler__s" x="${r.s.x}" y="${r.s.y + r.s.halfH - 2}" text-anchor="middle">${opyt}</text>` +
    `${telo}</svg></figure>`
  );
}
