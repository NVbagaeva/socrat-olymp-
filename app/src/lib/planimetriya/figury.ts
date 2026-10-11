/**
 * Фигуры из чисел условия.
 *
 * Каждая функция строит вершины фигуры по тем же числам, что даны в
 * задаче: треугольник — по углам, ромб — по углу, трапецию — по
 * основаниям и углам. Поэтому рисунок не спорит с условием: тупой
 * угол тупой, равные стороны равны, касательная касается.
 *
 * Масштаб не важен: движок сам вписывает фигуру в рисунок. Нижняя
 * сторона по умолчанию горизонтальна, обход вершин — против часовой
 * стрелки, как на рисунках ФИПИ.
 */

import { RAD, add, cross, dist, intersect, mul, polar, sub } from './geom';
import type { T2 } from './types';

/** Порог схематичного рисунка по умолчанию, градусы. */
export const POROG = 12;

/**
 * Угол для рисунка: если он меньше порога, рисуется порог. Так угол
 * в 3° на чертеже остаётся различимым, а порядок точек — прежним.
 */
export function vidimyy(ugol: number, porog: number = POROG): number {
  return Math.max(ugol, porog);
}

/**
 * Углы треугольника для рисунка: каждый не меньше порога, сумма
 * 180°, порядок по величине сохранён (больший остаётся большим).
 */
export function uglyTreugolnika(
  ugly: readonly [number, number, number],
  porog: number = POROG,
  potolok = 180,
): [number, number, number] {
  if (potolok < 180) {
    /* Сначала потолок (остроугольный рисунок — без «почти прямых»
       углов), лишнее отдаётся углам ниже потолка пропорционально запасу. */
    const u = ugly.map((x) => Math.min(x, potolok)) as [number, number, number];
    for (let i = 0; i < 6; i += 1) {
      const nedostacha = 180 - (u[0] + u[1] + u[2]);
      if (Math.abs(nedostacha) < 1e-9) break;
      const zapas = u.map((x) => Math.max(0, potolok - x));
      const vsego = zapas[0]! + zapas[1]! + zapas[2]!;
      if (vsego < 1e-9) break;
      for (let k = 0; k < 3; k += 1)
        u[k] = Math.min(potolok, u[k]! + (nedostacha * zapas[k]!) / vsego);
    }
    return uglyTreugolnika(u, porog);
  }
  const out = ugly.map((u) => Math.max(u, porog)) as [number, number, number];
  let lishnee = out[0] + out[1] + out[2] - 180;
  /* Лишнее снимается с углов больше порога пропорционально запасу. */
  for (let i = 0; i < 4 && lishnee > 1e-9; i += 1) {
    const zapas = out.map((u) => Math.max(0, u - porog));
    const vsego = zapas[0]! + zapas[1]! + zapas[2]!;
    if (vsego < 1e-9) break;
    for (let k = 0; k < 3; k += 1) out[k] = out[k]! - (lishnee * zapas[k]!) / vsego;
    lishnee = out[0] + out[1] + out[2] - 180;
  }
  return out;
}

/** Треугольник ABC по углам при A и B: AB на оси x, C сверху. */
export function poUglam(ugolA: number, ugolB: number, osnovanie = 10): { A: T2; B: T2; C: T2 } {
  const A: T2 = [0, 0];
  const B: T2 = [osnovanie, 0];
  const C = intersect(A, polar(ugolA), B, add(B, polar(180 - ugolB)));
  if (C === null) throw new Error('треугольник: углы не дают вершины');
  return { A, B, C };
}

/** Треугольник по трём сторонам: AB = c на оси x, C сверху. a = BC, b = AC. */
export function poStoronam(a: number, b: number, c: number): { A: T2; B: T2; C: T2 } {
  const x = (b * b + c * c - a * a) / (2 * c);
  const y = Math.sqrt(Math.max(0, b * b - x * x));
  return { A: [0, 0], B: [c, 0], C: [x, y] };
}

/** Равнобедренный треугольник с основанием AB и вершиной C по углу при вершине. */
export function ravnobedrennyy(ugolC: number, osnovanie = 10): { A: T2; B: T2; C: T2 } {
  const pri = (180 - ugolC) / 2;
  return poUglam(pri, pri, osnovanie);
}

/**
 * Прямоугольный треугольник с прямым углом C.
 * 'gipotenuza' — гипотенуза AB внизу горизонтально, C сверху (как
 * в задачах о медиане и высоте из прямого угла);
 * 'katety' — катеты по осям: C в начале, B справа, A сверху (как в
 * задачах о синусе и косинусе).
 */
export function pryamougolnyy(
  ugolB: number,
  raskladka: 'gipotenuza' | 'katety' = 'gipotenuza',
): { A: T2; B: T2; C: T2 } {
  if (raskladka === 'gipotenuza') return poUglam(90 - ugolB, ugolB);
  const C: T2 = [0, 0];
  const B: T2 = [10, 0];
  const A: T2 = [0, 10 * Math.tan(ugolB * RAD)];
  return { A, B, C };
}

/**
 * Параллелограмм ABCD: AD на оси x (нижнее основание), угол A = ugolA,
 * AB = bok, AD = osn. Обход A → B → C → D по часовой стрелке, как на
 * рисунках ФИПИ (B левый верхний, C правый верхний).
 */
export function parallelogramm(ugolA: number, osn = 10, bok = 6): { A: T2; B: T2; C: T2; D: T2 } {
  const A: T2 = [0, 0];
  const D: T2 = [osn, 0];
  const B = polar(ugolA, bok);
  const C = add(B, D);
  return { A, B, C, D };
}

/** Ромб ABCD с углом A: та же раскладка, что у параллелограмма. */
export function romb(ugolA: number, storona = 8): { A: T2; B: T2; C: T2; D: T2 } {
  return parallelogramm(ugolA, storona, storona);
}

/**
 * Трапеция ABCD с основаниями AD (нижнее) и BC (верхнее) по углам
 * при нижнем основании и высоте. Верхнее основание получается само.
 */
export function trapeciyaPoUglam(
  nizhnee: number,
  vysota: number,
  ugolA: number,
  ugolD: number,
): { A: T2; B: T2; C: T2; D: T2 } {
  const A: T2 = [0, 0];
  const D: T2 = [nizhnee, 0];
  const B: T2 = [vysota / Math.tan(ugolA * RAD), vysota];
  const C: T2 = [nizhnee - vysota / Math.tan(ugolD * RAD), vysota];
  return { A, B, C, D };
}

/** Трапеция ABCD по основаниям, высоте и сдвигу верхнего основания вправо. */
export function trapeciya(
  nizhnee: number,
  verhnee: number,
  vysota: number,
  sdvig: number,
): { A: T2; B: T2; C: T2; D: T2 } {
  return {
    A: [0, 0],
    B: [sdvig, vysota],
    C: [sdvig + verhnee, vysota],
    D: [nizhnee, 0],
  };
}

/**
 * Многоугольник, описанный около окружности (центр в начале, радиус r):
 * вершины — пересечения касательных в точках с данными полярными
 * углами (по возрастанию). Так строятся описанные трапеция и
 * четырёхугольник: вписанная окружность касается каждой стороны.
 */
export function opisannyy(ugly: readonly number[], r = 5): T2[] {
  const n = ugly.length;
  const out: T2[] = [];
  for (let i = 0; i < n; i += 1) {
    const a = ugly[i]!;
    const b = ugly[(i + 1) % n]!;
    const pa = polar(a, r);
    const pb = polar(b, r);
    const x = intersect(pa, add(pa, polar(a + 90)), pb, add(pb, polar(b + 90)));
    if (x === null) throw new Error('описанный многоугольник: касательные параллельны');
    out.push(x);
  }
  return out;
}

/**
 * Трапеция, описанная около окружности радиуса r с центром (0; r):
 * нижнее основание на оси x, углы при нижнем основании α (слева) и β
 * (справа). Вершины A (левая нижняя), B, C, D (правая нижняя).
 */
export function opisannayaTrapeciya(
  alfa: number,
  beta: number,
  r = 3,
): { A: T2; B: T2; C: T2; D: T2 } {
  const t = (u: number) => Math.tan((u / 2) * RAD);
  return {
    A: [-r / t(alfa), 0],
    B: [-r * t(alfa), 2 * r],
    C: [r * t(beta), 2 * r],
    D: [r / t(beta), 0],
  };
}

/** Точки окружности (центр в начале) по полярным углам. */
export function naOkruzhnosti(ugly: readonly number[], r = 5): T2[] {
  return ugly.map((u) => polar(u, r));
}

/**
 * Вписанный четырёхугольник по дугам: дуги AB, BC, CD (DA — остаток),
 * обход по часовой стрелке от точки A с полярным углом start.
 */
export function vpisannyyPoDugam(
  dugi: readonly [number, number, number],
  start = 160,
  r = 5,
): { A: T2; B: T2; C: T2; D: T2 } {
  const a = start;
  const b = a - dugi[0];
  const c = b - dugi[1];
  const d = c - dugi[2];
  const [A, B, C, D] = naOkruzhnosti([a, b, c, d], r) as [T2, T2, T2, T2];
  return { A, B, C, D };
}

/** Правильный n-угольник, вписанный в окружность радиуса r, первая вершина внизу слева. */
export function pravilnyy(n: number, r = 5): T2[] {
  const start = -90 - 180 / n;
  return Array.from({ length: n }, (_, i) => polar(start + (360 / n) * i, r));
}

/** Площадь треугольника. */
export function ploshchad(a: T2, b: T2, c: T2): number {
  return Math.abs(cross(sub(b, a), sub(c, a))) / 2;
}

/** Точка на луче из P через Q на расстоянии d от P. */
export function naLuche(p: T2, q: T2, d: number): T2 {
  const l = dist(p, q) || 1;
  return add(p, mul(sub(q, p), d / l));
}

/**
 * Четырёхугольник ABCD, описанный около окружности, по четырём
 * сторонам (AB + CD = BC + DA). Отрезки касательных из вершин
 * подбираются так, чтобы все были положительны; радиус — из условия
 * «сумма углов 360°». Возвращает вершины, центр (начало) и радиус.
 */
export function opisannyyPoStoronam(
  ab: number,
  bc: number,
  cd: number,
  da: number,
): { A: T2; B: T2; C: T2; D: T2; r: number } {
  if (Math.abs(ab + cd - bc - da) > 1e-9)
    throw new Error('описанный четырёхугольник: AB + CD ≠ BC + DA');
  /* ta — касательная из A; остальные выражаются через неё. */
  const lo = Math.max(0, ab - bc);
  const hi = Math.min(ab, cd - bc + ab, da);
  if (!(hi > lo)) throw new Error('описанный четырёхугольник: нет положительных касательных');
  const ta = (lo + hi) / 2;
  const tb = ab - ta;
  const tc = bc - tb;
  const td = cd - tc;
  const t = [ta, tb, tc, td];
  const summa = (r: number) => t.reduce((s, x) => s + Math.atan(r / x), 0);
  let a = 0;
  let b = Math.max(...t) * 100;
  for (let i = 0; i < 200; i += 1) {
    const m = (a + b) / 2;
    if (summa(m) < Math.PI) a = m;
    else b = m;
  }
  const r = (a + b) / 2;
  const ugol = t.map((x) => (2 * Math.atan(r / x)) / RAD); // углы при A, B, C, D
  /* Точки касания: на AB — внизу; от неё против часовой стрелки. */
  const tAB = -90 - (180 - ugol[0]!) / 2 + 0;
  const tBC = tAB + 180 - ugol[1]!;
  const tCD = tBC + 180 - ugol[2]!;
  const tDA = tCD + 180 - ugol[3]!;
  const [B, C, D, A] = opisannyy([tAB, tBC, tCD, tDA], r) as [T2, T2, T2, T2];
  return { A, B, C, D, r };
}
