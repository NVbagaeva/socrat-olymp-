/* scripts/verify_trenazher18/okruzhnost.mjs — задачи 5–8 тренажёра
   (тема «Окружность и вписанные углы»). Устройство — как в treugolnik.mjs. */

import { requireSrc } from '../lib/load-ts.mjs';
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

const L = () => requireSrc('lib/zadanie18/trenazher/okruzhnost');
const ostryy = ({ A, B, C }) => Math.max(ugol(B, A, C), ugol(A, B, C), ugol(A, C, B)) < 89;
const naOkruzhnosti = (o, ...pts) => pts.every((p) => blizko(dist(o.c, p), o.r, 1e-7));

/* 5. Хорды AB и CD пересекаются в P: △APC ∼ △DPB. */
function proveritHordy(sch, { A, B, C, D, P }, imya) {
  const o = opisannaya(A, B, C);
  sch.fakt(
    `${imya}: A, B, C, D на окружности; P = AB ∩ CD внутри хорд`,
    naOkruzhnosti(o, D) &&
      blizko(dist(A, P) + dist(P, B), dist(A, B)) &&
      blizko(dist(C, P) + dist(P, D), dist(C, D)),
  );
  sch.fakt(
    `${imya}: ∠PAC = ∠PDB, ∠APC = ∠DPB`,
    blizko(ugol(P, A, C), ugol(P, D, B), 1e-6) && blizko(ugol(A, P, C), ugol(D, P, B), 1e-6),
  );
  const k = dist(A, P) / dist(D, P);
  sch.fakt(
    `${imya}: AP/DP = CP/BP = AC/DB`,
    blizko(dist(C, P) / dist(B, P), k) && blizko(dist(A, C) / dist(D, B), k),
  );
}
const HORDY = {
  id: 'ok-hordy',
  b(sch) {
    const otvety = [35, 65, 100, 140].map((u) => {
      const P = [0, 0];
      const A = [-6, 0];
      const B = [4, 0];
      const C = polar(180 + u, 3);
      const o = opisannaya(A, B, C);
      /* Вторая точка прямой CP на окружности. */
      const per = pryamayaOkr(C, P, o).filter((x) => x.t > 1.0001);
      const D = per[0].p;
      sch.fakt('б) D на окружности за P', naOkruzhnosti(o, D) && naPryamoy(C, P, D));
      return dist(P, D);
    });
    sch.fakt(
      'б) PD не зависит от угла между хордами',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().tochkiHord(t);
    sch.fakt(
      'данные: AP = 6, PB = 4, CP = 3',
      blizko(dist(p.A, p.P), 6) && blizko(dist(p.P, p.B), 4) && blizko(dist(p.C, p.P), 3),
    );
    sch.fakt('чертёж: D на окружности', naOkruzhnosti(opisannaya(p.A, p.B, p.C), p.D));
    return dist(p.P, p.D);
  },
  a(rnd, sch) {
    const o = { c: [rnd() * 4, rnd() * 4], r: 3 + rnd() * 6 };
    const a = rnd() * 360;
    const c = a + 20 + rnd() * 130;
    const b = c + 20 + rnd() * (340 - (c - a) - 40);
    const d = b + 10 + rnd() * (360 - (b - a) - 20);
    const A = naOkr(o, a);
    const C = naOkr(o, c);
    const B = naOkr(o, b);
    const D = naOkr(o, d);
    proveritHordy(sch, { A, B, C, D, P: peresech(A, B, C, D) }, 'а)');
  },
  scena(t, sch) {
    proveritHordy(sch, L().tochkiHord(t), 'чертёж');
  },
};

/* 6. O — центр описанной, H — ортоцентр: ∠BAH = ∠OAC; AH = 2R cos A. */
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
  b(sch) {
    const o = { c: [0, 0], r: 5 };
    const B = [-4, -3];
    const C = [4, -3];
    const otvety = [50, 80, 100, 130].map((u) => {
      const A = naOkr(o, u);
      sch.fakt(
        'б) остроугольный, BC = 8, R = 5',
        ostryy({ A, B, C }) && blizko(dist(B, C), 8) && blizko(opisannaya(A, B, C).r, 5),
      );
      return dist(A, ortocentr(A, B, C));
    });
    sch.fakt(
      'б) AH не зависит от положения A на дуге',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().tochkiOrtocentra(t);
    sch.fakt(
      'данные: BC = 8, R = 5, остроугольный',
      blizko(dist(p.B, p.C), 8) && blizko(opisannaya(p.A, p.B, p.C).r, 5) && ostryy(p),
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

/* 7. Секущие PAB и PCD: △PAC ∼ △PDB. */
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
  b(sch) {
    /* D — на расстоянии 12 и от P, и от B; C — на PD в 3 от P. */
    const P = [0, 0];
    const A = [4, 0];
    const B = [9, 0];
    const D = okrOkr({ c: P, r: 12 }, { c: B, r: 12 })[0];
    const C = mul(D, 3 / 12);
    sch.fakt(
      'б) по данным точки A, B, C, D на одной окружности',
      naOkruzhnosti(opisannaya(A, B, C), D),
    );
    return dist(A, C);
  },
  nachalo(t, sch) {
    const p = L().tochkiSekushchih(t);
    sch.fakt(
      'данные: PA = 4, PB = 9, PC = 3, BD = 12',
      blizko(dist(p.P, p.A), 4) &&
        blizko(dist(p.P, p.B), 9) &&
        blizko(dist(p.P, p.C), 3) &&
        blizko(dist(p.B, p.D), 12),
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

/* 8. Вписанный ABCD, AC ⊥ BD в P, M — середина BC, K = MP ∩ AD: MK ⊥ AD; BC² + AD² = 4R². */
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
  b(sch) {
    /* Окружность радиуса 5, перпендикулярные хорды через P: подбираем P так, чтобы BC = 6, —
       тогда AD = 8 сам собой (без тождества из а)). */
    const o = { c: [0, 0], r: 5 };
    for (const py of [-2, -0.5, 1, 2.5]) {
      const tochki = (px) => {
        const P = [px, py];
        const ac = pryamayaOkr(P, add(P, [1, 0]), o);
        const bd = pryamayaOkr(P, add(P, [0, 1]), o);
        return { A: ac[0].p, C: ac[1].p, D: bd[0].p, B: bd[1].p };
      };
      const xmax = Math.sqrt(25 - py * py) - 1e-6;
      const px = koren((x) => dist(tochki(x).B, tochki(x).C) - 6, -xmax, xmax);
      const t = tochki(px);
      sch.fakt(
        'б) R = 5 и BC = 6 дают AD = 8',
        blizko(dist(t.B, t.C), 6) && blizko(dist(t.A, t.D), 8),
      );
    }
    return 5;
  },
  nachalo(t, sch) {
    const p = L().tochkiBrahmagupty(t);
    sch.fakt('данные: BC = 6, AD = 8', blizko(dist(p.B, p.C), 6) && blizko(dist(p.A, p.D), 8));
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

export const ZADACHI = [HORDY, ORTOCENTR, SEKUSHCHIE, BRAHMAGUPTA];
