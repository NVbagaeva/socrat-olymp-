/* scripts/verify_schemes/trenazherDop/okruzhnost.mjs — перенесённые задачи
   тренажёра, тема «Окружность и вписанные углы». Устройство — как в treugolnik.mjs. */

import { requireSrc } from '../../lib/load-ts.mjs';
import {
  add,
  blizko,
  dist,
  koren,
  mid,
  mul,
  naOkr,
  naPryamoy,
  okrOkr,
  opisannaya,
  osnovanie,
  peresech,
  polar,
  povorot90,
  pryamayaOkr,
  skalyar,
  sluchaynyyTreugolnik,
  sub,
  ugol,
} from './obshchee.mjs';

const L = () => requireSrc('lib/zadanie18/trenazher/dop/okruzhnost');
const ostryy = ({ A, B, C }) => Math.max(ugol(B, A, C), ugol(A, B, C), ugol(A, C, B)) < 89;
const naOkruzhnosti = (o, ...pts) => pts.every((p) => blizko(dist(o.c, p), o.r, 1e-7));

/* ok-ortocentr: O — центр описанной, H — ортоцентр: ∠BAH = ∠OAC; AH = 2R cos A. */
function ortocentr(A, B, C) {
  return peresech(A, osnovanie(A, B, C), B, osnovanie(B, A, C));
}
function proveritOrtocentr(sch, { A, B, C, H, O }, imya) {
  sch.fakt(
    `${imya}: O — центр описанной, H — ортоцентр`,
    blizko(dist(O, opisannaya(A, B, C).c), 0, 1e-9) && blizko(dist(H, ortocentr(A, B, C)), 0, 1e-9),
  );
  sch.fakt(`${imya}: ∠BAH = ∠OAC`, blizko(ugol(B, A, H), ugol(O, A, C), 1e-6));
}
const ORTOCENTR = {
  id: 'ok-ortocentr',
  b(sch, _rnd, d) {
    const o = { c: [0, 0], r: d.R };
    const h = Math.sqrt(d.R ** 2 - (d.BC / 2) ** 2);
    const B = [-d.BC / 2, -h];
    const C = [d.BC / 2, -h];
    const otvety = [60, 80, 100, 120].map((u) => {
      const A = naOkr(o, u);
      sch.fakt(
        `б) остроугольный, BC = ${d.BC}, R = ${d.R}`,
        ostryy({ A, B, C }) && blizko(dist(B, C), d.BC) && blizko(opisannaya(A, B, C).r, d.R),
      );
      return dist(A, ortocentr(A, B, C));
    });
    sch.fakt(
      'б) AH не зависит от положения A на дуге',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch, d) {
    const p = L().tochkiOrtocentra(t);
    sch.fakt(
      `данные: BC = ${d.BC}, R = ${d.R}, остроугольный`,
      blizko(dist(p.B, p.C), d.BC) && blizko(opisannaya(p.A, p.B, p.C).r, d.R) && ostryy(p),
    );
    return dist(p.A, p.H);
  },
  a(rnd, sch) {
    let t;
    do t = sluchaynyyTreugolnik(rnd, 10);
    while (!ostryy(t));
    proveritOrtocentr(
      sch,
      { ...t, H: ortocentr(t.A, t.B, t.C), O: opisannaya(t.A, t.B, t.C).c },
      'а)',
    );
  },
  scena(t, sch) {
    const p = L().tochkiOrtocentra(t);
    sch.fakt('чертёж: треугольник остроугольный', ostryy(p));
    proveritOrtocentr(sch, { ...p, O: p.O.c }, 'чертёж');
  },
};

/* ok-sekushchie: Секущие PAB и PCD: △PAC ∼ △PDB. */
function proveritSekushchie(sch, { P, A, B, C, D }, imya) {
  const o = opisannaya(A, B, C);
  sch.fakt(
    `${imya}: D на окружности, A между P и B, C между P и D`,
    naOkruzhnosti(o, D) &&
      blizko(dist(P, A) + dist(A, B), dist(P, B)) &&
      blizko(dist(P, C) + dist(C, D), dist(P, D)),
  );
  sch.fakt(`${imya}: ∠PCA = ∠PBD`, blizko(ugol(P, C, A), ugol(P, B, D), 1e-6));
  const k = dist(P, A) / dist(P, D);
  sch.fakt(
    `${imya}: PA/PD = PC/PB = AC/DB`,
    blizko(dist(P, C) / dist(P, B), k) && blizko(dist(A, C) / dist(D, B), k),
  );
}
const SEKUSHCHIE = {
  id: 'ok-sekushchie',
  b(sch, _rnd, d) {
    /* PD из степени точки P; D — на расстоянии PD от P и BD от B, C — на PD в PC от P.
       Проверка: A, B, C, D на одной окружности (иначе PD неверно). */
    const PD = (d.PA * d.PB) / d.PC;
    const P = [0, 0];
    const A = [d.PA, 0];
    const B = [d.PB, 0];
    const D = okrOkr({ c: P, r: PD }, { c: B, r: d.BD })[0];
    const C = mul(D, d.PC / PD);
    sch.fakt(
      'б) по данным точки A, B, C, D на одной окружности',
      naOkruzhnosti(opisannaya(A, B, C), D),
    );
    return dist(A, C);
  },
  nachalo(t, sch, d) {
    const p = L().tochkiSekushchih(t);
    sch.fakt(
      `данные: PA = ${d.PA}, PB = ${d.PB}, PC = ${d.PC}, BD = ${d.BD}`,
      blizko(dist(p.P, p.A), d.PA) &&
        blizko(dist(p.P, p.B), d.PB) &&
        blizko(dist(p.P, p.C), d.PC) &&
        blizko(dist(p.B, p.D), d.BD),
    );
    return dist(p.A, p.C);
  },
  a(rnd, sch) {
    const o = { c: [0, 0], r: 2 + rnd() * 5 };
    const P = polar(rnd() * 360, o.r * (1.2 + rnd() * 2));
    const k = Math.asin(o.r / dist(P, o.c));
    const os = Math.atan2(o.c[1] - P[1], o.c[0] - P[0]);
    const sek = (u) => {
      const d = [Math.cos(u), Math.sin(u)];
      const per = pryamayaOkr(P, add(P, d), o);
      return [per[0].p, per[1].p];
    };
    const [A, B] = sek(os - k * (0.1 + 0.8 * rnd()));
    const [C, D] = sek(os + k * (0.1 + 0.8 * rnd()));
    proveritSekushchie(sch, { P, A, B, C, D }, 'а)');
  },
  scena(t, sch) {
    proveritSekushchie(sch, L().tochkiSekushchih(t), 'чертёж');
  },
};

/* ok-brahmagupta: Вписанный ABCD, AC ⊥ BD в P, M — середина BC, K = MP ∩ AD: MK ⊥ AD; BC² + AD² = 4R². */
function proveritBrahmaguptu(sch, { A, B, C, D, P, M, K }, imya) {
  const o = opisannaya(A, B, C);
  sch.fakt(
    `${imya}: ABCD вписан, AC ⊥ BD, M — середина BC, K на AD и на MP`,
    naOkruzhnosti(o, D) &&
      blizko(skalyar(sub(C, A), sub(D, B)) / (dist(A, C) * dist(B, D)), 0, 1e-9) &&
      blizko(dist(M, mid(B, C)), 0) &&
      naPryamoy(A, D, K) &&
      naPryamoy(M, P, K),
  );
  sch.fakt(
    `${imya}: MK ⊥ AD`,
    Math.abs(skalyar(sub(K, M), sub(D, A))) / (dist(K, M) * dist(D, A)) < 1e-9,
  );
  sch.fakt(`${imya}: BC² + AD² = 4R²`, blizko(dist(B, C) ** 2 + dist(A, D) ** 2, 4 * o.r ** 2));
}
function brahmaguptaSluchaynyy(rnd) {
  const o = { c: [0, 0], r: 5 };
  const P = polar(rnd() * 360, o.r * 0.7 * rnd());
  const u = polar(rnd() * 360);
  const v = povorot90(u);
  const ac = pryamayaOkr(P, add(P, u), o);
  const bd = pryamayaOkr(P, add(P, v), o);
  const A = ac[0].p;
  const C = ac[1].p;
  const D = bd[0].p;
  const B = bd[1].p;
  return { A, B, C, D, P };
}
const BRAHMAGUPTA = {
  id: 'ok-brahmagupta',
  b(sch, _rnd, d) {
    /* Окружность радиуса R = √(BC² + AD²) / 2, перпендикулярные хорды через P: подбираем P так,
       чтобы BC совпало с данным, — тогда и AD совпадает (без тождества из а)). */
    const R5 = Math.sqrt(d.BC ** 2 + d.AD ** 2) / 2;
    const o = { c: [0, 0], r: R5 };
    for (const py of [-0.3, -0.1, 0.1, 0.3].map((k) => k * R5)) {
      const tochki = (px) => {
        const P = [px, py];
        const ac = pryamayaOkr(P, add(P, [1, 0]), o);
        const bd = pryamayaOkr(P, add(P, [0, 1]), o);
        return { A: ac[0].p, C: ac[1].p, D: bd[0].p, B: bd[1].p };
      };
      const xmax = Math.sqrt(R5 * R5 - py * py) - 1e-6;
      const px = koren((x) => dist(tochki(x).B, tochki(x).C) - d.BC, -xmax, xmax);
      const t = tochki(px);
      sch.fakt(
        `б) R = ${R5} и BC = ${d.BC} дают AD = ${d.AD}`,
        blizko(dist(t.B, t.C), d.BC) && blizko(dist(t.A, t.D), d.AD),
      );
    }
    return R5;
  },
  nachalo(t, sch, d) {
    const p = L().tochkiBrahmagupty(t);
    sch.fakt(
      `данные: BC = ${d.BC}, AD = ${d.AD}`,
      blizko(dist(p.B, p.C), d.BC) && blizko(dist(p.A, p.D), d.AD),
    );
    return opisannaya(p.A, p.B, p.C).r;
  },
  a(rnd, sch) {
    const { A, B, C, D, P } = brahmaguptaSluchaynyy(rnd);
    const M = mid(B, C);
    proveritBrahmaguptu(sch, { A, B, C, D, P, M, K: peresech(M, P, A, D) }, 'а)');
  },
  scena(t, sch) {
    proveritBrahmaguptu(sch, L().tochkiBrahmagupty(t), 'чертёж');
  },
};

export const ZADACHI = [ORTOCENTR, SEKUSHCHIE, BRAHMAGUPTA];
