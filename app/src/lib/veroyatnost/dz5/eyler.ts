/**
 * Диаграмма Эйлера с точками — элементарными событиями — для задачи
 * «найдите условную вероятность по диаграмме».
 *
 * Возвращает готовую строку SVG: её вставляют и страница (через
 * dangerouslySetInnerHTML), и печатный лист. Цвета — как у диаграмм
 * теории (veroyatnost.css, .vizo-eyler): A — основной синий, B —
 * терракотовый акцент, заливка с прозрачностью 0,18. На листе
 * переменных сайта нет, поэтому у каждой переменной свой запасной цвет.
 *
 * Точки раскладываются случайно, но по seed: один и тот же вариант
 * всегда рисуется одинаково. Расстояние между точками и до границ
 * областей — с запасом, чтобы на печати точку нельзя было отнести не
 * к той области.
 */

import type { Rng } from './tipy';

export interface EylerChisla {
  /** Только в A. */
  a: number;
  /** В A и B. */
  ab: number;
  /** Только в B. */
  b: number;
  /** Вне A и B. */
  vne: number;
}

const W = 340;
const H = 200;
const RAMKA = 8;
const R_TOCHKI = 4.5;
const MIN_RASST = 21;

const SINIY = 'var(--color-primary, #1f5fd0)';
const AKTSENT = 'var(--color-accent, #e07a2f)';
const TEKST = 'var(--color-text, #101728)';
const RAMKA_TSVET = 'var(--color-border-strong, #cfdae8)';

interface Ellips {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** Нормированное «расстояние» до центра эллипса: 1 — на границе. */
function vnutri(e: Ellips, x: number, y: number): number {
  return ((x - e.cx) / e.rx) ** 2 + ((y - e.cy) / e.ry) ** 2;
}

type Oblast = 'a' | 'ab' | 'b' | 'vne';

function oblast(A: Ellips, B: Ellips, x: number, y: number): Oblast | null {
  const da = vnutri(A, x, y);
  const db = vnutri(B, x, y);
  /* Полоса у границы — ничья: туда точки не ставятся. */
  const blizko = (v: number) => v > 0.72 && v < 1.3;
  if (blizko(da) || blizko(db)) {
    return null;
  }
  const inA = da < 1;
  const inB = db < 1;
  if (inA && inB) return 'ab';
  if (inA) return 'a';
  if (inB) return 'b';
  return 'vne';
}

/**
 * Рисунок по числам точек в областях. null — точки не уместились
 * (такое бывает при слишком узкой общей части); шаблон тогда берёт
 * другие параметры.
 */
export function eylerSvg(chisla: EylerChisla, r: Rng, opisanie: string): string | null {
  /* Расположение кругов тоже меняется от варианта к варианту: шире
     или уже общая часть, A слева или справа. */
  const nalozhenie = 0.55 + r.next() * 0.25;
  const rx = 82 + r.int(0, 12);
  const ry = 58 + r.int(0, 10);
  const d = rx * 2 * (1 - nalozhenie / 2) * 0.62;
  const cy = H / 2 + r.int(-6, 6);
  const levyy: Ellips = { cx: W / 2 - d / 2, cy, rx, ry };
  const pravyy: Ellips = { cx: W / 2 + d / 2, cy, rx, ry };
  const aSleva = r.next() < 0.6;
  const A = aSleva ? levyy : pravyy;
  const B = aSleva ? pravyy : levyy;

  const nado: Record<Oblast, number> = { a: chisla.a, ab: chisla.ab, b: chisla.b, vne: chisla.vne };
  const tochki: { x: number; y: number }[] = [];
  for (const o of ['ab', 'a', 'b', 'vne'] as const) {
    let ostalos = nado[o];
    let popytok = 0;
    while (ostalos > 0) {
      popytok += 1;
      if (popytok > 4000) {
        return null;
      }
      const x = RAMKA + 12 + r.next() * (W - 2 * RAMKA - 24);
      const y = RAMKA + 12 + r.next() * (H - 2 * RAMKA - 24);
      if (oblast(A, B, x, y) !== o) {
        continue;
      }
      /* Подписи A и B не закрываются точками. */
      if (Math.hypot(x - podpis(A).x, y - podpis(A).y) < 18) continue;
      if (Math.hypot(x - podpis(B).x, y - podpis(B).y) < 18) continue;
      if (tochki.some((t) => Math.hypot(t.x - x, t.y - y) < MIN_RASST)) {
        continue;
      }
      tochki.push({ x, y });
      ostalos -= 1;
    }
  }

  const f = (n: number) => String(Math.round(n * 10) / 10);
  const ellips = (e: Ellips, tsvet: string, extra = '') =>
    `<ellipse cx="${f(e.cx)}" cy="${f(e.cy)}" rx="${f(e.rx)}" ry="${f(e.ry)}"${extra}` +
    ` fill="${tsvet}" fill-opacity="0.18" stroke="${tsvet}" stroke-width="2"/>`;
  const pa = podpis(A);
  const pb = podpis(B);
  const bukva = (p: { x: number; y: number }, t: string) =>
    `<text x="${f(p.x)}" y="${f(p.y + 7)}" text-anchor="middle" font-size="20" font-style="italic"` +
    ` font-family="KaTeX_Math, 'Times New Roman', serif" fill="${TEKST}">${t}</text>`;

  return (
    `<svg class="dz5-eyler" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img"` +
    ` aria-label="${opisanie}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="${RAMKA}" y="${RAMKA}" width="${W - 2 * RAMKA}" height="${H - 2 * RAMKA}" rx="8"` +
    ` fill="var(--color-surface, #ffffff)" stroke="${RAMKA_TSVET}" stroke-width="1.5"/>` +
    ellips(A, SINIY) +
    ellips(B, AKTSENT) +
    bukva(pa, 'A') +
    bukva(pb, 'B') +
    tochki
      .map((t) => `<circle cx="${f(t.x)}" cy="${f(t.y)}" r="${R_TOCHKI}" fill="${TEKST}"/>`)
      .join('') +
    `</svg>`
  );
}

/** Место подписи: у внешнего края эллипса, внутри него. */
function podpis(e: Ellips): { x: number; y: number } {
  const sleva = e.cx < W / 2;
  return { x: e.cx + (sleva ? -0.72 : 0.72) * e.rx, y: e.cy - 0.05 * e.ry };
}
