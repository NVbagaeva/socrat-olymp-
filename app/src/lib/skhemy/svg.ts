/**
 * Живая схема → готовая строка SVG, без React и без браузера.
 *
 * Тот же рисунок, что у components/skhemy/ChertezhSkhemy.tsx (те же
 * классы skh-*, их оформление — skhemy.css), но неподвижный и
 * фиксированного размера: его рисуют на сборке карточки по теории
 * (lib/kartochki/podgotovka). Ручек перетаскивания и анимации нет.
 */

import { BUKVY } from '../risunki/shrifty.js';
import { ramkaKadra, raskladka, rezhimKadra, type Sostoyanie } from './ekran';
import type { Tochki, Vid, ZhivayaSkhema } from './tipy';

export interface OpciiSvg {
  W: number;
  H: number;
  /** Подпись для чтения с экрана. */
  opisanie: string;
  /**
   * Оформление внутри самого SVG, без skhemy.css: для листов печати
   * (lib/sheet) — там стили страницы схем могут быть не подключены,
   * а без них линии не видны, а круг заливается чёрным.
   */
  samodostatochnyy?: boolean;
}

/* Оформление skhemy.css для неподвижного чертежа — те же толщины,
   цвета — значения токенов (линии --grey-900, a --blue-600,
   b --terracotta, c --teal-700). Селекторы — только внутри .skh-sam.
   Индекс — 70 % буквы (те же 12 px): лист печати подбирает ширину
   чертежа по самому мелкому кеглю в px (lib/sheet/figureRules.js),
   мерилом должна быть буква, а не индекс. */
const STIL_SAM = [
  '.skh-sam{--i:#101728;--k:#1f5fd0}',
  '.skh-sam .skh-c-a{--k:#1f5fd0}.skh-sam .skh-c-b{--k:#e07a2f}.skh-sam .skh-c-c{--k:#0b6f64}',
  '.skh-sam .skh-liniya line,.skh-sam .skh-shtrih{stroke:var(--i);stroke-width:1.75;stroke-linecap:round;fill:none}',
  '.skh-sam .skh-shtrih{stroke-width:1.4}',
  '.skh-sam .skh-punktir line{stroke-dasharray:5 4;stroke-width:1.4}',
  '.skh-sam .skh-prodolzhenie line{stroke-dasharray:2 4;stroke-width:1.4}',
  '.skh-sam .skh-liniya.is-lit line,.skh-sam .skh-liniya.is-lit .skh-shtrih{stroke:var(--k);stroke-width:2.4}',
  '.skh-sam .is-dim{opacity:.32}',
  '.skh-sam .skh-okr{fill:none;stroke:var(--i);stroke-width:1.5}',
  '.skh-sam .skh-okr.skh-punktir{stroke-dasharray:6 5}',
  '.skh-sam .skh-okr.is-lit{stroke:var(--k);stroke-width:1.75}',
  '.skh-sam .skh-mnog{fill:var(--k);fill-opacity:.14;stroke:none}',
  '.skh-sam .skh-sektor{fill:var(--k);fill-opacity:.18;stroke:none}',
  '.skh-sam .skh-ugol{fill:none;stroke:var(--i);stroke-width:1.25;stroke-linecap:round}',
  '.skh-sam .skh-ugol.is-lit{stroke:var(--k);stroke-width:1.75}',
  '.skh-sam .skh-tochka{fill:var(--i);stroke:#fff;stroke-width:1.2}',
  '.skh-sam .skh-tochka.is-lit{fill:var(--k)}',
  '.skh-sam .skh-vynoska{fill:none;stroke:var(--i);stroke-width:.9;stroke-linecap:round;opacity:.6}',
  '.skh-sam .skh-podpis{fill:var(--i);font-size:17px;text-anchor:middle;dominant-baseline:central;paint-order:stroke;stroke:#fff;stroke-width:3;stroke-linejoin:round}',
  '.skh-sam .skh-podpis.is-lit{fill:var(--k)}',
  ".skh-sam .skh-indeks{font-family:KaTeX_Main,'Latin Modern Roman','Times New Roman',serif;font-size:70%}",
].join('');

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
  { W, H, opisanie, samodostatochnyy = false }: OpciiSvg,
): string {
  const kadr = skhema.postroit(t, rezhimKadra(skhema, sost));
  const e = raskladka(kadr, vid, ramkaKadra(kadr, vid, sost), W, H, sost);
  const out: string[] = [];
  out.push(
    `<svg class="${cls('skh__svg', samodostatochnyy && 'skh-sam')}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(opisanie)}">`,
  );
  if (samodostatochnyy) out.push(`<style>${STIL_SAM}</style>`);
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
