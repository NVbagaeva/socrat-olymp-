/**
 * Таблица прототипов: вспомогательные построения и ссылки шагов.
 *
 * Разбор условия даёт тело, данные и искомое; чего в условии нет —
 * какие построения делает решение и на что смотрит каждый его шаг —
 * записано здесь, по прототипу. Записи короткие: общие приёмы
 * (параллельный перенос прямой, прямоугольный треугольник с высотой
 * пирамиды, основание и высота вписанной пирамиды) — функциями ниже.
 *
 * Шаг ссылается на id элементов, ключи рёбер («AB1»), имена точек и
 * id подписей данных («d1»). Ссылки проверяет валидатор.
 */

import { SHKOLNYY, napravlenie } from '@/lib/stereo/proekciya';
import { type V, add, centroid, cross, dot, len, norm, scale, sub } from '@/lib/stereo/vec';
import type { Element, TochkaScenariya } from '@/lib/chertezh3/scenariy';
import { type Params, pair } from '../types';
import type { Dobavki, Kontekst } from './sborka';

type Annotaciya = (k: Kontekst, p: Params) => Dobavki;

const vsp = (id: string, vid: Element['vid'], tochki: string[], podpis?: string): Element =>
  podpis === undefined ? { id, vid, tochki } : { id, vid, tochki, podpis };

/** Все id элементов с приставкой (разрезы многогранника). */
const sPref = (k: Kontekst, pref: string) => k.elementy.filter((e) => e.startsWith(pref));

/** Имя точки, которого ещё нет. */
function novoe(k: Kontekst, zanyato: string[], pref: string): string {
  for (const c of [pref, ...'KLMNPQRTUVW'.split('')]) {
    if (!k.est(c) && !zanyato.includes(c)) return c;
  }
  return `${pref}2`;
}

/** Точка пересечения прямых PQ и RT (null — не пересекаются). */
function peresechenie(P: V, Q: V, R: V, T: V): V | null {
  const d1 = norm(sub(Q, P));
  const d2 = norm(sub(T, R));
  const nn = cross(d1, d2);
  const w0 = sub(R, P);
  if (len(nn) < 1e-9 || Math.abs(dot(w0, norm(nn))) > 1e-9) return null;
  const t = dot(cross(w0, d2), nn) / dot(nn, nn);
  return add(P, scale(d1, t));
}

type Perenos = { tochki: TochkaScenariya[]; elementy: Element[]; per: string[] };

/**
 * Угол между прямыми — как в решении: если прямые пересекаются, угол
 * отмечается в точке пересечения; если скрещиваются, одна прямая
 * переносится параллельно себе в отрезок между вершинами тела —
 * из конца второй прямой или так, чтобы он вторую пересёк. Дуга
 * всегда отмечает угол между прямыми — острый или прямой: при тупом
 * угле луч продолжается за вершину.
 */
function perenos(
  k: Kontekst,
  l1: readonly [string, string],
  l2: readonly [string, string],
): Perenos | null {
  const tochki: TochkaScenariya[] = [];
  const P = (n: string): V => {
    const t = tochki.find((x) => x.imya === n);
    return t && 'xyz' in t.gde ? t.gde.xyz : (k.p(n) as V);
  };
  const zanyato: string[] = [];
  /** Угол в точке O между лучами к A и B, при тупом — с продолжением. */
  const ugolV = (A: string, O: string, B: string): Element[] => {
    const u1 = norm(sub(P(A), P(O)));
    const u2 = norm(sub(P(B), P(O)));
    const out: Element[] = [];
    let konec = B;
    if (dot(u1, u2) < -1e-9) {
      konec = novoe(k, zanyato, 'Y');
      zanyato.push(konec);
      tochki.push({
        imya: konec,
        gde: { xyz: add(P(O), scale(sub(P(O), P(B)), 0.6)) },
        pokazat: false,
      });
      out.push(vsp('prodolzhenie', 'otrezok', [O, konec]));
    }
    const pryamoy = Math.abs(dot(u1, u2)) < 1e-9;
    out.push(vsp('ugol', pryamoy ? 'pryamoy-ugol' : 'ugol', [A, O, konec]));
    return out;
  };
  const tochkaPeresecheniya = (M: V): string => {
    const g = k.vershiny.find((v) => len(sub(v.p, M)) < 1e-9);
    if (g) return g.imya;
    const imya = novoe(k, zanyato, 'O');
    zanyato.push(imya);
    tochki.push({ imya, gde: { xyz: M } });
    return imya;
  };
  const gotovo = (elementy: Element[]): Perenos => ({
    tochki: [...tochki],
    elementy,
    per: [
      ...elementy.map((e) => e.id).filter((e) => e !== 'ugol'),
      ...tochki.filter((t) => t.pokazat !== false).map((t) => t.imya),
    ],
  });
  const dal = (O: V, a: readonly [string, string]) =>
    len(sub(P(a[0]), O)) > len(sub(P(a[1]), O)) ? a[0] : a[1];

  // 1. Прямые пересекаются.
  const M = peresechenie(P(l1[0]), P(l1[1]), P(l2[0]), P(l2[1]));
  if (M) {
    const O = tochkaPeresecheniya(M);
    return gotovo(ugolV(dal(M, l1), O, dal(M, l2)));
  }
  const para = (a: readonly [string, string]) => norm(sub(P(a[1]), P(a[0])));
  // 2. Перенос в отрезок из конца другой прямой.
  for (const [a, b] of [
    [l1, l2],
    [l2, l1],
  ] as const) {
    const db = para(b);
    for (const X of a) {
      const drugoy = a[0] === X ? a[1] : a[0];
      const Y = k.vershiny.find((v) => {
        const d = sub(v.p, P(X));
        return len(d) > 1e-9 && len(cross(norm(d), db)) < 1e-7;
      });
      if (Y) return gotovo([vsp('perenos', 'otrezok', [X, Y.imya]), ...ugolV(drugoy, X, Y.imya)]);
    }
  }
  // 3. Перенос в отрезок между вершинами, пересекающий другую прямую.
  for (const [a, b] of [
    [l1, l2],
    [l2, l1],
  ] as const) {
    const da = para(a);
    for (const Y of k.vershiny)
      for (const Z of k.vershiny) {
        if (Y.imya >= Z.imya || len(cross(norm(sub(Z.p, Y.p)), da)) > 1e-7) continue;
        const N = peresechenie(Y.p, Z.p, P(b[0]), P(b[1]));
        if (N === null) continue;
        const O = tochkaPeresecheniya(N);
        const yz: [string, string] = [Y.imya, Z.imya];
        return gotovo([vsp('perenos', 'otrezok', yz), ...ugolV(dal(N, yz), O, dal(N, b))]);
      }
  }
  return null;
}

/** Угол между прямыми условия — по разбору. */
function ugolUsloviya(k: Kontekst): Dobavki & { ids: string[]; per: string[] } {
  const u = k.r.iskomoe.find((i) => 'ugolMezhdu' in i);
  if (!u || !('ugolMezhdu' in u))
    return { ids: [], per: [], somneniya: ['нет угла между прямыми в условии'] };
  const [l1, l2] = u.ugolMezhdu;
  const r = perenos(k, l1, l2);
  const ids = [`${l1[0]}${l1[1]}`, `${l2[0]}${l2[1]}`];
  if (r === null) return { ids, per: [], somneniya: ['не нашлось переноса прямой в вершину'] };
  return { ids, per: r.per, tochki: r.tochki, elementy: r.elementy };
}

/**
 * Высота пирамиды и прямоугольный треугольник «высота — отрезок
 * основания — боковое ребро» с вершиной основания X.
 */
function treugolnikVysoty(k: Kontekst, X: string): Dobavki & { O: string } {
  const S = k.vershina as string;
  const O = k.est('O') ? 'O' : 'O';
  const tochki: TochkaScenariya[] = k.est('O') ? [] : [{ imya: O, gde: { centr: k.osnovanie } }];
  return {
    O,
    tochki,
    elementy: [
      vsp('SO', 'vysota', [S, O], 'h'),
      vsp(`O${X}`, 'otrezok', [O, X]),
      vsp('tr', 'treugolnik', [S, O, X]),
      vsp('pu', 'pryamoy-ugol', [S, O, X]),
    ],
  };
}

/**
 * Вершина основания, при которой треугольник «высота — отрезок
 * основания — боковое ребро» при школьном ракурсе виден шире всего,
 * а не стоит ребром к зрителю.
 */
function luchshayaVershina(k: Kontekst): string {
  const S = k.p(k.vershina as string) as V;
  const O = centroid(k.osnovanie.map((x) => k.p(x) as V));
  const vzglyad = napravlenie(SHKOLNYY);
  let best = k.osnovanie[1] ?? 'B';
  let bestV = -1;
  for (const x of k.osnovanie) {
    const n = norm(cross(sub(S, O), sub(k.p(x) as V, O)));
    const v = Math.abs(dot(n, vzglyad));
    if (v > bestV + 1e-9) {
      bestV = v;
      best = x;
    }
  }
  return best;
}

/** Боковое ребро из условия (данное или искомое) — его конец в основании. */
function bokovoe(k: Kontekst, zapas = 'B'): string {
  const S = k.vershina;
  const vOsn = (x: string) => k.osnovanie.includes(x);
  for (const d of k.r.dannye) {
    if ('dlina' in d.mera) {
      const [a, b] = d.mera.dlina;
      if ((a === S || b === S || b === '@') && vOsn(a === S ? b : a)) return a === S ? b : a;
    }
  }
  for (const i of k.r.iskomoe) {
    if ('otrezok' in i && i.otrezok.includes(S as string)) {
      const x = i.otrezok[0] === S ? i.otrezok[1] : i.otrezok[0];
      if (vOsn(x)) return x;
    }
  }
  return zapas;
}

/** Пирамида внутри призмы: основание на одном уровне, высота — боковое ребро. */
function piramidaVPrizme(k: Kontekst, vershiny: string[]): Dobavki & { osn: string; vys: string } {
  const z = (n: string) => (k.p(n) as V)[2];
  const niz = vershiny.filter((v) => z(v) < 1e-9);
  const verh = vershiny.filter((v) => z(v) >= 1e-9);
  const [osnova, apex] = niz.length >= 3 ? [niz, verh[0]] : [verh, niz[0]];
  if (apex === undefined) return { osn: 'osn', vys: 'osn', somneniya: ['не пирамида'] };
  const para = apex.endsWith('1') ? apex.slice(0, -1) : `${apex}1`;
  return {
    osn: 'osn',
    vys: `${apex}${para}`,
    elementy: [vsp('osn', 'mnogougolnik', osnova)],
  };
}

/** Вершины многогранника из условия. */
function vershinyMnogogrannika(k: Kontekst): string[] {
  const m = k.r.iskomoe.find((i) => 'mnogogrannik' in i);
  return m && 'mnogogrannik' in m ? [...m.mnogogrannik] : [];
}

/** Середины и плоскость через среднюю линию основания (∥ AB): C M N, сверху M1 N1. */
function srednyayaLiniya(k: Kontekst, prizma: boolean): Dobavki {
  const [A, B, C] = k.osnovanie as [string, string, string];
  const t: TochkaScenariya[] = [
    { imya: 'M', gde: { seredina: [C, A] }, rol: 'uslovie', pokazat: false },
    { imya: 'N', gde: { seredina: [C, B] }, rol: 'uslovie', pokazat: false },
  ];
  const el: Element[] = [vsp('CMN', 'treugolnik', [C, 'M', 'N'])];
  if (prizma) {
    t.push(
      { imya: 'M1', gde: { seredina: [`${C}1`, `${A}1`] }, rol: 'uslovie', pokazat: false },
      { imya: 'N1', gde: { seredina: [`${C}1`, `${B}1`] }, rol: 'uslovie', pokazat: false },
    );
    el.unshift({ id: 'srez', vid: 'ploskost', tochki: ['M', 'N', 'N1', 'M1'], rol: 'uslovie' });
  } else {
    el.unshift({
      id: 'srez',
      vid: 'ploskost',
      tochki: ['M', 'N', k.vershina as string],
      rol: 'uslovie',
    });
  }
  return { tochki: t, elementy: el };
}

/* ── Записи прототипов ──────────────────────────────────────── */

/** Диагональ параллелепипеда XY₁: диагональ основания XY и треугольник XYY₁. */
const diagonal: Annotaciya = (_k, p) => {
  const [X, Y1] = pair(p, 'diag');
  const Y = Y1.replace(/1$/, '');
  return {
    elementy: [
      vsp(`${X}${Y}`, 'diagonal', [X, Y]),
      vsp('tr', 'treugolnik', [X, Y, Y1]),
      vsp('pu', 'pryamoy-ugol', [X, Y, Y1]),
    ],
    shagi: [['d1', 'd2', 'd3'], [`${X}${Y}`], ['tr', 'pu', `${X}${Y1}`]],
  };
};

const ugolPryamyh: Annotaciya = (k) => {
  const u = ugolUsloviya(k);
  return { ...u, shagi: [u.ids, [...u.per, 'ugol'], ['ugol', ...u.ids]] };
};

/** Объём части параллелепипеда или призмы: плоскость разреза. */
const razrez: Annotaciya = (k) => ({ shagi: [sPref(k, 'razrez'), [], sPref(k, 'razrez')] });

const vPrizme: Annotaciya = (k) => {
  const v = vershinyMnogogrannika(k);
  const r = piramidaVPrizme(k, v);
  return { ...r, shagi: [[r.osn, r.vys], [r.osn]] };
};

/** Ступенчатый многогранник: передний профиль. */
const profil: Annotaciya = () => ({ shagi: [['profil'], ['profil'], ['profil']] });

/** Высота правильной пирамиды: половина диагонали, затем прямоугольный треугольник. */
const vysotaPiramidy: Annotaciya = (k) => {
  const X = bokovoe(k);
  const t = treugolnikVysoty(k, X);
  const diag = k.elementy.filter((e) => /^[A-F][A-F]$/.test(e));
  return {
    ...t,
    shagi: [
      [`O${X}`, ...diag],
      ['tr', 'pu', 'SO'],
    ],
  };
};

export const ANNOTACII: Record<string, Annotaciya> = {
  'P03-01': diagonal,
  'P03-02': () => ({
    elementy: [vsp('AC', 'diagonal', ['A', 'C']), vsp('tr', 'treugolnik', ['A', 'C', 'C1'])],
    shagi: [['AC1', 'tr'], ['AC1'], ['AB']],
  }),
  'P03-03': () => ({
    elementy: [vsp('BC1', 'diagonal', ['B', 'C1'])],
    shagi: [['sechenie'], ['BC1'], ['sechenie']],
  }),
  'P03-04': () => ({
    elementy: [vsp('AC', 'diagonal', ['A', 'C'])],
    shagi: [['sechenie'], ['AC'], ['sechenie']],
  }),
  'P03-05': profil,
  'P03-06': ugolPryamyh,
  'P03-07': ugolPryamyh,
  'P03-08': ugolPryamyh,
  'P03-09': (k) => {
    const u = ugolUsloviya(k);
    return {
      ...u,
      elementy: [...(u.elementy ?? []), vsp('BD1', 'diagonal', ['B', 'D1'])],
      shagi: [
        ['BD1', 'AD'],
        ['BD1', 'BB1'],
        ['ugol', ...u.per, ...u.ids],
      ],
    };
  },
  'P03-10': (k) => {
    const u = ugolUsloviya(k);
    return { ...u, shagi: [[...u.ids, ...u.per], ['ugol', ...u.per], ['ugol']] };
  },
  'P03-11': profil,
  'P03-12': razrez,
  'P03-13': razrez,
  'P03-14': razrez,
  'P03-15': () => srezKuba(),
  'P03-16': () => srezKuba(),
  'P03-17': () => ({
    elementy: [vsp('osn', 'mnogougolnik', ['A', 'B', 'C', 'D'])],
    shagi: [['osn', 'BB1'], ['osn'], ['osn', 'BB1']],
  }),
  'P03-18': (k) => ({
    elementy: [vsp('AB1', 'diagonal', ['A', 'B1'])],
    shagi: [['AB1', ...sPref(k, 'razrez')], [], sPref(k, 'razrez')],
  }),
  'P03-19': () => ({
    elementy: [vsp('osn', 'treugolnik', ['A', 'B', 'C'])],
    shagi: [['osn', 'BB1'], ['osn'], ['osn', 'BB1']],
  }),
  'P03-20': () => ({ shagi: [['pryamoy', 'd1', 'd2'], ['AA1']] }),
  'P03-21': () => ({ shagi: [['pryamoy', 'd1', 'd2'], ['AA1']] }),
  'P03-22': (k) => {
    const u = ugolUsloviya(k);
    return {
      ...u,
      elementy: [...(u.elementy ?? []), vsp('gran', 'mnogougolnik', ['B', 'C', 'C1', 'B1'])],
      shagi: [
        ['gran', ...u.ids],
        ['ugol', ...u.per],
      ],
    };
  },
  'P03-23': (k) => {
    const u = ugolUsloviya(k);
    return { ...u, shagi: [[u.ids[0] ?? 'AA1'], ['ugol', ...u.per]] };
  },
  'P03-24': (k) => ({ ...srednyayaLiniya(k, true), shagi: [['srez', 'CMN'], ['srez']] }),
  'P03-25': (k) => ({ ...srednyayaLiniya(k, true), shagi: [['srez', 'CMN'], ['srez']] }),
  'P03-26': (k) => ({ ...srednyayaLiniya(k, true), shagi: [['srez', 'CMN'], ['srez']] }),
  'P03-27': (k) => ({ ...srednyayaLiniya(k, true), shagi: [['srez', 'CMN'], ['srez']] }),
  'P03-28': vPrizme,
  'P03-29': vPrizme,
  'P03-30': vPrizme,
  'P03-31': (k) => ({ shagi: [sPref(k, 'razrez'), sPref(k, 'razrez')] }),
  'P03-32': (k) => ({ shagi: [sPref(k, 'razrez'), sPref(k, 'razrez')] }),
  'P03-33': (k) => ({ shagi: [sPref(k, 'razrez'), sPref(k, 'razrez')] }),
  'P03-34': (k) => ({ shagi: [sPref(k, 'razrez'), sPref(k, 'razrez')] }),
  'P03-35': (k) => {
    const u = ugolUsloviya(k);
    return {
      ...u,
      elementy: [...(u.elementy ?? []), vsp('DE', 'otrezok', ['D', 'E'])],
      shagi: [
        [u.ids[1] ?? '', 'DE'],
        ['ugol', 'perenos', u.ids[0] ?? ''],
      ],
    };
  },
  'P03-36': (k) => ({
    elementy: [vsp('osn', 'treugolnik', ['A', 'B', 'F'])],
    shagi: [['osn'], ['osn', ...sPref(k, 'razrez')]],
  }),
  'P03-37': (k) => ({
    elementy: [vsp('osn', 'mnogougolnik', ['A', 'C', 'D', 'F'])],
    shagi: [['osn', ...sPref(k, 'razrez')], ['osn']],
  }),
  'P03-38': vPrizme,
  'P03-39': vPrizme,
  'P03-40': (k) => {
    const v = vershinyMnogogrannika(k);
    const r = piramidaVPrizme(k, v);
    return { ...r, shagi: [[r.osn], [r.osn, r.vys]] };
  },
  'P03-41': vysotaPiramidy,
  'P03-42': vysotaPiramidy,
  'P03-43': (k) => {
    const X = bokovoe(k, 'C');
    const t = treugolnikVysoty(k, X);
    const diag = k.elementy.find((e) => /^[A-D][A-D]$/.test(e)) ?? `O${X}`;
    return { ...t, shagi: [['tr', 'pu', `O${X}`], [diag]] };
  },
  'P03-44': (k) => {
    const X = luchshayaVershina(k);
    const t = treugolnikVysoty(k, X);
    return {
      ...t,
      shagi: [
        [`O${X}`, 'AB'],
        ['tr', 'pu', 'SO'],
      ],
    };
  },
  'P03-45': (k) => {
    const S = k.vershina as string;
    const t: TochkaScenariya[] = k.osnovanie.map((x, i) => ({
      imya: `M${i + 1}`,
      gde: { seredina: [S, x] as const },
      rol: 'uslovie' as const,
      pokazat: false,
    }));
    return {
      tochki: t,
      elementy: [{ id: 'srez', vid: 'ploskost', tochki: t.map((x) => x.imya), rol: 'uslovie' }],
      shagi: [['srez', 'AB'], ['srez']],
    };
  },
  'P03-46': (k) => {
    const t = treugolnikVysoty(k, 'B');
    return {
      ...t,
      elementy: [
        ...(t.elementy ?? []).filter((e) => e.id !== 'SO'),
        vsp('osn', 'mnogougolnik', k.osnovanie),
      ],
      shagi: [
        ['tr', 'pu', 'OB'],
        ['osn', 'SO'],
      ],
    };
  },
  'P03-47': (k) => {
    const t = treugolnikVysoty(k, 'C');
    return {
      ...t,
      elementy: [...(t.elementy ?? []), vsp('osn', 'mnogougolnik', k.osnovanie)],
      shagi: [['tr', 'pu', 'OC'], ['osn'], ['osn', 'SO']],
    };
  },
  'P03-48': (k) => {
    const S = k.vershina as string;
    return {
      tochki: [
        { imya: 'O', gde: { centr: k.osnovanie } },
        { imya: 'K', gde: { proekciya: 'E', na: ['A', 'B', 'C'] } },
      ],
      elementy: [
        vsp('SO', 'vysota', [S, 'O']),
        vsp('EK', 'vysota', ['E', 'K']),
        vsp('EA', 'otrezok', ['E', 'A']),
        vsp('EC', 'otrezok', ['E', 'C']),
        vsp('ABC', 'treugolnik', ['A', 'B', 'C']),
      ],
      shagi: [['E', 'EK', 'SO'], ['ABC'], ['ABC', 'EK']],
    };
  },
  'P03-49': (k) => {
    const X = luchshayaVershina(k);
    const t = treugolnikVysoty(k, X);
    return {
      ...t,
      shagi: [
        [`O${X}`, 'AB'],
        ['tr', 'pu', 'SO'],
      ],
    };
  },
  'P03-50': (k) => ({ ...srednyayaLiniya(k, false), shagi: [['srez', 'CMN'], ['srez']] }),
  'P03-51': (k) => {
    const X = luchshayaVershina(k);
    const t = treugolnikVysoty(k, X);
    return {
      ...t,
      shagi: [
        [`O${X}`, 'AB'],
        ['tr', 'pu', 'SO'],
      ],
    };
  },
};

/** Треугольная призма, отсекаемая от куба: середины рёбер из вершины A. */
function srezKuba(): Dobavki {
  return {
    tochki: [
      { imya: 'M', gde: { seredina: ['A', 'B'] }, rol: 'uslovie', pokazat: false },
      { imya: 'N', gde: { seredina: ['A', 'D'] }, rol: 'uslovie', pokazat: false },
      { imya: 'M1', gde: { seredina: ['A1', 'B1'] }, rol: 'uslovie', pokazat: false },
      { imya: 'N1', gde: { seredina: ['A1', 'D1'] }, rol: 'uslovie', pokazat: false },
    ],
    elementy: [
      { id: 'srez', vid: 'ploskost', tochki: ['M', 'N', 'N1', 'M1'], rol: 'uslovie' },
      vsp('AMN', 'treugolnik', ['A', 'M', 'N']),
    ],
    shagi: [['srez', 'AMN'], ['AMN'], ['srez']],
  };
}
