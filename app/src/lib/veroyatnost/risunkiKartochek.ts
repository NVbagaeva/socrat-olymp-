/**
 * Рисунки карточек по теории №4 и №5 — строкой SVG, на сборке
 * (lib/kartochki/podgotovka). Компоненты теории рисуют React'ом, а
 * карточкам нужна готовая строка: здесь та же геометрия и те же
 * классы, что у диаграмм Эйлера раздела «Как изображать события»
 * (KakIzobrazhatSobytiya.tsx, стили — app/zadaniya/veroyatnost.css),
 * поэтому рисунок на карточке выглядит как в теории.
 *
 * Два вида:
 *   — `eyler` — прямоугольник исходов и круги событий, закрашено
 *     пересечение, объединение, противоположное и т. д.;
 *   — `luchi` — два события-луча над координатной прямой, как в
 *     разделе «Координатная прямая» №5.
 */

export type EylerVid =
  'dostovernoe' | 'protivopolozhnoe' | 'nesovmestnye' | 'peresechenie' | 'obedinenie' | 'vlozhenie';

export interface Luch {
  /** Начало луча на оси. Неравенство строгое: кружок пустой, как в теории №5. */
  ot: number;
  /** Куда смотрит луч: «X > a» — вправо, «X < a» — влево. */
  kuda: 'vpravo' | 'vlevo';
  /** Подпись над лучом: «X > 3» или вероятность. */
  podpis: string;
}

export type RisunokVeroyatnosti =
  | {
      vid: 'eyler';
      /** Что закрашено. Подписаны только A и B: закрашенное называет ученик. */
      zakraska: EylerVid;
      alt: string;
    }
  | {
      vid: 'luchi';
      /** Два луча: первый — цветом A, второй — цветом B. */
      luchi: readonly [Luch, Luch];
      /** Деления оси. */
      deleniya: readonly number[];
      alt: string;
    };

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Геометрия — как у таблицы «Как изображать события». */
const E = { w: 220, h: 124, pole: 6, r: 36, cy: 62 };

function imya(x: number, y: number, bukva: string): string {
  return `<text class="pr-math vizo-eyler__imya" x="${x}" y="${y}" text-anchor="middle"><tspan class="pr-var">${bukva}</tspan></text>`;
}

function krug(cx: number, cy: number, r: number, klass: string, extra = ''): string {
  return `<circle class="vizo-eyler__krug${klass}" cx="${cx}" cy="${cy}" r="${r}"${extra}/>`;
}

function eyler(id: string, vid: EylerVid, alt: string): string {
  const pole = `x="${E.pole}" y="${E.pole}" width="${E.w - 2 * E.pole}" height="${E.h - 2 * E.pole}" rx="8"`;
  const klip = `kart-eyler-${id}`;
  let telo = '';
  switch (vid) {
    case 'dostovernoe':
      telo =
        `<rect class="vizo-eyler__pole is-zakrasheno" ${pole}/>` +
        `<text class="pr-math vizo-eyler__imya vizo-eyler__imya--pryamoy" x="${E.w / 2}" y="${E.cy + 9}" text-anchor="middle">Ω</text>`;
      break;
    case 'protivopolozhnoe':
      /* Закрашено всё, кроме круга A, — это Ā. */
      telo =
        `<rect class="vizo-eyler__pole" ${pole}/>` +
        `<rect class="vizo-eyler__zalivka vizo-eyler__zalivka--b" ${pole}/>` +
        krug(80, E.cy, E.r, ' vizo-eyler__krug--fon') +
        krug(80, E.cy, E.r, '') +
        imya(80, E.cy + 7, 'A');
      break;
    case 'vlozhenie':
      /* A целиком внутри B. */
      telo =
        `<rect class="vizo-eyler__pole" ${pole}/>` +
        krug(110, E.cy, 52, ' vizo-eyler__krug--b') +
        krug(92, E.cy + 6, 24, ' is-zakrasheno') +
        imya(92, E.cy + 13, 'A') +
        imya(144, E.cy - 18, 'B');
      break;
    default: {
      const [l, p] = vid === 'nesovmestnye' ? [62, 158] : [84, 136];
      const zalit = vid !== 'peresechenie';
      telo =
        `<rect class="vizo-eyler__pole" ${pole}/>` +
        (vid === 'peresechenie'
          ? `<clipPath id="${klip}"><circle cx="${l}" cy="${E.cy}" r="${E.r}"/></clipPath>` +
            krug(p, E.cy, E.r, ' is-zakrasheno is-obshchee', ` clip-path="url(#${klip})"`)
          : '') +
        krug(l, E.cy, E.r, zalit ? ' is-zakrasheno' : '') +
        krug(p, E.cy, E.r, ` vizo-eyler__krug--b${zalit ? ' is-zakrasheno' : ''}`) +
        imya(l - (vid === 'nesovmestnye' ? 0 : 16), E.cy + 7, 'A') +
        imya(p + (vid === 'nesovmestnye' ? 0 : 16), E.cy + 7, 'B');
    }
  }
  return (
    `<svg class="vizo-eyler kart-eyler" viewBox="0 0 ${E.w} ${E.h}" width="${E.w}" height="${E.h}" role="img" aria-label="${esc(alt)}">` +
    telo +
    '</svg>'
  );
}

/* Прямая: ось внизу, лучи над ней, у каждого луча — подпись. */
const L = { w: 280, h: 132, levo: 24, pravo: 250, os: 104, ryady: [34, 66] };

function luchi(dva: readonly [Luch, Luch], deleniya: readonly number[], alt: string): string {
  const min = Math.min(...deleniya) - 1;
  /* Справа запас шире: лучу «X > b» нужно место, чтобы читаться лучом. */
  const max = Math.max(...deleniya) + 2;
  const x = (v: number) => L.levo + ((v - min) / (max - min)) * (L.pravo - L.levo - 10);
  let svg = '';
  dva.forEach((luch, i) => {
    const y = L.ryady[i]!;
    const x0 = x(luch.ot);
    const x1 = luch.kuda === 'vpravo' ? L.pravo - 4 : L.levo - 4;
    const ton = i === 0 ? 'a' : 'b';
    const strelka = luch.kuda === 'vpravo' ? `M${x1} ${y} l-7 -4 v8 z` : `M${x1} ${y} l7 -4 v8 z`;
    const tx = (x0 + x1) / 2;
    svg +=
      `<line class="kart-luch__polosa kart-luch--${ton}" x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"/>` +
      `<path class="kart-luch__strelka kart-luch--${ton}" d="${strelka}"/>` +
      `<line class="kart-luch__shtrikh" x1="${x0}" y1="${y}" x2="${x0}" y2="${L.os}"/>` +
      `<circle class="kart-luch__tochka kart-luch--${ton}" cx="${x0}" cy="${y}" r="4"/>` +
      `<text class="pr-math kart-luch__podpis" x="${tx}" y="${y - 9}" text-anchor="middle">${esc(luch.podpis)}</text>`;
  });
  svg +=
    `<line class="kart-luch__os" x1="${L.levo - 8}" y1="${L.os}" x2="${L.pravo + 6}" y2="${L.os}"/>` +
    `<path class="kart-luch__os-strelka" d="M${L.pravo + 12} ${L.os} l-8 -4 v8 z"/>` +
    `<text class="pr-math kart-luch__podpis" x="${L.pravo + 14}" y="${L.os + 22}" text-anchor="end">X</text>`;
  deleniya.forEach((d) => {
    svg +=
      `<line class="kart-luch__os" x1="${x(d)}" y1="${L.os - 4}" x2="${x(d)}" y2="${L.os + 4}"/>` +
      `<text class="kart-luch__chislo" x="${x(d)}" y="${L.os + 22}" text-anchor="middle">${d}</text>`;
  });
  return (
    `<svg class="kart-luchi" viewBox="0 0 ${L.w} ${L.h}" width="${L.w}" height="${L.h}" role="img" aria-label="${esc(alt)}">` +
    svg +
    '</svg>'
  );
}

/** SVG рисунка карточки; `id` карточки — для уникальных id внутри SVG. */
export function risunokVeroyatnosti(id: string, r: RisunokVeroyatnosti): string {
  return r.vid === 'eyler' ? eyler(id, r.zakraska, r.alt) : luchi(r.luchi, r.deleniya, r.alt);
}
