/**
 * Чертёж висячего моста для прототипа П-01 — в стиле движка графиков.
 *
 * Цепь — парабола конкретной задачи $y=ax^2+bx+c$ между пилонами
 * ($x=0$ и $x=L$, где $L=-\frac{b}{a}$ — там цепь снова на высоте $c$),
 * ванты — вертикально с равным шагом 10 м, полотно — ось $Ox$ ($y=0$).
 * Композиция — как на рисунке к задаче в открытом банке: цепь крепится к
 * вершинам пилонов, от вершин к берегам идут растяжки, полотно лежит на
 * берегах, под ним русло с водой, пилоны уходят в дно. Ось $Oy$ идёт
 * вдоль левого пилона, 0 — у его основания (на уровне полотна).
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
const POLE = { left: 14, right: 40, top: 34, bottom: 22 };
/** Растяжки пилонов опускаются на берег на такой доле длины моста. */
const OTKOS = 0.2;
const SHAG_VANT = 10;
/* Кегль подписей: чертёж 640 единиц печатается не шире строки листа
   (158 мм), и подпись выходит не мельче 10 pt (lib/sheet/figureRules.js). */
const KEGL = 15;
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
  const verh = c * 1.15;
  const glubina = c * 0.34;
  const otkos = L * OTKOS;

  /* Масштабы: по горизонтали — мост с берегами, по вертикали — от дна
     русла до верха оси (вертикаль растянута, как на схемах банка). */
  const sx = (W - POLE.left - POLE.right) / (L + 2 * otkos);
  const sy = (H - POLE.top - POLE.bottom) / (verh + glubina);
  const X = (x: number) => POLE.left + (x + otkos) * sx;
  const Y = (v: number) => POLE.top + (verh - v) * sy;
  /* Дно русла: от бровки берега (у основания растяжки) вниз и обратно. */
  const dno = (x: number) =>
    -glubina * Math.pow(Math.max(0, Math.sin((Math.PI * (x + otkos)) / (L + 2 * otkos))), 0.6);

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
  /* fon: волны — фон, подпись с белым гало может лечь поверх них. */
  const lomanaya = (tochki: [number, number][], attrs: string, fon = false) => {
    tochki.forEach((t, i) => {
      if (fon) {
        return;
      }
      const pr = tochki[i - 1];
      if (pr) {
        linii.push({ x0: pr[0], y0: pr[1], x1: t[0], y1: t[1] });
      }
    });
    parts.push(
      `<polyline points="${tochki.map(([u, v]) => `${px(u)},${px(v)}`).join(' ')}" fill="none" ${attrs}/>`,
    );
  };

  /* ── Русло и вода ── */
  const NR = 160;
  const ruslo: [number, number][] = [];
  for (let i = 0; i <= NR; i += 1) {
    const xx = -otkos + ((L + 2 * otkos) * i) / NR;
    ruslo.push([X(xx), Y(dno(xx))]);
  }
  const poverhnost = -glubina * 0.12;
  const voda = ruslo.filter(([, v]) => v > Y(poverhnost));
  const pervaya = voda[0];
  const poslednyaya = voda[voda.length - 1];
  if (pervaya && poslednyaya) {
    parts.push(
      `<polygon class="z10-most__voda" points="${px(pervaya[0])},${px(Y(poverhnost))} ${voda.map(([u, v]) => `${px(u)},${px(v)}`).join(' ')} ${px(poslednyaya[0])},${px(Y(poverhnost))}" fill="var(--color-surface-soft, #E6EFFC)"/>`,
    );
  }
  for (let k = 0; k < 3; k += 1) {
    const uroven = poverhnost - ((k + 0.7) * glubina) / 4.2;
    const tochki: [number, number][] = [];
    for (let xx = X(-otkos); xx <= X(L + otkos); xx += 6) {
      const xm = (xx - POLE.left) / sx - otkos;
      const yv = Y(uroven) + 3 * Math.sin((xx - X(0)) / 9 + k);
      if (yv < Y(dno(xm)) - 5) {
        tochki.push([xx, yv]);
      } else if (tochki.length > 0) {
        break;
      }
    }
    lomanaya(
      tochki,
      'stroke="var(--color-primary, #1F5FD0)" stroke-opacity="0.45" stroke-width="1.2"',
      true,
    );
  }
  lomanaya(ruslo, `stroke="${C.axis}" stroke-width="${Wd.helper}"`);

  /* ── Пилоны: от дна до вершины, где крепится цепь; растяжки к берегам ── */
  const shirinaPilona = 7;
  for (const [xp, xb] of [
    [0, -otkos],
    [L, L + otkos],
  ] as const) {
    const xx = X(xp);
    const niz = Y(dno(xp));
    parts.push(
      `<rect x="${px(xx - shirinaPilona / 2)}" y="${px(Y(c))}" width="${shirinaPilona}" height="${px(niz - Y(c))}" fill="var(--color-surface, #FFFFFF)" stroke="${C.axis}" stroke-width="${Wd.helper}"/>`,
    );
    linii.push(
      { x0: xx - shirinaPilona / 2, y0: Y(c), x1: xx - shirinaPilona / 2, y1: niz },
      { x0: xx + shirinaPilona / 2, y0: Y(c), x1: xx + shirinaPilona / 2, y1: niz },
      { x0: xx - shirinaPilona / 2, y0: Y(c), x1: xx + shirinaPilona / 2, y1: Y(c) },
    );
    line({ x0: xx, y0: Y(c), x1: X(xb), y1: Y(0) }, C.axis, Wd.helper + 0.4);
  }

  /* ── Полотно моста = ось Ox ── */
  line({ x0: X(-otkos), y0: Y(0), x1: X(L + otkos), y1: Y(0) }, C.axis, Wd.axis + 1.4);

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
  /* Узлы крепления вант к цепи и цепи к пилонам. */
  for (const xv of [0, ...vanty, L]) {
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
  const yTop = Y(verh) - 18;
  line({ x0: X(0), y0: Y(0), x1: X(0), y1: yTop }, C.axis, Wd.axis);
  parts.push(strelka(X(0), yTop, 0, -1));
  const xRight = X(L + otkos) + 30;
  line({ x0: X(L + otkos), y0: Y(0), x1: xRight, y1: Y(0) }, C.axis, Wd.axis);
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
  svynoskoy('пилон', 'пилон', X(L) + shirinaPilona / 2, Y(c * 0.45));
  svynoskoy('цепь', 'цепь', X(xCep), Y(y(xCep)));
  svynoskoy('ванта', 'ванта', X(vPodpis), Y(y(vPodpis) * 0.6));
  svynoskoy(
    'полотно моста',
    'полотно моста',
    X(Math.abs(xVanty - L * 0.42) < L * 0.2 ? L * 0.8 : L * 0.42),
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
      KEGL,
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
    title ??
    'Схема висячего моста: пилоны с растяжками, провисающая цепь, вертикальные ванты, полотно моста над рекой';
  const svg =
    `<svg class="z10-most z10-most--${rezhim}" data-engine="zadanie10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(label)}">` +
    `<title>${esc(label)}</title>` +
    parts.join('') +
    podpisi.join('') +
    '</svg>';
  return { svg, report: { podpisi: ramki, nalozheniya, vant: vanty.length } };
}
