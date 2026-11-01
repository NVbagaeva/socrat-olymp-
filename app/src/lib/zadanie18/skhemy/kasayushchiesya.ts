/**
 * Схема 14. Касающиеся окружности.
 *
 * Окружность с центром O₁ и радиусом R (ручка R на окружности).
 * Центр O₂ тянется свободно: снаружи первой окружности — внешнее
 * касание (r = O₁O₂ − R), внутри — внутреннее (r = R − O₁O₂).
 * T — точка касания, через неё — общая касательная.
 */

import { okr, otr, ruchka, tch, ug } from '@/lib/skhemy/dsl';
import { add, chisloTeX, dist, mul, sub, unit } from '@/lib/skhemy/geometriya';
import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

const POLE = [-9, -7, 12, 8] as const;

export function tochkiKasaniya(t: Tochki) {
  const O1 = t.O1!;
  const O2 = t.O2!;
  const R = dist(O1, t.R!);
  const d = dist(O1, O2);
  const vneshnee = d > R;
  const r = vneshnee ? d - R : R - d;
  const u = unit(sub(O2, O1));
  const T = add(O1, mul(u, R));
  return { O1, O2, R, r, d, vneshnee, T, u };
}

function postroit(t: Tochki): Kadr {
  const { O1, O2, R, r, vneshnee, T, u } = tochkiKasaniya(t);
  const nrm: T2 = [-u[1], u[0]];
  const dl = Math.max(R, r) * 0.9;
  const el: Element[] = [
    okr('o1', O1, R),
    okr('o2', O2, r),
    otr('O1O2', vneshnee ? O1 : O1, vneshnee ? O2 : T, {
      gruppy: ['pryamaya', 'rasstoyanie'],
      cvet: 'a',
    }),
    otr('O2T', O2, T, { skrytyy: !vneshnee, gruppy: ['pryamaya', 'rasstoyanie'], cvet: 'b' }),
    otr('kas', add(T, mul(nrm, -dl)), add(T, mul(nrm, dl)), { gruppy: ['kasatelnaya'], cvet: 'c' }),
    ug('p1', O1, T, add(T, nrm), {
      pryamoy: true,
      skrytyy: true,
      gruppy: ['kasatelnaya'],
      cvet: 'c',
    }),
    ruchka('R', t.R!),
    tch('O_1', O1),
    tch('O_2', O2),
    tch('T', T, { gruppy: ['pryamaya'], cvet: 'b' }),
  ];
  return {
    elementy: el,
    zametka: vneshnee
      ? null
      : 'Центр $O_2$ внутри первой окружности — касание **внутреннее**: $O_1O_2 = R - r$, точка касания на продолжении $O_1O_2$ за $O_2$.',
    znacheniya: [
      `$O_1O_2 = ${chisloTeX(dist(O1, O2))}$`,
      vneshnee ? `$R + r = ${chisloTeX(R + r)}$` : `$R - r = ${chisloTeX(R - r)}$`,
    ],
  };
}

function goditsya(t: Tochki): boolean {
  const { R, r, d } = tochkiKasaniya(t);
  return R > 1 && r > 0.6 && d > 0.4 && Math.abs(d - R) > 0.6;
}

function ogranichit(imya: string, p: T2, t: Tochki): T2 | null {
  const q: T2 = [
    Math.max(POLE[0], Math.min(POLE[2], p[0])),
    Math.max(POLE[1], Math.min(POLE[3], p[1])),
  ];
  return goditsya({ ...t, [imya]: q }) ? q : null;
}

/** Тянут O₁ — ручка радиуса едет вместе с центром. */
function prisposobit(novye: Tochki, prezhnie: Tochki, imya: string): Tochki | null {
  if (imya !== 'O1') return novye;
  const s = { ...novye, R: add(prezhnie.R!, sub(novye.O1!, prezhnie.O1!)) };
  return goditsya(s) ? s : null;
}

function sluchaynaya(rnd: () => number): Tochki {
  for (let i = 0; i < 300; i += 1) {
    const R = 2 + rnd() * 1.5;
    const vnutr = rnd() < 0.3;
    const d = vnutr ? R * (0.3 + rnd() * 0.4) : R + 1 + rnd() * 2;
    const a = rnd() * Math.PI * 2;
    const t: Tochki = { O1: [0, 0], R: [0, -R], O2: [d * Math.cos(a), d * Math.sin(a)] };
    if (goditsya(t)) return t;
  }
  return NACHALO;
}

const NACHALO: Tochki = { O1: [0, 0], R: [0, -3], O2: [5, 1.2] };

export const KASAYUSHCHIESYA: ZhivayaSkhema = {
  id: 'kasayushchiesya',
  nachalo: NACHALO,
  podvizhnye: ['O1', 'O2', 'R'],
  pole: POLE,
  postroit,
  ogranichit,
  prisposobit,
  sluchaynaya,
  shagi: ['Две окружности касаются в точке $T$'],
  imenaRuchek: {
    O1: 'Центр первой окружности',
    O2: 'Центр второй окружности',
    R: 'Радиус первой окружности',
  },
};
