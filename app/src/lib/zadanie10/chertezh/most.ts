/**
 * Чертёж висячего моста для прототипа П-01 — в стиле движка графиков.
 *
 * Цепь — парабола конкретной задачи $y=ax^2+bx+c$ между пилонами
 * ($x=0$ и $x=L$, где $L=-\frac{b}{a}$ — там цепь снова на высоте $c$),
 * ванты — вертикально с равным шагом 10 м, полотно — ось $Ox$ ($y=0$),
 * под ним стилизованная вода. Ось $Oy$ идёт вдоль левого пилона, 0 — у
 * его основания (на уровне полотна).
 *
 * Перо, цвета, толщины, шрифт и белое гало под подписями — из THEME
 * движка графиков (lib/graph/renderer.js), как у чертежей векторов.
 * Подписи «цепь», «ванта», «пилон», «полотно моста» стоят с выносками;
 * место для каждой подбирается перебором: рамка подписи не касается ни
 * одной линии чертежа и других подписей (отчёт `report` — для
 * автотеста).
 *
 * Режимы:
 *   uchenik — лист ученика, условие на сайте: ванта из условия ничем не
 *             выделена, её длина не подписана;
 *   uchitel — лист учителя, разбор: ванта выделена акцентным цветом и
 *             толще остальных (в ч/б печати различима по толщине),
 *             рядом подписана длина, на оси — расстояние от пилона.
 */

import { esc, px, svgText, textWidth, THEME } from '../../graph/renderer.js';
import { d } from '../../zadanie11/num';

export type RezhimMosta = 'uchenik' | 'uchitel';

export interface ParamsMosta {
  a: number;
  b: number;
  c: number;
  /** Расстояние от пилона до ванты из условия. */
  x: number;
}

export interface Ramka {
  id: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OtchetMosta {
  /** Рамки подписей. */
  podpisi: Ramka[];
  /** Наложения: подпись на линию или на подпись — должно быть пусто. */
  nalozheniya: string[];
  /** Число вант. */
  vant: number;
}

const W = 640;
const H = 380;
const POLE = { left: 46, right: 74, top: 34, bottom: 78 };
const SHAG_VANT = 10;
const KEGL = 14;
const ZAZOR = 4;

interface Otrezok {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Пересекает ли отрезок прямоугольник (с запасом). */
function otrezokVRamke(s: Otrezok, r: Ramka, zapas: number): boolean {
  const x0 = r.x0 - zapas;
  const x1 = r.x1 + zapas;
  const y0 = r.y0 - zapas;
  const y1 = r.y1 + zapas;
  /* Отрезок короткий по сравнению с подписью — проверяем точками. */
  const n = Math.max(2, Math.ceil(Math.hypot(s.x1 - s.x0, s.y1 - s.y0) / 2));
  for (let i = 0; i <= n; i += 1) {
    const x = s.x0 + ((s.x1 - s.x0) * i) / n;
    const y = s.y0 + ((s.y1 - s.y0) * i) / n;
    if (x >= x0 && x <= x1 && y >= y0 && y <= y1) {
      return true;
    }
  }
  return false;
}

function ramkiPeresekayutsya(a: Ramka, b: Ramka, zapas: number): boolean {
  return !(
    a.x1 + zapas < b.x0 ||
    b.x1 + zapas < a.x0 ||
    a.y1 + zapas < b.y0 ||
    b.y1 + zapas < a.y0
  );
}

/** Точка на краю рамки, ближайшая к якорю (начало выноски). */
function kraiRamki(r: Ramka, ax: number, ay: number): [number, number] {
  return [Math.max(r.x0, Math.min(r.x1, ax)), Math.max(r.y0, Math.min(r.y1, ay))];
}

export interface Chertezh {
  svg: string;
  report: OtchetMosta;
}

export function chertezhMosta(p: ParamsMosta, rezhim: RezhimMosta, title?: string): Chertezh {
  const { a, b, c, x: xVanty } = p;
  const L = -b / a;
  const y = (x: number) => a * x * x + b * x + c;
  const yMin = y(L / 2);
  const verh = c * 1.32;
  const glubina = c * 0.32;

  /* Масштабы: по горизонтали — вся длина моста, по вертикали — от дна
     воды до верха пилонов (вертикаль растянута, как на схемах банка). */
  const sx = (W - POLE.left - POLE.right) / L;
  const sy = (H - POLE.top - POLE.bottom) / (verh + glubina);
  const X = (x: number) => POLE.left + x * sx;
  const Y = (v: number) => POLE.top + (verh - v) * sy;

  const C = THEME.colors;
  const Wd = THEME.width;
  const linii: Otrezok[] = [];
  const parts: string[] = [];
  const line = (s: Otrezok, stroke: string, width: number, extra = '') => {
    linii.push(s);
    parts.push(
      `<line x1="${px(s.x0)}" y1="${px(s.y0)}" x2="${px(s.x1)}" y2="${px(s.y1)}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"${extra}/>`,
    );
  };

  /* ── Вода: стилизованные волны под полотном ── */
  const vodaVerh = Y(0) + 10;
  const vodaNiz = Y(-glubina) - 4;
  parts.push(
    `<rect class="z10-most__voda" x="${px(X(0))}" y="${px(vodaVerh)}" width="${px(X(L) - X(0))}" height="${px(vodaNiz - vodaVerh)}" fill="var(--color-surface-soft, #E6EFFC)"/>`,
  );
  for (let k = 0; k < 3; k += 1) {
    const yy = vodaVerh + ((k + 1) * (vodaNiz - vodaVerh)) / 4;
    const tochki: string[] = [];
    const shag = 6;
    let prev: [number, number] | null = null;
    for (let xx = X(0) + 14; xx <= X(L) - 14; xx += shag) {
      const yv = yy + 3 * Math.sin((xx - X(0)) / 9 + k);
      tochki.push(`${px(xx)},${px(yv)}`);
      if (prev) {
        linii.push({ x0: prev[0], y0: prev[1], x1: xx, y1: yv });
      }
      prev = [xx, yv];
    }
    parts.push(
      `<polyline points="${tochki.join(' ')}" fill="none" stroke="var(--color-primary, #1F5FD0)" stroke-opacity="0.45" stroke-width="1.2"/>`,
    );
  }

  /* ── Пилоны (со своими опорами в воде) ── */
  const shirinaPilona = 7;
  for (const xp of [0, L]) {
    const xx = X(xp);
    parts.push(
      `<rect x="${px(xx - shirinaPilona / 2)}" y="${px(Y(verh))}" width="${shirinaPilona}" height="${px(Y(-glubina) - Y(verh))}" fill="var(--color-surface, #FFFFFF)" stroke="${C.axis}" stroke-width="${Wd.helper}"/>`,
    );
    linii.push(
      { x0: xx - shirinaPilona / 2, y0: Y(verh), x1: xx - shirinaPilona / 2, y1: Y(-glubina) },
      { x0: xx + shirinaPilona / 2, y0: Y(verh), x1: xx + shirinaPilona / 2, y1: Y(-glubina) },
      { x0: xx - shirinaPilona / 2, y0: Y(verh), x1: xx + shirinaPilona / 2, y1: Y(verh) },
    );
  }

  /* ── Полотно моста = ось Ox ── */
  line({ x0: X(0), y0: Y(0), x1: X(L), y1: Y(0) }, C.axis, Wd.axis + 1.4);

  /* ── Ванты ── */
  const vanty: number[] = [];
  for (let xv = SHAG_VANT; xv < L - 1e-6; xv += SHAG_VANT) {
    vanty.push(xv);
  }
  const nuzhnaya = vanty.find((xv) => Math.abs(xv - xVanty) < 1e-9);
  if (nuzhnaya === undefined) {
    throw new Error(`мост: ванта x=${xVanty} не попадает в шаг ${SHAG_VANT} м`);
  }
  for (const xv of vanty) {
    const vydelit = rezhim === 'uchitel' && xv === nuzhnaya;
    line(
      { x0: X(xv), y0: Y(0), x1: X(xv), y1: Y(y(xv)) },
      vydelit ? C.accent : C.lineA,
      vydelit ? Wd.curve + 0.6 : 1.4,
      vydelit ? ' class="z10-most__vanta-iskomaya"' : '',
    );
  }

  /* ── Цепь: парабола задачи ── */
  const cep: string[] = [];
  const N = 120;
  let pr: [number, number] | null = null;
  for (let i = 0; i <= N; i += 1) {
    const xx = (L * i) / N;
    const pt: [number, number] = [X(xx), Y(y(xx))];
    cep.push(`${px(pt[0])},${px(pt[1])}`);
    if (pr) {
      linii.push({ x0: pr[0], y0: pr[1], x1: pt[0], y1: pt[1] });
    }
    pr = pt;
  }
  parts.push(
    `<polyline points="${cep.join(' ')}" fill="none" stroke="${C.lineA}" stroke-width="${Wd.curve}" stroke-linejoin="round"/>`,
  );
  /* Узлы крепления вант к цепи. */
  for (const xv of vanty) {
    parts.push(`<circle cx="${px(X(xv))}" cy="${px(Y(y(xv)))}" r="2.6" fill="${C.lineA}"/>`);
  }

  /* ── Оси: Oy вдоль левого пилона, Ox вдоль полотна ── */
  const strelka = (x1: number, y1: number, dx: number, dy: number) => {
    const al = THEME.geometry.arrowLen;
    const ah = THEME.geometry.arrowHalf;
    const nx = -dy;
    const ny = dx;
    return `<path d="M${px(x1)},${px(y1)} L${px(x1 - dx * al + nx * ah)},${px(y1 - dy * al + ny * ah)} L${px(x1 - dx * al - nx * ah)},${px(y1 - dy * al - ny * ah)} Z" fill="${C.axis}"/>`;
  };
  const yTop = Y(verh) - 22;
  line({ x0: X(0), y0: Y(0), x1: X(0), y1: yTop }, C.axis, Wd.axis);
  parts.push(strelka(X(0), yTop, 0, -1));
  const xRight = X(L) + 34;
  line({ x0: X(L), y0: Y(0), x1: xRight, y1: Y(0) }, C.axis, Wd.axis);
  parts.push(strelka(xRight, Y(0), 1, 0));

  const ramki: Ramka[] = [];
  const nalozheniya: string[] = [];
  const podpisi: string[] = [];

  /* Подпись без выноски в заданном месте (имена осей, 0). */
  const fiks = (id: string, text: string, cx: number, cy: number, italic: boolean) => {
    const w = textWidth(text, THEME.font.axisName);
    const r: Ramka = { id, x0: cx - w / 2, y0: cy - 12, x1: cx + w / 2, y1: cy + 4 };
    ramki.push(r);
    podpisi.push(
      svgText(text, cx, cy, 'middle', {
        size: THEME.font.axisName,
        style: italic ? 'italic' : 'normal',
      }),
    );
  };
  fiks('os-y', 'y', X(0) - 14, yTop + 6, true);
  fiks('os-x', 'x', xRight - 2, Y(0) + 22, true);
  fiks('nachalo', '0', X(0) - 14, Y(0) + 18, true);

  /**
   * Подпись с выноской: перебираем центры рамки на сетке шагом 4 px,
   * берём ближайший к якорю, где рамка не задевает ни линий, ни других
   * подписей и целиком внутри холста.
   */
  const svynoskoy = (
    id: string,
    text: string,
    ax: number,
    ay: number,
    fill?: string,
    kegl = KEGL,
    zona: (cy: number) => boolean = () => true,
  ) => {
    const w = textWidth(text, kegl) + 6;
    const h = kegl + 4;
    let best: { r: Ramka; dist: number } | null = null;
    for (let cy = h / 2 + 2; cy <= H - h / 2 - 2; cy += 4) {
      for (let cx = w / 2 + 2; cx <= W - w / 2 - 2; cx += 4) {
        const r: Ramka = { id, x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 };
        const dist = Math.hypot(cx - ax, cy - ay);
        if (best && dist >= best.dist) {
          continue;
        }
        if (dist < h || !zona(cy)) {
          continue;
        }
        if (ramki.some((o) => ramkiPeresekayutsya(o, r, ZAZOR))) {
          continue;
        }
        if (linii.some((s) => otrezokVRamke(s, r, ZAZOR))) {
          continue;
        }
        best = { r, dist };
      }
    }
    if (best === null) {
      nalozheniya.push(`нет места для подписи «${text}»`);
      return;
    }
    const r = best.r;
    ramki.push(r);
    const [lx, ly] = kraiRamki(r, ax, ay);
    podpisi.push(
      `<line x1="${px(lx)}" y1="${px(ly)}" x2="${px(ax)}" y2="${px(ay)}" stroke="${C.label}" stroke-width="1" class="z10-most__vynoska"/>`,
      `<circle cx="${px(ax)}" cy="${px(ay)}" r="2" fill="${C.label}"/>`,
      svgText(text, (r.x0 + r.x1) / 2, r.y1 - 4, 'middle', {
        size: kegl,
        ...(fill ? { fill } : {}),
        weight: 600,
      }),
    );
  };

  /* Ванта для подписи «ванта»: первая слева, не та, что в условии. */
  const vPodpis =
    vanty.find((xv) => xv !== nuzhnaya && y(xv) > yMin * 1.3) ?? vanty[0] ?? SHAG_VANT;
  const xCep = L * 0.78;
  svynoskoy('пилон', 'пилон', X(L) + shirinaPilona / 2, Y(verh * 0.55));
  svynoskoy('цепь', 'цепь', X(xCep), Y(y(xCep)));
  svynoskoy('ванта', 'ванта', X(vPodpis), Y(y(vPodpis) * 0.6));
  svynoskoy(
    'полотно моста',
    'полотно моста',
    X(L * 0.42),
    Y(0),
    undefined,
    KEGL,
    (cy) => cy > Y(0),
  );
  if (rezhim === 'uchitel') {
    const dlina = y(xVanty);
    svynoskoy(
      'длина',
      `${d(dlina).replace('{,}', ',')} м`,
      X(xVanty),
      Y(dlina / 2),
      C.accent,
      15,
      (cy) => cy < Y(0),
    );
    svynoskoy(
      'расстояние',
      `x = ${String(xVanty)}`,
      X(xVanty),
      Y(0),
      C.accent,
      13,
      (cy) => cy > Y(0),
    );
  }

  /* Проверка: ни одна рамка не задевает линию и другую рамку. */
  for (const r of ramki) {
    if (r.id === 'os-y' || r.id === 'os-x' || r.id === 'nachalo') {
      continue;
    }
    if (linii.some((s) => otrezokVRamke(s, r, 1))) {
      nalozheniya.push(`подпись «${r.id}» задевает линию`);
    }
  }
  for (let i = 0; i < ramki.length; i += 1) {
    for (let j = i + 1; j < ramki.length; j += 1) {
      const ri = ramki[i];
      const rj = ramki[j];
      if (ri && rj && ramkiPeresekayutsya(ri, rj, 0)) {
        nalozheniya.push(`подписи «${ri.id}» и «${rj.id}» накладываются`);
      }
    }
  }

  const label =
    title ?? 'Схема висячего моста: пилоны, провисающая цепь, вертикальные ванты и полотно моста';
  const svg =
    `<svg class="z10-most z10-most--${rezhim}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(label)}">` +
    `<title>${esc(label)}</title>` +
    parts.join('') +
    podpisi.join('') +
    '</svg>';
  return { svg, report: { podpisi: ramki, nalozheniya, vant: vanty.length } };
}
