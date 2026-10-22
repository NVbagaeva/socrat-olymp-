/**
 * Генераторы аналогов задания №6: по одному на прототип.
 *
 * `gen(r, sj)` возвращает параметры задачи: `sj` — ключ сюжета (для
 * сюжетных задач) или null («в стиле ФИПИ»: нейтральная формулировка,
 * как в исходнике). Генератор может вернуть null — кандидат не подошёл,
 * подбор берёт следующего.
 *
 * Вероятности всегда собираются в целых долях общего знаменателя:
 * сначала раскладывается целое число (100 сотых), потом оно делится —
 * сумма распределения равна 1 ровно.
 */

import type { Rng } from '../../vychisleniya/rng';
import { syuzhetEilera } from '../prototypes/gruppa1';
import { syuzhetLotterei, tovar, TOVARY_FIPI, SYUZHETY_P09 } from '../prototypes/gruppa3';
import { SYUZHETY_P10 } from '../prototypes/gruppa4';
import { syuzhetVyborki } from '../prototypes/gruppa5';
import type { Params } from '../types';
import { velichina } from '../velichiny';

export type Generator = (r: Rng, sj: string | null) => Params | null;

/* ── Раскладки целого ───────────────────────────────────────────── */

/** Целое total на n слагаемых, каждое не меньше min (случайная композиция). */
export function kompoziciya(r: Rng, total: number, n: number, min = 1): number[] | null {
  const ostatok = total - n * min;
  if (ostatok < 0) {
    return null;
  }
  const razrezy = Array.from({ length: n - 1 }, () => r.int(0, ostatok)).sort((a, b) => a - b);
  const out: number[] = [];
  let pred = 0;
  for (const x of [...razrezy, ostatok]) {
    out.push(x - pred + min);
    pred = x;
  }
  return out;
}

/** Вероятности в сотых: чаще кратные 5 (0,05; 0,2; 0,35), иногда любые сотые. */
export function sotye(r: Rng, n: number, shag5 = 0.7): number[] | null {
  if (r.next() < shag5) {
    const k = kompoziciya(r, 20, n, 1);
    return k ? k.map((x) => x * 5) : null;
  }
  return kompoziciya(r, 100, n, 2);
}

/** Вероятности в десятых (как сотые, кратные 10). */
export function desyatye(r: Rng, n: number): number[] | null {
  const k = kompoziciya(r, 10, n, 1);
  return k ? k.map((x) => x * 10) : null;
}

function peremeshat<T>(r: Rng, xs: readonly T[]): T[] {
  return r.sample(xs, xs.length);
}

/** Буква величины: в стиле ФИПИ чаще X, иногда Y и Z. */
function bukva(r: Rng, sj: string | null): string {
  if (sj !== null) {
    return 'X';
  }
  const x = r.next();
  return x < 0.6 ? 'X' : x < 0.85 ? 'Y' : 'Z';
}

/** Возрастающая выборка m значений из списка. */
function vozrastayushchie(r: Rng, iz: readonly number[], m: number): number[] {
  return r.sample(iz, m).sort((a, b) => a - b);
}

/** m подряд идущих значений из списка (окно). */
function podryad(r: Rng, iz: readonly number[], m: number): number[] | null {
  if (iz.length < m) {
    return null;
  }
  const s = r.int(0, iz.length - m);
  return iz.slice(s, s + m);
}

const diapazon = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

/* ── Генераторы ─────────────────────────────────────────────────── */

export const GENERATORY: Record<string, Generator> = {
  /* 6.1 — диаграмма Эйлера, вероятности у точек */
  P01(r, sj) {
    const n = r.int(5, 8);
    const iz = sj === null ? diapazon(1, 10) : syuzhetEilera(sj).znacheniya;
    const m = r.int(2, Math.min(4, iz.length));
    const vals = r.sample(iz, m);
    const k = vals[0] as number;
    const cnt = kompoziciya(r, n - 2 - (m - 1), m, 0);
    if (!cnt) {
      return null;
    }
    const xs: number[] = [];
    vals.forEach((v, i) => {
      const c = (cnt[i] as number) + (i === 0 ? 2 : 1);
      for (let j = 0; j < c; j += 1) xs.push(v);
    });
    const ps = sotye(r, n);
    if (!ps) {
      return null;
    }
    return { xs: peremeshat(r, xs), ps, den: 100, k, v: bukva(r, sj), ...(sj ? { sj } : {}) };
  },

  /* 6.2 — равновозможные исходы */
  P02(r, sj) {
    const n = r.pick([5, 6, 8, 8, 10, 10]);
    const m = n === 6 ? 3 : r.int(1, n - 1);
    const iz = sj === null ? diapazon(1, 9) : syuzhetEilera(sj).znacheniya;
    const ostalnyh = r.int(1, Math.min(3, iz.length - 1, n - m));
    const vals = r.sample(iz, ostalnyh + 1);
    const k = vals[0] as number;
    const drugie = vals.slice(1);
    const cnt = kompoziciya(r, n - m, drugie.length, 1);
    if (!cnt) {
      return null;
    }
    const xs: number[] = Array.from({ length: m }, () => k);
    drugie.forEach((v, i) => {
      for (let j = 0; j < (cnt[i] as number); j += 1) xs.push(v);
    });
    return { xs: peremeshat(r, xs), k, v: bukva(r, sj), ...(sj ? { sj } : {}) };
  },

  /* 6.3 — дерево и условная вероятность */
  P03(r, sj) {
    const formy = [
      [-1, -1, 0, 0, 1, 1],
      [-1, -1, 0, 0, 1, 1, 1],
      [-1, -1, 0, 0, 0, 1, 1],
      [-1, -1, -1, 2, 2],
      [-1, -1, 1, 1, 1],
      [-1, -1, 0, 0, 2, 2, 1, 1],
      [-1, -1, 1, 1, 3, 3],
      [-1, -1, 0, 0, 1, 1, 3, 3],
    ];
    const rod = r.pick([formy[0], formy[0], ...formy]) as number[];
    const ps = new Array<number>(rod.length).fill(0);
    for (const u of new Set(rod)) {
      const deti = rod.map((x, i) => (x === u ? i : -1)).filter((i) => i >= 0);
      let doli: number[] | null;
      if (deti.length === 2) {
        const a = r.next() < 0.7 ? r.int(1, 9) * 10 : r.pick([15, 25, 35, 45, 55, 65, 75, 85]);
        doli = [a, 100 - a];
      } else {
        doli = desyatye(r, deti.length);
      }
      if (!doli) {
        return null;
      }
      deti.forEach((i, j) => {
        ps[i] = doli[j] as number;
      });
    }
    const listev = rod.filter((_, i) => !rod.includes(i)).length;
    /* A и B — подряд стоящие листья с частичным пересечением: a0 < b0 ≤ a1 < b1. */
    /* В каждом событии не меньше двух исходов, как в задачах ЕГЭ. */
    const a0 = r.int(0, listev - 3);
    const b1 = r.int(a0 + 2, listev - 1);
    const b0 = r.int(a0 + 1, b1 - 1);
    const a1 = r.int(b0, b1 - 1);
    const levoA = r.next() < 0.75;
    const A = levoA ? [a0, a1] : [b0, b1];
    const B = levoA ? [b0, b1] : [a0, a1];
    return {
      rod,
      ps,
      den: 100,
      a: A,
      b: B,
      vop: r.next() < 0.8 ? 'AB' : 'BA',
      ...(sj ? { sj } : {}),
    };
  },

  /* 6.4 — лотерея */
  P04(r, sj): Params | null {
    const s = sj ? syuzhetLotterei(sj) : null;
    const N = s
      ? r.pick(s.Ns)
      : r.pick([5000, 8000, 10000, 12000, 15000, 20000, 25000, 40000, 50000, 100000]);
    const ws = s ? s.ws : [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
    const m = r.int(3, Math.min(5, ws.length));
    const w = vozrastayushchie(r, ws, m);
    const c: number[] = [];
    let ostalos = Math.round(N * (r.int(4, 15) / 100));
    for (let i = 0; i < m; i += 1) {
      const dolya =
        i === m - 1 ? r.int(1, 5) : Math.max(1, Math.round(ostalos * (r.int(45, 80) / 100)));
      const kruglo = dolya >= 100 ? Math.round(dolya / 10) * 10 : dolya;
      c.push(Math.max(1, kruglo));
      ostalos = Math.max(m - i, ostalos - kruglo);
    }
    for (let i = 1; i < m; i += 1) {
      if ((c[i] as number) >= (c[i - 1] as number)) {
        return null;
      }
    }
    if (c.reduce((a, b) => a + b, 0) >= N) {
      return null;
    }
    if (s) {
      return { N, w, c, sj: s.key } satisfies Params;
    }
    const forma = r.next() < 0.7 ? 'org' : 'vsego';
    return {
      N,
      w,
      c,
      forma,
      tab: forma === 'vsego' ? 'B' : r.next() < 0.8 ? 'A' : 'C',
    } satisfies Params;
  },

  /* 6.5 — беспроигрышная лотерея */
  P05(r, sj) {
    const s = sj ? syuzhetLotterei(sj) : null;
    const N = s ? r.pick(s.Ns) : r.pick([500, 800, 1000, 1200, 1500, 1700, 2000, 2500]);
    const ws = s
      ? s.ws
      : [5, 10, 15, 20, 25, 30, 50, 70, 100, 200, 300, 400, 500, 1000, 2000, 4000, 5000];
    const m = r.int(3, 4);
    const w = vozrastayushchie(r, ws, m);
    const melkie: number[] = [];
    for (let i = 1; i < m; i += 1) {
      melkie.push(Math.max(1, Math.round((N * r.int(1, 25)) / 1000 / (i * i))));
    }
    const rest = melkie.reduce((a, b) => a + b, 0);
    const c = [N - rest, ...melkie];
    if ((c[0] as number) <= N / 2) {
      return null;
    }
    const E = w.reduce((a, x, i) => a + x * (c[i] as number), 0) / N;
    const ceny = [
      20, 25, 30, 40, 50, 60, 70, 80, 99, 100, 120, 150, 199, 200, 250, 299, 300, 350, 400, 500,
      600, 700, 800, 1000, 1500, 2000, 3000,
    ];
    const podhodyat = ceny.filter((x) => x > E + 1 && x <= E * 2.5 + 10);
    if (podhodyat.length === 0) {
      return null;
    }
    const cena = r.pick(podhodyat);
    return { N, w, c, cena, ...(s ? { sj: s.key } : {}) };
  },

  /* 6.6 — распределение таблицей */
  P06(r, sj) {
    return raspredelenie(r, sj, { m: [4, 5], iz: diapazon(-4, 10) });
  },

  /* 6.7 — распределение записью */
  P07(r, sj) {
    return raspredelenie(r, sj, { m: [4, 6], iz: diapazon(-3, 12) });
  },

  /* 6.8 — частоты из 100 */
  P08(r, sj) {
    const tv = sj ? tovar(sj) : r.pick(TOVARY_FIPI);
    const k = r.pick(tv.razmery);
    const n0 = r.int(40, 85);
    const parts = kompoziciya(r, 100 - n0, k.length, 1);
    if (!parts) {
      return null;
    }
    /* Чаще всего берут самую маленькую покупку. */
    const n = [...parts].sort((a, b) => b - a);
    return { tovar: tv.key, k, n, n0, ...(sj ? { sj } : {}) };
  },

  /* 6.9 — страхование */
  P09(r, sj): Params | null {
    if (sj) {
      const s = SYUZHETY_P09.find((x) => x.key === sj);
      if (!s) {
        return null;
      }
      return {
        V: r.pick(s.Vs),
        pn: r.pick(s.pTys),
        pden: 1000,
        R: r.pick(s.Rs),
        sj,
      } satisfies Params;
    }
    return {
      V: r.pick([
        300000, 500000, 600000, 800000, 1000000, 1200000, 1500000, 2000000, 2500000, 3000000,
      ]),
      pn: r.pick([1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20]),
      pden: 1000,
      R: r.pick([500, 800, 1000, 1200, 1500, 2000, 2500, 3000]),
    };
  },

  /* 6.10 — неравенство Чебышёва: сначала оценка, потом дисперсия под неё */
  P10(r, sj) {
    const s = sj ? SYUZHETY_P10.find((x) => x.key === sj) : null;
    if (sj && !s) {
      return null;
    }
    const E = s ? r.pick(s.Es) : r.next() < 0.8 ? r.int(2, 30) : r.int(5, 40) + 0.5;
    const eps = s ? r.pick(s.epss) : r.pick([1.5, 2, 2.5, 3, 4, 5, 6]);
    const [dMin, dMax] = s ? s.Ds : [0.4, 12];
    const otvet = r.int(4, 90) / 100;
    const D = Math.round(otvet * eps * eps * 1e6) / 1e6;
    if (Math.abs(D * 10 - Math.round(D * 10)) > 1e-9 || D < dMin || D > dMax || E - eps < 0) {
      return null;
    }
    return { E, D, eps, v: s ? 'X' : bukva(r, null), ...(sj ? { sj } : {}) };
  },

  /* 6.11 — вероятность попадания в промежуток */
  P11(r, sj) {
    let xs: number[] | null;
    if (sj) {
      const iz = velichina(sj).znacheniya;
      xs = podryad(r, iz, Math.min(iz.length, r.int(4, 6)));
    } else {
      const vid = r.int(0, 2);
      const m = r.int(5, 7);
      const s = r.int(-2, 5);
      const shag = vid === 1 ? 2 : 1;
      xs = Array.from({ length: m }, (_, i) => s + i * shag);
      if (vid === 2) {
        xs = vozrastayushchie(r, diapazon(-3, 12), m);
      }
    }
    if (!xs || xs.length < 4) {
      return null;
    }
    const ps = sotye(r, xs.length);
    if (!ps) {
      return null;
    }
    const min = xs[0] as number;
    const max = xs.at(-1) as number;
    /* Границы: из значений, между значениями или за пределами. */
    const kandidaty = diapazon(min - 3, max + 3);
    const a = r.pick(kandidaty.filter((x) => x < max));
    const b = r.pick(kandidaty.filter((x) => x > a + 1));
    const zl = r.next() < 0.5 ? 'lt' : 'le';
    const zr = r.next() < 0.5 ? 'lt' : 'le';
    const vnutri = xs.filter(
      (x) => (zl === 'lt' ? x > a : x >= a) && (zr === 'lt' ? x < b : x <= b),
    );
    if (vnutri.length === 0 || vnutri.length === xs.length) {
      return null;
    }
    return {
      xs,
      ps,
      den: 100,
      a,
      b,
      zl,
      zr,
      v: sj ? 'X' : r.next() < 0.6 ? 'Y' : 'X',
      ...(sj ? { sj } : {}),
    };
  },

  /* 6.12 — выборка, несмещённая оценка дисперсии */
  P12(r, sj) {
    const n = r.int(4, 7);
    const s = sj ? syuzhetVyborki(sj) : null;
    const [c0, c1] = s ? s.centr : [1, 8];
    const razbros = s ? s.razbros : 3;
    const centr = r.int(c0 * 10, c1 * 10);
    const xs = Array.from({ length: n }, () => {
      const x = centr + r.int(-razbros * 10, razbros * 10);
      return Math.max(1, x) / 10;
    });
    if (xs.filter((x) => !Number.isInteger(x)).length < 2) {
      return null;
    }
    return { xs, ...(sj ? { sj } : {}) };
  },

  /* 6.13 — дробные вероятности */
  P13(r, sj) {
    const den = r.pick([2, 3, 4, 5, 5, 5, 8, 10, 20, 25]);
    if (den === 3) {
      return null;
    }
    const m = r.next() < 0.7 ? 2 : 3;
    const iz = sj ? velichina(sj).znacheniya : diapazon(-2, 6);
    const xs = m === 2 && !sj && r.next() < 0.4 ? [0, 1] : vozrastayushchie(r, iz, m);
    const ps = kompoziciya(r, den, m, 1);
    if (!ps || ps.some((x) => x === den)) {
      return null;
    }
    /* Дроби должны быть «дробными»: хотя бы одна несократимая с этим знаменателем. */
    if (!ps.some((x) => nod(x, den) === 1)) {
      return null;
    }
    return { xs, ps, den, v: sj ? 'X' : r.next() < 0.6 ? 'Z' : 'X', ...(sj ? { sj } : {}) };
  },

  /* 6.14 — дисперсия по распределению */
  P14(r, sj) {
    const p = raspredelenie(r, sj, { m: [3, 5], iz: diapazon(-3, 9) });
    if (!p) {
      return null;
    }
    return { ...p, forma: r.next() < 0.5 ? 'zapis' : 'tablica' };
  },

  /* 6.15 — стандартное отклонение */
  P15(r, sj) {
    const iz = sj ? velichina(sj).znacheniya : diapazon(-4, 12);
    if (r.next() < 0.55) {
      /* Два значения: D = p(1 − p)·(b − a)², p(1 − p) — точный квадрат. */
      const p = r.pick([10, 20, 36, 50, 50, 64, 80, 90]);
      const [a, b] = vozrastayushchie(r, iz, 2) as [number, number];
      return { xs: [a, b], ps: [p, 100 - p], den: 100, v: bukva(r, sj), ...(sj ? { sj } : {}) };
    }
    /* Три значения через равный шаг: D = 2q·h², 2q — точный квадрат. */
    const q0 = r.pick([2, 8, 18, 32]);
    const h = sj ? null : r.int(1, 6);
    let xs: number[] | null;
    if (h === null) {
      const okno = podryad(r, iz, 3);
      if (
        !okno ||
        (okno[1] as number) - (okno[0] as number) !== (okno[2] as number) - (okno[1] as number)
      ) {
        return null;
      }
      xs = okno;
    } else {
      const m0 = r.int(-2, 8);
      xs = [m0 - h, m0, m0 + h];
    }
    return { xs, ps: [q0, 100 - 2 * q0, q0], den: 100, v: bukva(r, sj), ...(sj ? { sj } : {}) };
  },
};

function nod(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    [x, y] = [y, x % y];
  }
  return x;
}

/** Распределение: m значений по возрастанию, вероятности в сотых. */
function raspredelenie(
  r: Rng,
  sj: string | null,
  o: { m: [number, number]; iz: number[] },
): Params | null {
  let xs: number[] | null;
  if (sj) {
    const iz = velichina(sj).znacheniya;
    const m = Math.min(iz.length, r.int(o.m[0], o.m[1]));
    xs = r.next() < 0.6 ? podryad(r, iz, m) : vozrastayushchie(r, iz, m);
  } else {
    xs = vozrastayushchie(r, o.iz, r.int(o.m[0], o.m[1]));
  }
  if (!xs) {
    return null;
  }
  const ps = r.next() < 0.3 ? desyatye(r, xs.length) : sotye(r, xs.length);
  if (!ps) {
    return null;
  }
  return { xs, ps, den: 100, v: bukva(r, sj), ...(sj ? { sj } : {}) };
}
