/**
 * Чертёж — схема, а не масштабный рисунок: подбор отображаемой формы.
 *
 * Числа на чертеже настоящие (6°, 84°), а форма фигуры подбирается для
 * читаемости. Сцена прототипа строится функцией от отображаемых
 * параметров (углы, отношения сторон); все связи условия — середина,
 * высота, биссектриса, касание — остаются построениями и выполняются
 * точно при любых параметрах. Здесь ищутся параметры, ближайшие к
 * настоящим, при которых выполнены правила разметки (razmetka.ts):
 *
 *   — отмеченные углы и углы фигуры в пределах 28°…150°;
 *   — значения не спорят с рисунком: острый — острый, тупой — тупой,
 *     меньший угол не больше большего, равные равны;
 *   — соседние точки одной прямой разнесены на 14 % её длины;
 *   — фигура не сплющена при любом повороте варианта.
 *
 * Запас к порогам автотеста (25°, 12 %, 0,35) оставлен намеренно.
 * Если настоящие числа проходят правила, рисунок остаётся точным.
 * Подбор — чистая функция чисел условия: форма одна на задачу и общая
 * для условия, всех шагов подсказки и решения.
 */

import { POTOLOK, POROG } from './figury';
import { resolve } from './geom';
import { type KrugRazmetki, type Porogi, pravilaGeometrii } from './razmetka';
import { PL } from './stil';
import type { Scena, T2 } from './types';

/** Пороги подбора: с запасом к порогам автотеста. */
export const POROGI_SKHEMY: Porogi = {
  minUgol: POROG,
  maxUgol: POTOLOK,
  minDolya: 0.14,
  minFormat: 0.38,
  zapasVida: 6,
};

/** Штраф сцены: 0 — все правила геометрии выполнены. */
export function shtrafSceny(scena: Scena, porogi: Porogi = POROGI_SKHEMY): number {
  const v = resolve(scena);
  /* Приводим к размеру рисунка: допуски правил — в пикселях. */
  const xs: number[] = [];
  const ys: number[] = [];
  for (const p of Object.values(v.tochki)) {
    xs.push(p[0]);
    ys.push(p[1]);
  }
  const w = Math.max(...xs) - Math.min(...xs);
  const h = Math.max(...ys) - Math.min(...ys);
  const s = Math.min(PL.razmer.shirina / Math.max(w, 1e-6), PL.razmer.vysota / Math.max(h, 1e-6));
  if (!Number.isFinite(s)) return Infinity;
  const tochki: Record<string, T2> = {};
  for (const [n, p] of Object.entries(v.tochki)) {
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) return Infinity;
    tochki[n] = [p[0] * s, p[1] * s];
  }
  const krugi: KrugRazmetki[] = [];
  for (const e of scena.elementy) {
    if (e.tip !== 'okruzhnost') continue;
    const k = v.okruzhnosti[e.okr];
    if (k !== undefined) krugi.push({ c: [k.c[0] * s, k.c[1] * s], r: k.r * s });
  }
  /* Нехватка углов — по наибольшей (жёсткая конфигурация делит
     недостачу поровну между углами), остальные правила — суммой. */
  let shtraf = 0;
  let ugol = 0;
  for (const p of pravilaGeometrii(
    scena,
    scena.elementy,
    (n) => tochki[n],
    krugi,
    porogi,
    'luboy',
  )) {
    if (p.kod === 'ugol' && p.shtraf < 1e4) {
      ugol = Math.max(ugol, p.shtraf);
      shtraf += p.shtraf * 1e-3;
    } else shtraf += p.shtraf;
  }
  shtraf += ugol;
  return shtraf;
}

export interface OptsiiPodbora {
  /**
   * Жёсткая конфигурация: общий порог угла недостижим при некоторых
   * числах (биссектриса прямого угла делит 45° на две части — обе не
   * больше 22,5°). Тогда угол рисуется наибольшим возможным, а сцена
   * помечается своим наименьшим углом — не меньше этого.
   */
  minUgol?: number;
}

const KESH = new Map<string, { vid: Record<string, number>; zhestko: boolean }>();

/**
 * Сцена с подобранной формой.
 *
 * istinnye — настоящие значения параметров формы; diapazony — где
 * искать отображаемые; postroit — сцена по отображаемым параметрам
 * (может бросить исключение: такие параметры отбрасываются). Ключ
 * кеша подбора — прототип и числа условия; null — сама сцена на
 * настоящих числах.
 */
export function podobrat<K extends string>(
  klyuchKesha: string | null,
  istinnye: Readonly<Record<K, number>>,
  diapazony: Readonly<Record<K, readonly [number, number]>>,
  postroit: (vid: Readonly<Record<K, number>>) => Scena,
  optsii: OptsiiPodbora = {},
): Scena {
  const porogi: Porogi = POROGI_SKHEMY;
  const klyuchi = Object.keys(istinnye) as K[];
  const gotovo = (vid: Readonly<Record<K, number>>, zhestko: boolean): Scena => {
    const sc = postroit(vid);
    const tochno = klyuchi.every((k) => Math.abs(vid[k] - istinnye[k]) < 1e-9);
    const s: Scena = tochno ? sc : { ...sc, skhematichno: true };
    return zhestko && optsii.minUgol !== undefined ? { ...s, minUgol: optsii.minUgol } : s;
  };
  /* Без ключа — по самой сцене на настоящих числах. */
  let klyuch = klyuchKesha;
  if (klyuch === null) {
    try {
      klyuch = JSON.stringify(postroit(istinnye));
    } catch {
      klyuch = JSON.stringify([istinnye, diapazony, String(postroit)]);
    }
  }
  const izKesha = KESH.get(klyuch);
  if (izKesha !== undefined) return gotovo(izKesha.vid as Record<K, number>, izKesha.zhestko);

  const otsenit = (vid: Readonly<Record<K, number>>): number => {
    for (const k of klyuchi) {
      const [lo, hi] = diapazony[k];
      if (vid[k] < lo - 1e-9 || vid[k] > hi + 1e-9) return Infinity;
    }
    let sh: number;
    try {
      sh = shtrafSceny(postroit(vid), porogi);
    } catch {
      return Infinity;
    }
    if (!Number.isFinite(sh)) return Infinity;
    let d = 0;
    for (const k of klyuchi) {
      const [lo, hi] = diapazony[k];
      d += Math.abs(vid[k] - istinnye[k]) / Math.max(hi - lo, 1e-9);
    }
    /* Сначала правила, потом близость к настоящим числам. */
    return sh * 1000 + d;
  };

  let luchshiy: Record<K, number> = { ...istinnye };
  let cena = otsenit(luchshiy);
  if (cena >= 1) {
    /* Грубая сетка по всем параметрам. */
    const naOs = klyuchi.length === 1 ? 120 : klyuchi.length === 2 ? 26 : 11;
    const osi = klyuchi.map((k) => {
      const [lo, hi] = diapazony[k];
      const n = Math.max(1, Math.min(naOs, Math.ceil(hi - lo)));
      return Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n);
    });
    const idx = klyuchi.map(() => 0);
    for (;;) {
      const vid = {} as Record<K, number>;
      klyuchi.forEach((k, i) => {
        vid[k] = osi[i]![idx[i]!]!;
      });
      const c = otsenit(vid);
      if (c < cena) {
        cena = c;
        luchshiy = vid;
      }
      let i = 0;
      while (i < idx.length) {
        idx[i]! += 1;
        if (idx[i]! < osi[i]!.length) break;
        idx[i] = 0;
        i += 1;
      }
      if (i === idx.length) break;
    }
    /* Уточнение поиском по образцу: шаги вдоль параметров и по
       диагоналям (вдоль «гребня», где два угла должны остаться равными
       или один — ровно прямым); нет улучшения — шаг вдвое меньше. */
    const shagi = klyuchi.map((k) => (diapazony[k][1] - diapazony[k][0]) / naOs);
    const napravleniya: number[][] = [];
    klyuchi.forEach((_, i) => {
      for (const z of [1, -1]) napravleniya.push(klyuchi.map((__, j) => (i === j ? z : 0)));
    });
    for (let i = 0; i < klyuchi.length; i += 1)
      for (let j = i + 1; j < klyuchi.length; j += 1)
        for (const zi of [1, -1])
          for (const zj of [1, -1])
            napravleniya.push(klyuchi.map((_, q) => (q === i ? zi : q === j ? zj : 0)));
    /* Диагонали в равных абсолютных шагах: сумма двух углов сохраняется. */
    const obshchiy = Math.min(...shagi);
    let masshtab = 1;
    for (let iter = 0; iter < 400 && masshtab > 1 / 4096; iter += 1) {
      let luchshe = false;
      for (const napr of napravleniya) {
        const diag = napr.filter((x) => x !== 0).length > 1;
        const vid = { ...luchshiy };
        klyuchi.forEach((k, i) => {
          vid[k] = luchshiy[k] + napr[i]! * masshtab * (diag ? obshchiy : shagi[i]!);
        });
        const c = otsenit(vid);
        if (c < cena - 1e-12) {
          cena = c;
          luchshiy = vid;
          luchshe = true;
        }
      }
      if (!luchshe) masshtab /= 2;
    }
    if (!Number.isFinite(cena)) throw new Error(`подбор формы «${klyuch}»: сцена не строится`);
  }
  const zhestko = cena >= 1;
  if (KESH.size > 4000) KESH.clear();
  KESH.set(klyuch, { vid: luchshiy, zhestko });
  return gotovo(luchshiy, zhestko);
}
