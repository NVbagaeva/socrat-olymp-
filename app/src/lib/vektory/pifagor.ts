/**
 * Длина вектора через теорему Пифагора: рисунок и пояснения для шага
 * «Длина по формуле» задания №2.
 *
 * Всё строится из чисел конкретного примера: вектор из начала
 * координат в точку (x; y), пунктирные проекции на оси, прямоугольный
 * треугольник с катетами |x| и |y| и гипотенузой — длиной вектора.
 * Масштаб подбирается под числа, четверть — по знакам координат.
 * Цвета — токены сайта через THEME, поэтому рисунок живёт и в светлой,
 * и в тёмной теме.
 */

import { THEME, esc } from '@/lib/graph/renderer.js';
import { BUKVY, CHISLA } from '@/lib/risunki/shrifty.js';
import { ru } from '../vychisleniya/numbers';
import type { Tochka } from './types';

/* ── Пифагоровы тройки ─────────────────────────────────────────── */

const TROYKI: readonly (readonly [number, number, number])[] = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
];

export interface Troyka {
  /** Тройка a-b-c (a < b). */
  troyka: readonly [number, number, number];
  /** Во сколько раз увеличена: |x| = k·p, |y| = k·q. */
  k: number;
  /** Множители при k по порядку координат: p для |x|, q для |y|. */
  p: number;
  q: number;
}

const blizko = (u: number, v: number) => Math.abs(u - v) < 1e-9;

/**
 * Модули координат пропорциональны пифагоровой тройке с множителем k —
 * целым или с одним знаком после запятой. Иначе null.
 */
export function naytiTroyku(x: number, y: number): Troyka | null {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  if (ax === 0 || ay === 0) return null;
  for (const t of TROYKI) {
    const [a, b] = t;
    for (const [p, q] of [
      [a, b],
      [b, a],
    ] as const) {
      const k = ax / p;
      if (!blizko(k * q, ay)) continue;
      if (!blizko(Math.round(k * 10), k * 10)) continue;
      return { troyka: t, k: Math.round(k * 10) / 10, p, q };
    }
  }
  return null;
}

/* ── Рисунок ───────────────────────────────────────────────────── */

const W = 300;
const POLE = { left: 44, right: 44, top: 36, bottom: 36 };
const MAX_DX = W - POLE.left - POLE.right;
const MAX_DY = 140;
const MIN_LEG = 10;

const f = (v: number) => String(Math.round(v * 10) / 10);
const minus = (v: number) => ru(v).replace('-', '−');

/** Примерная ширина строки цифр: для размещения подписей. */
function shirina(text: string, size: number): number {
  return text.length * size * 0.55;
}

/**
 * SVG: вектор `name` из начала координат в (x; y) и треугольник
 * Пифагора. Ширина viewBox — 300, по ширине карточки сжимается сам.
 */
export function risunokPifagora(name: string, p: Tochka, dlinaValue: number): string {
  const [x, y] = p;
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const s = Math.min(MAX_DX / ax, MAX_DY / ay);
  /* Короткий катет не схлопывается в точку: не меньше MIN_LEG пикселей. */
  const dx = Math.max(ax * s, MIN_LEG);
  const dy = Math.max(ay * s, MIN_LEG);
  const H = POLE.top + dy + POLE.bottom;
  /* Начало координат и конец вектора — по четверти. */
  const ox = x > 0 ? POLE.left + (MAX_DX - dx) / 2 : POLE.left + (MAX_DX + dx) / 2;
  const tx = x > 0 ? ox + dx : ox - dx;
  const oy = y > 0 ? POLE.top + dy : POLE.top;
  const ty = y > 0 ? oy - dy : oy + dy;
  /* Основание вертикального катета — проекция конца на ось x. */
  const fx = tx;
  const fy = oy;

  const C = THEME.colors;
  const out: string[] = [];
  const alt = `Вектор ${name} из начала координат в точку (${minus(x)}; ${minus(y)}): катеты ${ru(ax)} и ${ru(ay)}, гипотенуза — длина ${ru(dlinaValue)}`;
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${f(H)}" width="${W}" height="${f(H)}" class="vp vp-pifagor" role="img" aria-label="${esc(alt)}" style="max-width:100%;height:auto">`,
    `<title>${esc(alt)}</title>`,
    `<rect x="0" y="0" width="${W}" height="${f(H)}" fill="${C.bg}"/>`,
  );

  /* Оси со стрелками. */
  const ar = 8;
  out.push(
    `<path d="M8 ${f(oy)}H${W - 8}M${f(ox)} ${f(H - 6)}V6" fill="none" stroke="${C.axis}" stroke-width="${THEME.width.axis}"/>`,
    `<path d="M${W - 6} ${f(oy)}l${-ar * 1.6} ${-ar / 2}v${ar}z" fill="${C.axis}"/>`,
    `<path d="M${f(ox)} 4l${-ar / 2} ${ar * 1.6}h${ar}z" fill="${C.axis}"/>`,
  );
  const osSize = THEME.font.axisName;
  out.push(
    `<text x="${W - 12}" y="${f(oy + (y > 0 ? -8 : 20))}" text-anchor="end" font-family="${BUKVY}" font-style="italic" font-size="${osSize}" fill="${C.label}">x</text>`,
    `<text x="${f(ox + (x > 0 ? -10 : 10))}" y="18" text-anchor="${x > 0 ? 'end' : 'start'}" font-family="${BUKVY}" font-style="italic" font-size="${osSize}" fill="${C.label}">y</text>`,
    `<text x="${f(ox + (x > 0 ? -7 : 7))}" y="${f(oy + (y > 0 ? 18 : -7))}" text-anchor="${x > 0 ? 'end' : 'start'}" font-family="${CHISLA}" font-size="15" fill="${C.label}">0</text>`,
  );

  /* Проекции конца на оси — пунктир, вместе с осями дают прямоугольник. */
  out.push(
    `<path d="M${f(tx)} ${f(ty)}H${f(ox)}" fill="none" stroke="${C.axis}" stroke-width="1.4" stroke-dasharray="5 4" opacity="0.7"/>`,
  );
  /* Катеты треугольника: по оси x — сплошной, вертикальный — пунктир. */
  out.push(
    `<path d="M${f(ox)} ${f(oy)}H${f(fx)}" fill="none" stroke="${C.accent}" stroke-width="3.2" stroke-linecap="round"/>`,
    `<path d="M${f(fx)} ${f(fy)}V${f(ty)}" fill="none" stroke="${C.accent}" stroke-width="${THEME.width.helper + 0.6}" stroke-dasharray="6 5"/>`,
  );
  /* Прямой угол в основании. */
  const q = Math.min(11, dx / 3, dy / 3);
  const qx = x > 0 ? -q : q;
  const qy = y > 0 ? -q : q;
  out.push(
    `<path d="M${f(fx + qx)} ${f(fy)}V${f(fy + qy)}H${f(fx)}" fill="none" stroke="${C.accent}" stroke-width="${THEME.width.helperMark}"/>`,
  );

  /* Вектор: стержень и наконечник. */
  const len = Math.hypot(tx - ox, ty - oy);
  const ux = (tx - ox) / len;
  const uy = (ty - oy) / len;
  const hl = 15;
  const hw = 4.5;
  const bx = tx - ux * hl;
  const by = ty - uy * hl;
  out.push(
    `<path d="M${f(ox)} ${f(oy)}L${f(bx + ux * 0.5)} ${f(by + uy * 0.5)}" stroke="${C.lineA}" stroke-width="${THEME.width.curve}" fill="none"/>`,
    `<path d="M${f(tx)} ${f(ty)}L${f(bx - uy * hw)} ${f(by + ux * hw)}L${f(bx + uy * hw)} ${f(by - ux * hw)}z" fill="${C.lineA}"/>`,
  );

  /* Подписи катетов — модули координат, цветом катетов. */
  const legSize = 17;
  const legX = ru(ax);
  const legY = ru(ay);
  /* |x| — под осью, если треугольник над ней, и над осью иначе. */
  out.push(
    `<text x="${f((ox + fx) / 2)}" y="${f(oy + (y > 0 ? 20 : -9))}" text-anchor="middle" font-family="${CHISLA}" font-size="${legSize}" font-weight="700" fill="${C.accent}">${legX}</text>`,
  );
  /* |y| — снаружи треугольника, по другую сторону от начала координат. */
  out.push(
    `<text x="${f(fx + (x > 0 ? 8 : -8))}" y="${f((fy + ty) / 2 + 6)}" text-anchor="${x > 0 ? 'start' : 'end'}" font-family="${CHISLA}" font-size="${legSize}" font-weight="700" fill="${C.accent}">${legY}</text>`,
  );

  /* Подпись конца: координаты точки, снаружи по вертикали. */
  const tochka = `(${minus(x)}; ${minus(y)})`;
  const tSize = 15;
  const tw = shirina(tochka, tSize);
  const tlx = Math.min(Math.max(tx - tw / 2, 4), W - 4 - tw);
  out.push(
    `<text x="${f(tlx)}" y="${f(ty + (y > 0 ? -12 : 24))}" font-family="${CHISLA}" font-size="${tSize}" fill="${C.label}">${tochka}</text>`,
  );

  /* Гипотенуза: |name| у середины вектора, со стороны, где нет треугольника. */
  const mx = (ox + tx) / 2;
  const my = (oy + ty) / 2;
  /* Нормаль к вектору — к прямому углу треугольника; подпись — с другой стороны. */
  let nx = -uy;
  let ny = ux;
  if (nx * (fx - mx) + ny * (fy - my) > 0) {
    nx = -nx;
    ny = -ny;
  }
  const hSize = 19;
  const hw2 = hSize * 1.05;
  const hh = hSize * 0.9;
  const off = 8 + Math.abs(nx) * (hw2 / 2) + Math.abs(ny) * (hh / 2);
  const cx = mx + nx * off;
  const cy = my + ny * off;
  const baseY = cy + hSize * 0.33;
  /* «|», буква курсивом, «|»; стрелка над буквой — отдельным путём. */
  const bar = hSize * 0.28;
  const letter = hSize * 0.5;
  const x0 = cx - (bar * 2 + letter) / 2;
  const lx = x0 + bar;
  const ay0 = baseY - hSize * 0.78;
  out.push(
    `<text x="${f(x0)}" y="${f(baseY)}" font-family="${CHISLA}" font-size="${hSize}" fill="${C.lineA}">|</text>`,
    `<text x="${f(lx)}" y="${f(baseY)}" font-family="${BUKVY}" font-style="italic" font-weight="700" font-size="${hSize}" fill="${C.lineA}">${esc(name)}</text>`,
    `<text x="${f(lx + letter)}" y="${f(baseY)}" font-family="${CHISLA}" font-size="${hSize}" fill="${C.lineA}">|</text>`,
    `<path d="M${f(lx + 1)} ${f(ay0)}H${f(lx + letter + 1)}m-3 -2.5l3 2.5l-3 2.5" fill="none" stroke="${C.lineA}" stroke-width="1.3"/>`,
  );

  out.push('</svg>');
  return out.join('');
}
