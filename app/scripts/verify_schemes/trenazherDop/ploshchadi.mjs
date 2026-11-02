/* scripts/verify_schemes/trenazherDop/ploshchadi.mjs — перенесённые задачи
   тренажёра, тема «Площади». Устройство — как в treugolnik.mjs. */

import { requireSrc } from '../../lib/load-ts.mjs';
import {
  add,
  blizko,
  delit,
  dist,
  ed,
  mid,
  mul,
  naPryamoy,
  peresech,
  ploshchad,
  polar,
  sluchaynyyTreugolnik,
  sub,
  ugol,
} from './obshchee.mjs';

const L = () => requireSrc('lib/zadanie18/trenazher/dop/ploshchadi');

/* pl-obshchaya-vysota: BM : MC = 2 : 3, N — середина AM: S(ABM) : S(AMC) = 2 : 3. */
function vysota({ A, B, C }) {
  const M = delit(B, C, 2, 3);
  return { A, B, C, M, N: mid(A, M) };
}
function proveritVysotu(sch, { A, B, C, M, N }, imya) {
  sch.fakt(
    `${imya}: BM : MC = 2 : 3, N — середина AM`,
    naPryamoy(B, C, M) && blizko(3 * dist(B, M), 2 * dist(M, C)) && blizko(dist(N, mid(A, M)), 0),
  );
  sch.fakt(
    `${imya}: S(ABM) : S(AMC) = 2 : 3`,
    blizko(3 * ploshchad([A, B, M]), 2 * ploshchad([A, M, C])),
  );
}
const OBSHCHAYA_VYSOTA = {
  id: 'pl-obshchaya-vysota',
  b(sch, rnd, d) {
    const otvety = Array.from({ length: 5 }, () => {
      const t = sluchaynyyTreugolnik(rnd);
      const k = Math.sqrt(d.S / ploshchad([t.A, t.B, t.C]));
      const p = vysota({ A: mul(t.A, k), B: mul(t.B, k), C: mul(t.C, k) });
      return ploshchad([p.A, p.B, p.N]);
    });
    sch.fakt(
      'б) S(ABN) не зависит от формы треугольника',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch, d) {
    const p = L().tochkiObshchVysoty(t);
    sch.fakt(`данные: S(ABC) = ${d.S}`, blizko(ploshchad([p.A, p.B, p.C]), d.S));
    return ploshchad([p.A, p.B, p.N]);
  },
  a(rnd, sch) {
    proveritVysotu(sch, vysota(sluchaynyyTreugolnik(rnd)), 'а)');
  },
  scena(t, sch) {
    proveritVysotu(sch, L().tochkiObshchVysoty(t), 'чертёж');
  },
};

/* pl-bissektrisa: Биссектриса AL: AL = 2·AB·AC·cos(A/2)/(AB + AC). */
function bissektrisa({ A, B, C }) {
  return { A, B, C, L: peresech(A, add(A, add(ed(sub(B, A)), ed(sub(C, A)))), B, C) };
}
function proveritBiss(sch, { A, B, C, L: Lt }, imya) {
  sch.fakt(
    `${imya}: L на BC, ∠BAL = ∠LAC`,
    naPryamoy(B, C, Lt) && blizko(ugol(B, A, Lt), ugol(Lt, A, C), 1e-6),
  );
  const u = (ugol(B, A, C) * Math.PI) / 360;
  sch.fakt(
    `${imya}: AL = 2·AB·AC·cos(A/2)/(AB + AC)`,
    blizko(dist(A, Lt), (2 * dist(A, B) * dist(A, C) * Math.cos(u)) / (dist(A, B) + dist(A, C))),
  );
}
const BISSEKTRISA = {
  id: 'pl-bissektrisa',
  b(_sch, _rnd, d) {
    return dist([0, 0], bissektrisa({ A: [0, 0], B: polar(-30, d.AB), C: polar(90, d.AC) }).L);
  },
  nachalo(t, sch, d) {
    const p = L().tochkiBissektrisy(t);
    sch.fakt(
      `данные: AB = ${d.AB}, AC = ${d.AC}, ∠A = 120°`,
      blizko(dist(p.A, p.B), d.AB) &&
        blizko(dist(p.A, p.C), d.AC) &&
        blizko(ugol(p.B, p.A, p.C), 120),
    );
    return dist(p.A, p.L);
  },
  a(rnd, sch) {
    proveritBiss(sch, bissektrisa(sluchaynyyTreugolnik(rnd)), 'а)');
  },
  scena(t, sch) {
    proveritBiss(sch, L().tochkiBissektrisy(t), 'чертёж');
  },
};

export const ZADACHI = [OBSHCHAYA_VYSOTA, BISSEKTRISA];
