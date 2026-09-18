/**
 * Структура варианта: один источник истины.
 *
 * До сих пор текст условия, чертёж и разбор писались порознь и от
 * одних и тех же параметров, каждый по-своему. Разойтись им было
 * нечему помешать — и они расходились: условие спрашивало DB₁,
 * а на чертеже была выделена AC₁.
 *
 * Здесь вариант описывается один раз: фигура, её вершины и
 * названные элементы с ролью. Из этого описания собираются и текст,
 * и оба чертежа, и разбор. Проверить «на чертеже ровно то, что
 * названо в условии» можно тогда сравнением структур, а не разбором
 * русского текста.
 *
 * Роли:
 *   'дано'       — названо в условии с числом. На чертеже условия
 *                  НЕ выделяется: в задачнике и на ЕГЭ рёбра по
 *                  условию ученик находит сам. Роль нужна разбору
 *                  и автотесту.
 *   'искомое'    — то, что спрашивают. Выделяется синим (--solid-mark).
 *   'построение' — то, чего в условии нет: параллельный перенос,
 *                  диагональ основания, проекция. Только на чертеже
 *                  разбора и только оранжевым (--graph-accent).
 */

import { type AngleArc, type Model } from '../solid/model';
import { type Shape, bodyOf } from '../solid/drawings/section1';
import { edge, face, prismModel, unlabelled } from '../solid/drawings/common';
import { vertex } from '../solid/figures';
import { type Vec3, sub } from '../solid/vec';

/** Зачем элемент в задаче. */
export type Rol = 'дано' | 'искомое' | 'построение';

/**
 * Названный элемент. Вершины — именами: 'A', 'C1'. Индекс пишется
 * цифрой: подстрочный знак появляется только при наборе текста.
 */
export type Element =
  | { vid: 'отрезок'; ot: string; do: string; rol: Rol; dlina?: number }
  | { vid: 'прямая'; ot: string; do: string; rol: Rol }
  | { vid: 'сечение'; tochki: readonly string[]; rol: Rol }
  | { vid: 'многогранник'; tochki: readonly string[]; rol: Rol }
  | {
      vid: 'угол';
      a: readonly [string, string];
      b: readonly [string, string];
      rol: Rol;
      /** Подпись у дуги: «60°». Дуга ставится только там, где
          прямые пересекаются: у скрещивающихся отмечать нечего. */
      podpis?: string;
    };

/** Описание варианта целиком. */
export interface Zadacha {
  /** Тело чертежа. Пропорции схематические: числа стоят в условии. */
  telo: Shape;
  /** Имя фигуры для текста: 'ABCDA1B1C1D1'. */
  imya: string;
  /** Всё названное в условии плюс построения разбора. */
  elementy: readonly Element[];
  /** Что ищут, словами: «длина диагонали», «угол между прямыми». */
  iskomoe: string;
}

/* ── Чтение структуры ───────────────────────────────────────────── */

/** Элементы одной роли. */
export function poRoli(z: Zadacha, rol: Rol): readonly Element[] {
  return z.elementy.filter((item) => item.rol === rol);
}

/** Пары вершин элемента: у угла их две, у отрезка одна. */
export function pary(element: Element): readonly (readonly [string, string])[] {
  switch (element.vid) {
    case 'отрезок':
    case 'прямая':
      return [[element.ot, element.do]];
    case 'угол':
      return [element.a, element.b];
    default:
      return [];
  }
}

/** Все вершины, названные в задаче: по ним расставляются подписи. */
export function vershiny(z: Zadacha): readonly string[] {
  const seen = new Set<string>();
  z.elementy.forEach((item) => {
    pary(item).forEach(([a, b]) => {
      seen.add(a);
      seen.add(b);
    });
    if (item.vid === 'сечение' || item.vid === 'многогранник') {
      item.tochki.forEach((name) => seen.add(name));
    }
  });
  return [...seen];
}

/* ── Чертежи ────────────────────────────────────────────────────── */

/**
 * Собрать чертёж по ролям.
 *
 * Подписи вершин ставятся, только если в задаче вообще есть
 * названные элементы: у «объём конуса равен 12» буквам на чертеже
 * взяться неоткуда и незачем.
 */
function sobrat(z: Zadacha, alt: string, roli: readonly Rol[]): Model {
  const body = bodyOf(z.telo);
  const nuzhny = z.elementy.filter((item) => roli.includes(item.rol));

  const lines = nuzhny.flatMap((item) =>
    pary(item).map(([a, b]) => ({
      ...edge(body, a, b),
      role: item.rol === 'построение' ? ('построение' as const) : ('искомое' as const),
    })),
  );

  const sections = nuzhny
    .filter(
      (item): item is Extract<Element, { vid: 'сечение' | 'многогранник' }> =>
        item.vid === 'сечение' || item.vid === 'многогранник',
    )
    .map((item) => face(body, ...item.tochki));

  /* Дуга угла — только там, где прямые пересекаются. Точка
     пересечения не обязана быть вершиной: диагонали основания
     сходятся в его центре. У скрещивающихся прямых пересечения нет,
     и угол на чертеже не отметить — сначала перенос, а он живёт
     в разборе. */
  const arcs: AngleArc[] = [];
  nuzhny.forEach((item) => {
    if (item.vid !== 'угол') {
      return;
    }
    const a1 = vertex(body, item.a[0]);
    const a2 = vertex(body, item.a[1]);
    const b1 = vertex(body, item.b[0]);
    const b2 = vertex(body, item.b[1]);
    const at = peresechenie(a1, a2, b1, b2);
    if (at === null) {
      return;
    }
    /* Стороны дуги — к дальним концам отрезков: так она рисуется
       внутри угла, а не поверх его продолжения. */
    const storona = (p: Vec3, q: Vec3): Vec3 => {
      const dp = sub(p, at);
      const dq = sub(q, at);
      return dp[0] * dp[0] + dp[1] * dp[1] + dp[2] * dp[2] >
        dq[0] * dq[0] + dq[1] * dq[1] + dq[2] * dq[2]
        ? dp
        : dq;
    };
    const arc: AngleArc = {
      at,
      u: storona(a1, a2),
      v: storona(b1, b2),
      role: item.rol === 'построение' ? 'построение' : 'искомое',
    };
    arcs.push(item.podpis === undefined ? arc : { ...arc, label: item.podpis });
  });

  /* Подписи нужны только там, где в условии есть буквы. */
  const named = vershiny(z).length > 0;
  return prismModel(alt, named ? body : unlabelled(body), { lines, sections, arcs });
}

/** Пересекаются ли две прямые тела: по координатам, а не по буквам. */
export function peresekayutsya(
  telo: Shape,
  l1: readonly [string, string],
  l2: readonly [string, string],
): boolean {
  const body = bodyOf(telo);
  return (
    peresechenie(
      vertex(body, l1[0]),
      vertex(body, l1[1]),
      vertex(body, l2[0]),
      vertex(body, l2[1]),
    ) !== null
  );
}

/**
 * Точка пересечения двух отрезков в пространстве, или null, если
 * они скрещиваются или параллельны.
 *
 * Считается по ближайшим точкам двух прямых: если они сошлись
 * ближе, чем на тысячную долю, прямые пересекаются, и это и есть
 * точка пересечения.
 */
function peresechenie(a1: Vec3, a2: Vec3, b1: Vec3, b2: Vec3): Vec3 | null {
  const u = sub(a2, a1);
  const v = sub(b2, b1);
  const w = sub(a1, b1);
  const dot = (x: Vec3, y: Vec3) => x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
  const a = dot(u, u);
  const b = dot(u, v);
  const c = dot(v, v);
  const d = dot(u, w);
  const e = dot(v, w);
  const den = a * c - b * b;
  if (Math.abs(den) < 1e-12) {
    return null;
  }
  const t = (b * e - c * d) / den;
  const s = (a * e - b * d) / den;
  const p: Vec3 = [a1[0] + u[0] * t, a1[1] + u[1] * t, a1[2] + u[2] * t];
  const q: Vec3 = [b1[0] + v[0] * s, b1[1] + v[1] * s, b1[2] + v[2] * s];
  const gap = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  return gap < 1e-6 ? p : null;
}

/**
 * Параллельный перенос прямой l2 к прямой l1.
 *
 * Возвращает пару вершин тела, задающую прямую, параллельную l2 и
 * проходящую через вершину l1: именно её проводят в разборе, чтобы
 * скрещивающиеся прямые стали пересекающимися. Такой пары может и
 * не быть — тогда null, и разбор обходится без переноса.
 */
export function perenos(
  telo: Shape,
  l1: readonly [string, string],
  l2: readonly [string, string],
): readonly [string, string] | null {
  const body = bodyOf(telo);
  const names = body.names ?? [];
  const dir = sub(vertex(body, l2[1]), vertex(body, l2[0]));
  const parallel = (u: Vec3): boolean => {
    const cross = [
      u[1] * dir[2] - u[2] * dir[1],
      u[2] * dir[0] - u[0] * dir[2],
      u[0] * dir[1] - u[1] * dir[0],
    ];
    return cross.every((x) => Math.abs(x) < 1e-9);
  };

  for (const anchor of l1) {
    for (const name of names) {
      if (name === null || name === anchor) {
        continue;
      }
      const pairNames: readonly [string, string] = [anchor, name];
      if (pairNames[0] === l2[0] && pairNames[1] === l2[1]) {
        continue;
      }
      if (parallel(sub(vertex(body, name), vertex(body, anchor)))) {
        return pairNames;
      }
    }
  }
  return null;
}

/** Чертёж условия: выделено ровно искомое, и ничего сверх него. */
export function chertezhUslovia(z: Zadacha, alt: string): Model {
  return sobrat(z, alt, ['искомое']);
}

/** Чертёж разбора: то же плюс дополнительные построения. */
export function chertezhRazbora(z: Zadacha, alt: string): Model {
  return sobrat(z, alt, ['искомое', 'построение']);
}
