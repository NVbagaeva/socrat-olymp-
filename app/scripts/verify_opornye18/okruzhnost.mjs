/* scripts/verify_opornye18/okruzhnost.mjs — задачи 4–6 (тема «Окружность
   и вписанные углы»). Устройство — как в treugolnik.mjs. */

import { requireSrc } from '../lib/load-ts.mjs';
import {
  add,
  blizko,
  delit,
  dist,
  incentr,
  mid,
  mul,
  opisannaya,
  peresech,
  polar,
  poStoronam,
  pryamayaOkr,
  sluchaynyyTreugolnik,
  sub,
  ugol,
} from './obshchee.mjs';

const L = () => requireSrc('lib/zadanie18/opornye/okruzhnost');

/* 4. Трезубец: W — вторая точка биссектрисы AI на описанной окружности. */
function trezubec(A, B, C) {
  const I = incentr(A, B, C);
  const per = pryamayaOkr(A, I, opisannaya(A, B, C));
  const W = per.reduce((x, y) => (y.t > x.t ? y : x)).p;
  return { A, B, C, I, W };
}
function proveritTrezubec(sch, { A, B, C, I, W }, imya) {
  sch.fakt(`${imya}: ∠BAW = ∠WAC`, blizko(ugol(B, A, W), ugol(W, A, C), 1e-6));
  sch.fakt(
    `${imya}: WB = WI = WC`,
    blizko(dist(W, B), dist(W, I)) && blizko(dist(W, C), dist(W, I)),
  );
  const a2 = ugol(B, A, C) / 2;
  const b2 = ugol(A, B, C) / 2;
  sch.fakt(
    `${imya}: ∠WBI = ∠WIB = A/2 + B/2`,
    blizko(ugol(W, B, I), a2 + b2, 1e-6) && blizko(ugol(W, I, B), a2 + b2, 1e-6),
  );
}

const TREZUBEC = {
  id: 'trezubec-incentr',
  b(sch) {
    const otvety = [30, 50, 70, 90].map((uB) => {
      const B = [0, 0];
      const C = [8, 0];
      const A = peresech(B, polar(uB), C, add(C, polar(180 - (120 - uB))));
      const p = trezubec(A, B, C);
      sch.fakt('б) ∠WBC = 30°', blizko(ugol(p.W, B, C), 30, 1e-6));
      return dist(p.W, p.I);
    });
    sch.fakt(
      'б) WI не зависит от углов B и C',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().tochkiTrezubca(t);
    sch.fakt(
      'данные: BC = 8, ∠A = 60°',
      blizko(dist(p.B, p.C), 8) && blizko(ugol(p.B, p.A, p.C), 60),
    );
    sch.fakt('чертёж: I — центр вписанной', dist(p.I, incentr(p.A, p.B, p.C)) < 1e-9);
    return dist(p.W, p.I);
  },
  a(rnd, sch) {
    const { A, B, C } = sluchaynyyTreugolnik(rnd);
    proveritTrezubec(sch, trezubec(A, B, C), 'а)');
  },
  scena(t, sch) {
    const p = L().tochkiTrezubca(t);
    const o = opisannaya(p.A, p.B, p.C);
    sch.fakt('чертёж: W на описанной окружности', blizko(dist(o.c, p.W), o.r));
    proveritTrezubec(sch, p, 'чертёж');
  },
};

/* 5. Квадрат на гипотенузе: CO — биссектриса прямого угла. */
function kvadrat(A, B, C) {
  /* Внешняя сторона: нормаль к AB, направленная от C. */
  const ab = sub(B, A);
  let n = [-ab[1], ab[0]];
  if ((C[0] - A[0]) * n[0] + (C[1] - A[1]) * n[1] > 0) n = mul(n, -1);
  const D = add(B, n);
  const E = add(A, n);
  return { A, B, C, D, E, O: mid(A, D) };
}
function proveritKvadrat(sch, { A, B, C, D, E, O }, imya) {
  sch.fakt(
    `${imya}: ABDE — квадрат вне треугольника, ∠C = 90°`,
    blizko(dist(A, B), dist(B, D)) &&
      blizko(ugol(A, B, D), 90, 1e-7) &&
      blizko(ugol(B, D, E), 90, 1e-7) &&
      blizko(ugol(A, C, B), 90, 1e-7) &&
      dist(C, O) > dist(C, mid(A, B)),
  );
  sch.fakt(
    `${imya}: ∠AOB = 90°, OA = OB`,
    blizko(ugol(A, O, B), 90, 1e-7) && blizko(dist(O, A), dist(O, B)),
  );
  sch.fakt(
    `${imya}: ∠ACO = ∠OCB = 45°`,
    blizko(ugol(A, C, O), 45, 1e-6) && blizko(ugol(O, C, B), 45, 1e-6),
  );
}

const KVADRAT = {
  id: 'kvadrat-na-gipotenuze',
  b() {
    const C = [0, 0];
    return dist(C, kvadrat([6, 0], [0, 8], C).O);
  },
  nachalo(t, sch) {
    const p = L().tochkiKvadrata(t);
    sch.fakt('данные: AC = 6, BC = 8', blizko(dist(p.A, p.C), 6) && blizko(dist(p.B, p.C), 8));
    sch.fakt('б) AO = 5√2', blizko(dist(p.A, p.O), 5 * Math.SQRT2));
    return dist(p.C, p.O);
  },
  a(rnd, sch) {
    const C = [rnd() * 10 - 5, rnd() * 10 - 5];
    const u = rnd() * 360;
    const A = add(C, polar(u, 1 + rnd() * 9));
    const B = add(C, polar(u + (rnd() < 0.5 ? 90 : -90), 1 + rnd() * 9));
    proveritKvadrat(sch, kvadrat(A, B, C), 'а)');
  },
  scena(t, sch) {
    proveritKvadrat(sch, L().tochkiKvadrata(t), 'чертёж');
  },
};

/* 6. Окружность через A и C, K на AB, M на BC: △BMK ∼ △BAC. */
function dveVershiny(A, B, C, K) {
  const per = pryamayaOkr(B, C, opisannaya(A, C, K));
  const M = per.reduce((x, y) => (Math.abs(y.t - 1) > Math.abs(x.t - 1) ? y : x)).p;
  return { A, B, C, K, M };
}
function proveritDve(sch, { A, B, C, K, M }, imya) {
  const k = dist(B, K) / dist(B, C);
  sch.fakt(
    `${imya}: BK/BC = BM/BA = KM/CA`,
    blizko(dist(B, M) / dist(B, A), k) && blizko(dist(K, M) / dist(C, A), k),
  );
  sch.fakt(`${imya}: ∠BKM = ∠BCA`, blizko(ugol(B, K, M), ugol(B, C, A), 1e-6));
}

const DVE_VERSHINY = {
  id: 'okruzhnost-cherez-dve-vershiny',
  b(sch) {
    const { A, B, C } = poStoronam(10, 12, 15);
    const K = delit(B, A, 4, 11);
    const p = dveVershiny(A, B, C, K);
    sch.fakt(
      'б) M на стороне BC, BM = 6',
      blizko(dist(B, p.M) + dist(p.M, C), 10) && blizko(dist(B, p.M), 6),
    );
    return dist(K, p.M);
  },
  nachalo(t, sch) {
    const p = L().tochkiOkrDveVershiny(t);
    sch.fakt(
      'данные: AB = 15, BC = 10, AC = 12, BK = 4',
      blizko(dist(p.A, p.B), 15) &&
        blizko(dist(p.B, p.C), 10) &&
        blizko(dist(p.A, p.C), 12) &&
        blizko(dist(p.B, p.K), 4),
    );
    return dist(p.K, p.M);
  },
  a(rnd, sch) {
    for (;;) {
      const { A, B, C } = sluchaynyyTreugolnik(rnd, 15);
      const p = dveVershiny(A, B, C, delit(B, A, 0.1 + rnd() * 0.8, 1));
      const naStorone = blizko(dist(B, p.M) + dist(p.M, C), dist(B, C), 1e-9);
      if (!naStorone || dist(p.M, C) < 1e-3) continue;
      proveritDve(sch, p, 'а)');
      return;
    }
  },
  scena(t, sch) {
    const p = L().tochkiOkrDveVershiny(t);
    const o = opisannaya(p.A, p.C, p.K);
    sch.fakt(
      'чертёж: K на AB, M на BC и на окружности AKC',
      blizko(dist(p.B, p.K) + dist(p.K, p.A), dist(p.A, p.B)) &&
        blizko(dist(p.B, p.M) + dist(p.M, p.C), dist(p.B, p.C)) &&
        blizko(dist(o.c, p.M), o.r),
    );
    proveritDve(sch, p, 'чертёж');
  },
};

export const ZADACHI = [TREZUBEC, KVADRAT, DVE_VERSHINY];
