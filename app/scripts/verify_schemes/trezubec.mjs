/* scripts/verify_schemes/trezubec.mjs — «Лемма о трезубце».
   Случайные треугольники: P — инцентр (равноудалён от сторон, внутри),
   Q — эксцентр против A; M на описанной окружности и на прямой AP.
   MB = MC = MP = MQ; M — середина PQ и дуги BC без A; ∠PBQ = 90°;
   углы шага 2: ∠PBM = ∠BPM = α + β. */

import { requireSrc } from '../lib/load-ts.mjs';
import {
  blizko,
  dist,
  opisannaya,
  orient,
  proveritEkran,
  schetchik,
  ugol,
  zerno,
} from './obshchee.mjs';

const doPryamoy = (p, a, b) => Math.abs(orient(a, b, p)) / dist(a, b);

export function proverit(N = 1000) {
  const { TREZUBEC, tochkiTrezubca } = requireSrc('lib/zadanie18/skhemy/trezubec');
  const sch = schetchik('Схема «Лемма о трезубце»');
  const rnd = zerno(18007);
  let n = 0;
  let tesno = 0;
  while (n < N) {
    const t = {
      A: [rnd() * 10 - 2, rnd() * 8 - 2],
      B: [rnd() * 10 - 2, rnd() * 8 - 2],
      C: [rnd() * 10 - 2, rnd() * 8 - 2],
    };
    const u = [ugol(t.B, t.A, t.C), ugol(t.A, t.B, t.C), ugol(t.A, t.C, t.B)];
    if (Math.min(...u) < 5 || Math.min(dist(t.A, t.B), dist(t.B, t.C), dist(t.A, t.C)) < 0.3)
      continue;
    n += 1;
    const { A, B, C, P, Q, M } = tochkiTrezubca(t);
    const o = opisannaya(A, B, C);
    const d = [doPryamoy(P, A, B), doPryamoy(P, B, C), doPryamoy(P, A, C)];
    sch.fakt('построение: P равноудалён от сторон', blizko(d[0], d[1]) && blizko(d[1], d[2]));
    const e = [doPryamoy(Q, A, B), doPryamoy(Q, B, C), doPryamoy(Q, A, C)];
    sch.fakt(
      'построение: Q равноудалён от прямых сторон, по другую сторону BC от A',
      blizko(e[0], e[1]) &&
        blizko(e[1], e[2]) &&
        Math.sign(orient(B, C, Q)) !== Math.sign(orient(B, C, A)),
    );
    sch.fakt(
      'построение: M на окружности и на прямой AP',
      blizko(dist(o.c, M), o.r) && Math.abs(orient(A, P, M)) < 1e-6,
    );
    const mb = dist(M, B);
    sch.fakt(
      'MB = MC = MP = MQ',
      blizko(mb, dist(M, C)) && blizko(mb, dist(M, P)) && blizko(mb, dist(M, Q)),
    );
    sch.fakt(
      'M — середина PQ',
      blizko(dist(P, M) + dist(M, Q), dist(P, Q)) && blizko(dist(P, M), dist(M, Q)),
    );
    sch.fakt(
      'M и A по разные стороны BC (середина дуги без A)',
      Math.sign(orient(B, C, M)) !== Math.sign(orient(B, C, A)),
    );
    sch.fakt('∠PBQ = 90°', blizko(ugol(P, B, Q), 90, 1e-6));
    const al = u[0] / 2;
    const be = u[1] / 2;
    sch.fakt(
      '∠PBM = ∠BPM = α + β',
      blizko(ugol(P, B, M), al + be, 1e-6) && blizko(ugol(B, P, M), al + be, 1e-6),
    );
    sch.fakt('∠BCM = ∠CBM = α', blizko(ugol(B, C, M), al, 1e-6) && blizko(ugol(C, B, M), al, 1e-6));
    if (Math.min(...u) >= 18 && u[0] >= 30) {
      tesno += proveritEkran(
        TREZUBEC,
        t,
        rnd,
        sch,
        [[], ['trezubec'], ['bmc'], ['bmp'], ['pbq'], ['okr-m']][n % 6],
      );
    }
  }
  for (let i = 0; i < 300; i += 1) {
    const t = TREZUBEC.sluchaynaya(rnd);
    sch.fakt(
      'сцена: случайное положение допустимо',
      ['A', 'B', 'C'].every((k) => TREZUBEC.ogranichit(k, t[k], t) !== null),
    );
  }
  sch.fakt(
    'сцена: начальное положение допустимо',
    ['A', 'B', 'C'].every(
      (k) => TREZUBEC.ogranichit(k, TREZUBEC.nachalo[k], TREZUBEC.nachalo) !== null,
    ),
  );
  const plokho = sch.itog();
  console.log(`  подписи в тесноте: ${tesno}`);
  return { plokho };
}

if (import.meta.url === `file://${process.argv[1]}`)
  process.exit(proverit(Number(process.argv[2] ?? 1000)).plokho === 0 ? 0 : 1);
