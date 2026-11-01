/**
 * Живая схема → готовая строка SVG, без React и без браузера.
 *
 * Тот же рисунок, что у components/skhemy/ChertezhSkhemy.tsx (те же
 * классы skh-*, их оформление — skhemy.css), но неподвижный и
 * фиксированного размера: его рисуют на сборке карточки по теории
 * (lib/kartochki/podgotovka). Ручек перетаскивания и анимации нет.
 */

import { BUKVY } from '../risunki/shrifty.js';
import { ramkaKadra, raskladka, type Sostoyanie } from './ekran';
import type { Tochki, Vid, ZhivayaSkhema } from './tipy';

export interface OpciiSvg {
  W: number;
  H: number;
  /** Подпись для чтения с экрана. */
  opisanie: string;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function cls(...k: (string | false | null | undefined)[]): string {
  return k.filter(Boolean).join(' ');
}

interface Metki {
  lit: boolean;
  dim: boolean;
  cvet: string | null;
}

const metki = (m: Metki) => [m.lit && 'is-lit', m.dim && 'is-dim', m.cvet && `skh-c-${m.cvet}`];

export function svgSkhemy(
  skhema: ZhivayaSkhema,
  t: Tochki,
  vid: Vid,
  sost: Sostoyanie,
  { W, H, opisanie }: OpciiSvg,
): string {
  const kadr = skhema.postroit(t);
  const e = raskladka(kadr, vid, ramkaKadra(kadr, vid, sost), W, H, sost);
  const out: string[] = [];
  out.push(
    `<svg class="skh__svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(opisanie)}">`,
  );
  out.push('<g class="skh__mnog">');
  e.mnog.forEach((m) =>
    out.push(
      `<polygon class="${cls('skh-mnog', m.cvet && `skh-c-${m.cvet}`)}" points="${m.points}"/>`,
    ),
  );
  out.push('</g><g class="skh__okr">');
  e.okr.forEach((o) =>
    out.push(
      `<circle class="${cls('skh-okr', `skh-${o.stil}`, ...metki(o))}" cx="${o.cx}" cy="${o.cy}" r="${o.r}"/>`,
    ),
  );
  out.push('</g><g class="skh__dugi">');
  e.dugi.forEach((d) =>
    out.push(`<path class="${cls('skh-okr', `skh-${d.stil}`, ...metki(d))}" d="${d.d}"/>`),
  );
  out.push('</g><g class="skh__ugly-fon">');
  e.ugly
    .filter((u) => u.sektor !== '')
    .forEach((u) =>
      out.push(`<path class="${cls('skh-sektor', u.cvet && `skh-c-${u.cvet}`)}" d="${u.sektor}"/>`),
    );
  out.push('</g><g class="skh__linii">');
  e.linii.forEach((l) => {
    out.push(`<g class="${cls('skh-liniya', `skh-${l.stil}`, ...metki(l))}">`);
    out.push(`<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}"/>`);
    if (l.shtrihi !== '') out.push(`<path class="skh-shtrih" d="${l.shtrihi}"/>`);
    out.push('</g>');
  });
  out.push('</g><g class="skh__ugly">');
  e.ugly.forEach((u) =>
    out.push(
      `<path class="${cls('skh-ugol', u.pryamoy && 'skh-ugol--pryamoy', ...metki(u))}" d="${u.d}"/>`,
    ),
  );
  out.push('</g><g class="skh__tochki">');
  e.tochki.forEach((p) =>
    out.push(`<circle class="${cls('skh-tochka', ...metki(p))}" cx="${p.x}" cy="${p.y}" r="2.6"/>`),
  );
  out.push('</g><g class="skh__vynoski">');
  e.podpisi
    .filter((p) => p.vynoska !== '')
    .forEach((p) =>
      out.push(
        `<path class="${cls('skh-vynoska', p.cvet && `skh-c-${p.cvet}`)}" d="${p.vynoska}"/>`,
      ),
    );
  out.push(`</g><g class="skh__podpisi" style="font-family:${esc(BUKVY)}">`);
  e.podpisi.forEach((p) => {
    const indeks =
      p.indeks === '' ? '' : `<tspan class="skh-indeks" dy="4">${esc(p.indeks)}</tspan>`;
    out.push(
      `<text class="${cls('skh-podpis', ...metki(p))}" x="${p.x}" y="${p.y}">${esc(p.bukva)}${indeks}</text>`,
    );
  });
  out.push('</g></svg>');
  return out.join('');
}
