/**
 * Схема 4. Две секущие из одной точки (и пересекающиеся хорды).
 *
 * Окружность неподвижна. Тянутся точка M и две точки на окружности —
 * ручки P и Q, через которые проходят прямые MP и MQ. Если M вне
 * круга, на луче MP дальняя точка — A, ближняя — B; на луче MQ
 * дальняя — D, ближняя — C. Если M внутри, прямые — хорды AB и CD:
 * A и D стоят у ручек, B и C — вторые концы хорд. В обоих случаях
 * △BMC ∼ △DMA и MA · MB = MC · MD.
 *
 * Ручки не подписаны своими буквами: при переходе M через окружность
 * ближняя и дальняя точки меняются ролями, а ручка остаётся под пальцем.
 */

import { mnog, okr, otr, ruchka, tch, ug } from '@/lib/skhemy/dsl';
import { angleAt, chisloTeX, dist, dot, lineCircle, polar, sub } from '@/lib/skhemy/geometriya';
import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

const O: T2 = [0, 0];
const R = 3;
const POLE = [-12, -10, 12, 10] as const;

export interface TochkiSekushchih {
  M: T2;
  A: T2;
  B: T2;
  C: T2;
  D: T2;
  vnutri: boolean;
}

/** Вторая точка прямой MP на окружности и сама P, дальняя — первой. */
function naPryamoy(m: T2, p: T2, vnutri: boolean): [T2, T2] {
  const per = lineCircle(m, p, { c: O, r: R });
  if (per.length < 2) return [p, p];
  /* Ближайшая к P из двух точек пересечения — сама P. */
  const [x1, x2] = [per[0]!.p, per[1]!.p];
  const svoya = dist(x1, p) < dist(x2, p) ? x1 : x2;
  const drugaya = svoya === x1 ? x2 : x1;
  if (vnutri) return [svoya, drugaya];
  return dist(m, svoya) >= dist(m, drugaya) ? [svoya, drugaya] : [drugaya, svoya];
}

export function tochkiSekushchih(t: Tochki): TochkiSekushchih {
  const M = t.M!;
  const vnutri = dist(M, O) < R;
  const [A, B] = naPryamoy(M, t.P!, vnutri);
  const [D, C] = naPryamoy(M, t.Q!, vnutri);
  return { M, A, B, C, D, vnutri };
}

function postroit(t: Tochki): Kadr {
  const { M, A, B, C, D, vnutri } = tochkiSekushchih(t);
  const lit = ['podobie', 'hordy'];

  const el: Element[] = [
    mnog('f-bmc', [B, M, C], { gruppy: lit, cvet: 'b' }),
    mnog('f-dma', [D, M, A], { gruppy: lit, cvet: 'a' }),
    mnog('f-abcd', [A, B, C, D], { gruppy: ['vpisannyy'], cvet: 'c' }),

    /* Шаг 0: окружность и точка M. */
    okr('o', O, R),

    /* Шаг 1–2: секущие (хорды). */
    ...(vnutri
      ? [
          otr('s1', A, B, { shag: 1, gruppy: ['proizv', 'hordy'], cvet: 'a' }),
          otr('s2', D, C, { shag: 2, gruppy: ['proizv', 'hordy'], cvet: 'b' }),
        ]
      : [
          otr('s1', M, A, { shag: 1, gruppy: ['proizv'], cvet: 'a' }),
          otr('s2', M, D, { shag: 2, gruppy: ['proizv'], cvet: 'b' }),
        ]),

    /* Шаг 3: отрезки BC и AD. */
    otr('BC', B, C, { shag: 3, gruppy: [...lit, 'vpisannyy'], cvet: 'b' }),
    otr('AD', A, D, { shag: 3, gruppy: [...lit, 'vpisannyy'], cvet: 'a' }),

    /* Равные углы: одна дуга — при B и D, две — при C и A. */
    ug('uB', M, B, C, { skrytyy: true, gruppy: lit, cvet: 'a' }),
    ug('uD', M, D, A, { skrytyy: true, gruppy: lit, cvet: 'a' }),
    ug('uC', M, C, B, { skrytyy: true, gruppy: [...lit, 'vpisannyy'], cvet: 'b', dugi: 2 }),
    ug('uA', M, A, D, { skrytyy: true, gruppy: [...lit, 'vpisannyy'], cvet: 'b', dugi: 2 }),
    ug('uBCD', B, C, D, { skrytyy: true, gruppy: ['vpisannyy'], cvet: 'c' }),
    ...(vnutri
      ? [
          ug('uM1', B, M, C, { skrytyy: true, gruppy: lit, cvet: 'c', dugi: 3 }),
          ug('uM2', D, M, A, { skrytyy: true, gruppy: lit, cvet: 'c', dugi: 3 }),
        ]
      : [ug('uM', B, M, C, { skrytyy: true, gruppy: lit, cvet: 'c', dugi: 3 })]),

    ruchka('P', t.P!),
    ruchka('Q', t.Q!),
    tch('M', M),
    tch('A', A, { shag: 1, gruppy: ['proizv'], cvet: 'a' }),
    tch('B', B, { shag: 1, gruppy: ['proizv'], cvet: 'a' }),
    tch('C', C, { shag: 2, gruppy: ['proizv'], cvet: 'b' }),
    tch('D', D, { shag: 2, gruppy: ['proizv'], cvet: 'b' }),
  ];

  const ma = dist(M, A);
  const mb = dist(M, B);
  const mc = dist(M, C);
  const md = dist(M, D);
  return {
    elementy: el,
    zametka: vnutri
      ? 'Точка $M$ внутри круга: секущие стали хордами $AB$ и $CD$. Подобие и равенство произведений сохраняются — это теорема о пересекающихся хордах.'
      : null,
    znacheniya: [
      `$MA\\cdot MB = ${chisloTeX(ma * mb)}$`,
      `$MC\\cdot MD = ${chisloTeX(mc * md)}$`,
      `$\\tfrac{MB}{MD} = ${chisloTeX(mb / md)}$`,
      `$\\tfrac{MC}{MA} = ${chisloTeX(mc / ma)}$`,
    ],
  };
}

function naOkruzhnost(p: T2): T2 {
  const d = dist(p, O);
  if (d < 1e-9) return [R, 0];
  return [(p[0] / d) * R, (p[1] / d) * R];
}

/** Расстояние от центра до прямой MP. */
function otCentra(m: T2, p: T2): number {
  const d = sub(p, m);
  const l = Math.hypot(d[0], d[1]);
  return l < 1e-9 ? 0 : Math.abs(d[0] * (O[1] - m[1]) - d[1] * (O[0] - m[0])) / l;
}

function goditsya(t: Tochki): boolean {
  const M = t.M!;
  const P = t.P!;
  const Q = t.Q!;
  const dM = dist(M, O);
  /* Около окружности ближняя точка сливается с M. */
  if (Math.abs(dM - R) < 0.14 * R) return false;
  /* Почти касательные: точки пересечения слились бы. */
  if (otCentra(M, P) > 0.9 * R || otCentra(M, Q) > 0.9 * R) return false;
  const u = sub(P, M);
  const w = sub(Q, M);
  const ugol = angleAt(P, M, Q);
  if (dM > R) {
    if (ugol < 9) return false;
  } else if (ugol < 14 || ugol > 166) {
    return false;
  }
  /* Точки на окружности не слипаются. */
  const { A, B, C, D } = tochkiSekushchih(t);
  const vse = [A, B, C, D];
  for (let i = 0; i < 4; i += 1) {
    for (let j = i + 1; j < 4; j += 1) if (dist(vse[i]!, vse[j]!) < 0.35) return false;
  }
  return dot(u, u) > 0.01 && dot(w, w) > 0.01;
}

function ogranichit(imya: string, p: T2, t: Tochki): T2 | null {
  const q: T2 =
    imya === 'M'
      ? [Math.max(POLE[0], Math.min(POLE[2], p[0])), Math.max(POLE[1], Math.min(POLE[3], p[1]))]
      : naOkruzhnost(p);
  return goditsya({ ...t, [imya]: q }) ? q : null;
}

function sluchaynaya(rnd: () => number): Tochki {
  for (let i = 0; i < 400; i += 1) {
    const kuda = rnd() * 360;
    if (rnd() < 0.25) {
      /* Хорды: M внутри, P и Q — где угодно на окружности. */
      const M = polar(kuda, R * (0.2 + rnd() * 0.45));
      const t: Tochki = { M, P: polar(rnd() * 360, R), Q: polar(rnd() * 360, R) };
      if (goditsya(t)) return t;
      continue;
    }
    /* Секущие: лучи из M внутри конуса, под которым виден круг; P и Q —
       дальние точки пересечения. */
    const d = R * (1.5 + rnd() * 1.1);
    const M = polar(kuda, d);
    const predel = ((Math.asin(R / d) * 180) / Math.PI) * 0.85;
    const a1 = (rnd() * 2 - 1) * predel;
    const a2 = (rnd() * 2 - 1) * predel;
    if (Math.abs(a1 - a2) < 10) continue;
    const dalnyaya = (a: number): T2 => {
      const per = lineCircle(
        M,
        [M[0] + polar(kuda + 180 + a)[0], M[1] + polar(kuda + 180 + a)[1]],
        { c: O, r: R },
      );
      return per.length === 2 ? per[1]!.p : polar(kuda + 180, R);
    };
    const t: Tochki = { M, P: dalnyaya(a1), Q: dalnyaya(a2) };
    if (goditsya(t)) return t;
  }
  return NACHALO;
}

/* M слева от круга; P и Q — дальние точки двух секущих. */
const NACHALO: Tochki = { M: [-8.2, 0.8], P: polar(-18, R), Q: polar(58, R) };

export const SEKUSHCHIE: ZhivayaSkhema = {
  id: 'dve-sekushchie',
  nachalo: NACHALO,
  podvizhnye: ['M', 'P', 'Q'],
  pole: POLE,
  postroit,
  ogranichit,
  sluchaynaya,
  shagi: [
    'Окружность и точка $M$ вне её',
    'Секущая $MA$ пересекает окружность в точках $B$ и $A$',
    'Секущая $MD$ — в точках $C$ и $D$',
    'Отрезки $BC$ и $AD$ — два треугольника с общей вершиной $M$',
  ],
  imenaRuchek: {
    P: 'Точка первой секущей на окружности',
    Q: 'Точка второй секущей на окружности',
  },
};
