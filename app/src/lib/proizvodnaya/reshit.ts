/**
 * Независимый пересчёт ответа по рисунку и запросу.
 *
 * Генератор прототипа строит рисунок из задуманной структуры (где
 * экстремумы, какой знак) и записывает ответ. Здесь ответ считается
 * заново из одних только данных рисунка — узлов сплайна и запроса —
 * численно: плотная выборка, знаки, пересечения оси, интеграл.
 * Расхождение двух путей ловит автотест (selftest.ts); тот же пересчёт
 * служит второй проверкой в каждой задаче (Draft.proverka).
 *
 * Вторая половина файла — проверка читаемости рисунка: все условия
 * «ответ не угадывается на глаз» собраны здесь и в одном месте.
 */

import { SHAG, lomanayaY, postroit } from './spline';
import type { Figura, Zapros } from './types';

const EPS = 1e-9;

export type TipNulya = 'plus-minus' | 'minus-plus' | 'kasanie' | 'plato';

export interface Nul {
  x: number;
  tip: TipNulya;
}

function znak(v: number, eps = EPS): -1 | 0 | 1 {
  return Math.abs(v) < eps ? 0 : v > 0 ? 1 : -1;
}

/** Нули функции g на [a; b]: смена знака, касание или площадка. */
export function nuli(g: (x: number) => number, a: number, b: number): Nul[] {
  const total = Math.round((b - a) * SHAG);
  const out: Nul[] = [];
  let lastSign: -1 | 1 | 0 = 0;
  let zeroStart = -1;
  for (let i = 0; i <= total; i += 1) {
    const x = a + i / SHAG;
    const v = g(x);
    const s = znak(v);
    if (s === 0) {
      if (zeroStart < 0) {
        zeroStart = i;
      }
      continue;
    }
    if (zeroStart >= 0) {
      /* Позади остановка в нуле: смена знака или касание. */
      const stretch = i - zeroStart;
      const xz = a + (zeroStart + (i - 1 - zeroStart) / 2) / SHAG;
      if (stretch > 1) {
        out.push({ x: xz, tip: 'plato' });
      } else if (lastSign === 0) {
        /* Нуль на левом краю: тип по знаку справа. */
        out.push({ x: xz, tip: s > 0 ? 'minus-plus' : 'plus-minus' });
      } else if (lastSign === s) {
        out.push({ x: xz, tip: 'kasanie' });
      } else {
        out.push({ x: xz, tip: lastSign > 0 ? 'plus-minus' : 'minus-plus' });
      }
      zeroStart = -1;
    } else if (lastSign !== 0 && lastSign !== s) {
      /* Знак сменился между двумя выборками: нуль не в узле. */
      const prev = g(a + (i - 1) / SHAG);
      const xr = a + (i - 1 + prev / (prev - v)) / SHAG;
      out.push({ x: xr, tip: lastSign > 0 ? 'plus-minus' : 'minus-plus' });
    }
    lastSign = s;
  }
  return out;
}

/** Функция, нарисованная на рисунке. */
export function funkciya(fig: Figura): { y: (x: number) => number; dy: (x: number) => number } {
  if (fig.rezhim === 'lomanaya') {
    const h = 1e-6;
    const y = (x: number) => lomanayaY(fig.uzly, x);
    return { y, dy: (x) => (y(x + h) - y(x - h)) / (2 * h) };
  }
  if (fig.rezhim === 'pryamaya') {
    const first = fig.uzly[0];
    const last = fig.uzly[fig.uzly.length - 1];
    if (first === undefined || last === undefined) {
      return { y: () => Number.NaN, dy: () => Number.NaN };
    }
    const k = (last.y - first.y) / (last.x - first.x);
    return { y: (x) => first.y + k * (x - first.x), dy: () => k };
  }
  const s = postroit(fig.uzly);
  return { y: (x) => s.y(x), dy: (x) => s.dy(x) };
}

/** Границы графика. */
export function granitsy(fig: Figura): [number, number] {
  const first = fig.uzly[0];
  const last = fig.uzly[fig.uzly.length - 1];
  return [first === undefined ? 0 : first.x, last === undefined ? 0 : last.x];
}

/** Интеграл функции по [a; b]: составное правило Симпсона. */
export function integral(g: (x: number) => number, a: number, b: number): number {
  const n = Math.max(2, Math.round((b - a) * SHAG) * 2);
  const h = (b - a) / n;
  let sum = g(a) + g(b);
  for (let i = 1; i < n; i += 1) {
    sum += g(a + i * h) * (i % 2 === 0 ? 2 : 4);
  }
  return (sum * h) / 3;
}

/** Нули производной нарисованной функции (экстремумы f или F). */
export function ekstremumy(fig: Figura, a: number, b: number): Nul[] {
  return nuli(funkciya(fig).dy, a, b);
}

/** Целое ли число с допуском. */
function celoe(x: number): boolean {
  return Math.abs(x - Math.round(x)) < 1e-6;
}

/**
 * Ответ по рисунку и запросу. null — запрос не определён на этом
 * рисунке (число решений не то, нет единственного ответа).
 */
export function reshit(fig: Figura, zapros: Zapros): number | null {
  const [lo, hi] = granitsy(fig);
  const { y, dy } = funkciya(fig);
  const metki = fig.metki ?? [];
  const p = zapros.p ?? lo;
  const q = zapros.q ?? hi;
  const sgn = zapros.znak ?? 1;
  switch (zapros.t) {
    case 'znak-v-metkah':
      return metki.filter((x) => znak(dy(x), 1e-6) === sgn).length;
    case 'metki-na-vozrastanii':
      return metki.filter((x) => znak(y(x), 1e-6) === sgn).length;
    case 'celye-znak': {
      let count = 0;
      for (let x = Math.floor(lo) + 1; x < hi; x += 1) {
        if (znak(dy(x), 1e-6) === sgn) {
          count += 1;
        }
      }
      return count;
    }
    case 'chislo-nuley':
      return ekstremumy(fig, lo, hi).length;
    case 'chislo-nuley-f': {
      const inside = ekstremumy(fig, p, q);
      return inside.length;
    }
    case 'nul-na-otrezke': {
      const inside = ekstremumy(fig, p, q);
      return inside.length === 1 ? (inside[0] as { x: number }).x : null;
    }
    case 'tochka-max': {
      const found = nuli(y, lo, hi).filter((z) => z.tip === 'plus-minus');
      return found.length === 1 ? (found[0] as { x: number }).x : null;
    }
    case 'tochka-min': {
      const found = nuli(y, lo, hi).filter((z) => z.tip === 'minus-plus');
      return found.length === 1 ? (found[0] as { x: number }).x : null;
    }
    case 'chislo-max':
      return nuli(y, p, q).filter((z) => z.tip === 'plus-minus').length;
    case 'chislo-min':
      return nuli(y, p, q).filter((z) => z.tip === 'minus-plus').length;
    case 'chislo-extr':
      return nuli(y, p, q).filter((z) => z.tip === 'plus-minus' || z.tip === 'minus-plus').length;
    case 'extr-na-otrezke': {
      const found = nuli(y, p, q).filter((z) => z.tip === 'plus-minus' || z.tip === 'minus-plus');
      return found.length === 1 ? (found[0] as { x: number }).x : null;
    }
    case 'naib-na-otrezke':
    case 'naim-na-otrezke': {
      const candidates = [
        p,
        q,
        ...nuli(y, p, q)
          .filter((z) => z.tip === 'plus-minus' || z.tip === 'minus-plus')
          .map((z) => z.x),
      ];
      const values = candidates.map((x) => ({ x, v: integral(y, p, x) }));
      const best = values.reduce((acc, cur) =>
        zapros.t === 'naib-na-otrezke' ? (cur.v > acc.v ? cur : acc) : cur.v < acc.v ? cur : acc,
      );
      /* Ничья в пределах погрешности — ответ неоднозначен. */
      const ties = values.filter((c) => Math.abs(c.v - best.v) < 1e-6);
      return ties.length === 1 ? best.x : null;
    }
    case 'kasat-abscissa': {
      const k = zapros.k ?? 0;
      const found = nuli((x) => y(x) - k, lo, hi);
      return found.length === 1 ? (found[0] as { x: number }).x : null;
    }
    case 'kasat-chislo': {
      const k = zapros.k ?? 0;
      return nuli((x) => y(x) - k, lo, hi).length;
    }
    case 'naib-metka':
    case 'naim-metka': {
      if (metki.length === 0) {
        return null;
      }
      const slopes = metki.map((x) => dy(x));
      const target = zapros.t === 'naib-metka' ? Math.max(...slopes) : Math.min(...slopes);
      const idx = slopes
        .map((s, i) => (Math.abs(s - target) < 1e-6 ? i : -1))
        .filter((i) => i >= 0);
      return idx.length === 1 ? (idx[0] as number) + 1 : null;
    }
    case 'kasat-znachenie': {
      const t = fig.kasatelnaya;
      if (t === undefined) {
        return null;
      }
      return (t.b[1] - t.a[1]) / (t.b[0] - t.a[0]);
    }
    case 'prirashchenie':
      return integral(y, p, q);
    case 'ploshchad':
      return Math.abs(integral(y, p, q));
    default:
      return null;
  }
}

/* ── Проверка читаемости рисунка ─────────────────────────────────── */

/** Наименьшая допустимая |f′| в отмеченной точке: знак виден на глаз. */
export const MIN_NAKLON = 0.5;
/** Наименьшая допустимая |f′| в отмеченной точке графика f′: знак виден. */
export const MIN_ZNACHENIE = 1;
/** Наименьший зазор между лучшим и вторым в «в какой точке наибольшая». */
export const MIN_ZAZOR = 1;

/**
 * Список нарушений читаемости. Пустой список — рисунок годен.
 * Условия те, что перечислены в постановке задания: нули и экстремумы
 * в узлах сетки, пересечение оси поперёк, отмеченные точки не на
 * нулях и не рядом, различимая разница, касательная ровно по узлам.
 */
export function problemy(fig: Figura, zapros: Zapros | null): string[] {
  const out: string[] = [];
  const [lo, hi] = granitsy(fig);
  const ok = fig.okno;
  const metki = fig.metki ?? [];
  if (fig.uzly.length < 2) {
    out.push('меньше двух узлов');
    return out;
  }
  for (let i = 1; i < fig.uzly.length; i += 1) {
    if ((fig.uzly[i] as { x: number }).x <= (fig.uzly[i - 1] as { x: number }).x) {
      out.push('узлы не по возрастанию');
    }
  }
  for (const u of fig.uzly) {
    if (!celoe(u.x) || !celoe(u.y)) {
      out.push(`узел (${u.x}; ${u.y}) не в узле сетки`);
    }
  }
  /* Кривая целиком в окне с запасом в клетку. */
  const f = funkciya(fig);
  let ymin = Infinity;
  let ymax = -Infinity;
  for (let x = lo; x <= hi + 1e-9; x += 1 / SHAG) {
    const v = f.y(x);
    ymin = Math.min(ymin, v);
    ymax = Math.max(ymax, v);
  }
  if (ymin < ok.ymin + 0.5 || ymax > ok.ymax - 0.5) {
    out.push('график подходит к краю окна ближе чем на полклетки');
  }
  if (lo < ok.xmin + 0.5 || hi > ok.xmax - 0.5) {
    out.push('график подходит к краю окна по x');
  }
  if (ok.xmin >= 0 || ok.xmax <= 0 || ok.ymin >= 0 || ok.ymax <= 0) {
    out.push('начало координат вне окна');
  }

  if (fig.rezhim === 'f' || fig.rezhim === 'F') {
    const ex = ekstremumy(fig, lo, hi);
    for (const e of ex) {
      if (e.tip !== 'plus-minus' && e.tip !== 'minus-plus') {
        out.push(`экстремум типа ${e.tip}: касание или площадка`);
      }
      if (!celoe(e.x)) {
        out.push(`экстремум в x = ${e.x}: не целая абсцисса`);
      }
    }
    /* Между экстремумами и концами график строго монотонен: нулей
       производной нет нигде, кроме найденных. */
    for (const m of metki) {
      if (Math.abs(f.dy(m)) < MIN_NAKLON) {
        out.push(`в отмеченной точке x = ${m} наклон ${f.dy(m).toFixed(2)} слишком мал`);
      }
    }
  }

  if (fig.rezhim === 'fprime') {
    const z = nuli(f.y, lo, hi);
    for (const e of z) {
      if (e.tip === 'kasanie' || e.tip === 'plato') {
        out.push(`график f′ касается оси или лежит на ней (x = ${e.x})`);
      } else if (!celoe(e.x)) {
        out.push(`нуль f′ при x = ${e.x}: не целая абсцисса`);
      }
    }
    for (const m of metki) {
      if (Math.abs(f.y(m)) < MIN_ZNACHENIE) {
        out.push(
          `в отмеченной точке x = ${m} значение f′ ${f.y(m).toFixed(2)} слишком близко к оси`,
        );
      }
    }
  }

  /* Отмеченные точки: целые, внутри области, не на концах, различны. */
  for (let i = 0; i < metki.length; i += 1) {
    const m = metki[i] as number;
    if (!celoe(m) || m <= lo || m >= hi) {
      out.push(`отмеченная точка ${m} вне интервала или не целая`);
    }
    if (i > 0 && m <= (metki[i - 1] as number)) {
      out.push('отмеченные точки не по возрастанию');
    }
    if (i > 0 && m - (metki[i - 1] as number) < 1) {
      out.push('отмеченные точки ближе клетки');
    }
  }

  if (zapros !== null && zapros.t !== 'prirashchenie' && zapros.t !== 'ploshchad') {
    out.push(...problemyZaprosa(fig, zapros, f));
  }

  const t = fig.kasatelnaya;
  if (t !== undefined) {
    const [a, b] = [t.a, t.b];
    if (![...a, ...b].every(celoe)) {
      out.push('точки касательной не в узлах сетки');
    }
    if (a[0] === b[0]) {
      out.push('касательная вертикальна');
    }
    const k = (b[1] - a[1]) / (b[0] - a[0]);
    const y0 = f.y(t.x0);
    if (Math.abs(a[1] + k * (t.x0 - a[0]) - y0) > 1e-6) {
      out.push('касательная не проходит через точку касания');
    }
    if (Math.abs(f.dy(t.x0) - k) > 1e-6) {
      out.push(`наклон кривой в точке касания ${f.dy(t.x0).toFixed(3)} не равен ${k}`);
    }
    if (Math.abs(b[0] - a[0]) < 2) {
      out.push('узлы касательной ближе двух клеток по x');
    }
    for (const pt of [a, b]) {
      if (
        pt[0] < ok.xmin + 0.5 ||
        pt[0] > ok.xmax - 0.5 ||
        pt[1] < ok.ymin + 0.5 ||
        pt[1] > ok.ymax - 0.5
      ) {
        out.push('узел касательной у края окна');
      }
    }
  }
  return out;
}

function problemyZaprosa(
  fig: Figura,
  zapros: Zapros,
  f: { y: (x: number) => number; dy: (x: number) => number },
): string[] {
  const out: string[] = [];
  const [lo, hi] = granitsy(fig);
  const metki = fig.metki ?? [];
  const zeros = (fig.rezhim === 'fprime' ? nuli(f.y, lo, hi) : ekstremumy(fig, lo, hi)).map(
    (z) => z.x,
  );
  const p = zapros.p;
  const q = zapros.q;
  if (p !== undefined && q !== undefined) {
    if (!(p >= lo && q <= hi && p < q)) {
      out.push('отрезок не лежит внутри интервала');
    }
    if (!celoe(p) || !celoe(q)) {
      out.push('концы отрезка не целые');
    }
    for (const z of zeros) {
      if (Math.abs(z - p) < 1 || Math.abs(z - q) < 1) {
        out.push(`нуль x = ${z} ближе клетки к концу отрезка`);
      }
    }
    /* Хотя бы один нуль снаружи — иначе «на отрезке» ничего не проверяет. */
    if (
      zeros.filter((z) => z < p || z > q).length === 0 &&
      zapros.t !== 'naib-na-otrezke' &&
      zapros.t !== 'naim-na-otrezke'
    ) {
      out.push('все нули внутри отрезка: отбор по отрезку не нужен');
    }
  }
  for (const m of metki) {
    for (const z of zeros) {
      if (
        Math.abs(z - m) < 1 - 1e-9 &&
        (zapros.t === 'metki-na-vozrastanii' || zapros.t === 'znak-v-metkah')
      ) {
        out.push(`отмеченная точка ${m} ближе клетки к нулю ${z}`);
      }
    }
  }
  if (zapros.t === 'naib-metka' || zapros.t === 'naim-metka') {
    const slopes = metki.map((x) => f.dy(x));
    const sorted = [...slopes].sort((a, b) => (zapros.t === 'naib-metka' ? b - a : a - b));
    if (sorted.length >= 2 && Math.abs((sorted[0] as number) - (sorted[1] as number)) < MIN_ZAZOR) {
      out.push('разница наклонов в лучших точках меньше клетки');
    }
    const best = sorted[0] as number;
    if (zapros.t === 'naib-metka' && best < 1) {
      out.push('наибольший наклон меньше 1: не виден на глаз');
    }
    if (zapros.t === 'naim-metka' && best > -1) {
      out.push('наименьший наклон больше −1: не виден на глаз');
    }
  }
  if (zapros.t === 'kasat-abscissa' || zapros.t === 'kasat-chislo') {
    const k = zapros.k ?? 0;
    for (const z of nuli((x) => f.y(x) - k, lo, hi)) {
      if (z.tip === 'kasanie' || z.tip === 'plato') {
        out.push('график f′ касается прямой y = k');
      }
    }
    if (zapros.t === 'kasat-chislo' && !celoe(k)) {
      out.push('k не целое');
    }
    /* Экстремумы f′ не должны лежать близко к прямой y = k. */
    for (let x = Math.ceil(lo); x <= hi; x += 1) {
      if (Math.abs(f.dy(x)) < 1e-6 && Math.abs(f.y(x) - k) < 1) {
        out.push('экстремум f′ ближе клетки к прямой y = k');
      }
    }
  }
  if (zapros.t === 'tochka-max' || zapros.t === 'tochka-min') {
    /* Точно один нуль нужного типа проверяет reshit; здесь — наличие запасного. */
    const decoys = nuli(f.y, lo, hi).filter(
      (z) => z.tip === (zapros.t === 'tochka-max' ? 'minus-plus' : 'plus-minus'),
    );
    if (decoys.length === 0) {
      out.push('нет нуля противоположного типа');
    }
  }
  return out;
}

/** Нули графика f′ с типами — для разбора и подсказок. */
export function nuliProizvodnoy(fig: Figura): Nul[] {
  const [lo, hi] = granitsy(fig);
  return fig.rezhim === 'fprime' ? nuli(funkciya(fig).y, lo, hi) : ekstremumy(fig, lo, hi);
}
