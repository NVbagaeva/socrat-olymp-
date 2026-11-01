/* scripts/verify_schemes/ravnyeUgly.mjs — схема «Общая сторона и равные углы».

   1) Прямое утверждение на N случайных конфигурациях, построенных
      независимо от сцены: B — случайная точка, M — точка по ту же
      сторону с ∠AMC = ∠ABC (на луче из A под случайным углом, через
      решение уравнения на угол). Проверяется: M на окружности ABC;
      R = AC / (2 sin φ); ∠BAM = ∠BCM; центр по ту же сторону от AC,
      что B, ⇔ φ < 90°.
   2) ГМТ и неравенство: случайная точка X по ту же сторону — ∠AXC
      больше φ внутри круга, меньше снаружи.
   3) Сцена: случайные положения карточки — M на окружности;
      перетаскивание B с приспособлением оставляет M на окружности.

   Запуск: node scripts/verify_schemes/ravnyeUgly.mjs [N] */

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

/* Точка на луче из A под углом beta (рад) от AC, видящая AC под углом phi:
   по теореме синусов в △AXC: AX = AC·sin(π − beta − phi)/sin(phi). */
function tochkaPodUglom(A, C, beta, phi, znak) {
  const ac = dist(A, C);
  const gamma = Math.PI - beta - phi;
  if (gamma <= 0.05) return null;
  const ax = (ac * Math.sin(gamma)) / Math.sin(phi);
  const u = [(C[0] - A[0]) / ac, (C[1] - A[1]) / ac];
  const c = Math.cos(beta);
  const s = Math.sin(beta) * znak;
  return [A[0] + ax * (u[0] * c - u[1] * s), A[1] + ax * (u[0] * s + u[1] * c)];
}

export function proverit(N = 1000) {
  const { RAVNYE_UGLY, polozhenieM } = requireSrc('lib/zadanie18/skhemy/ravnyeUgly');
  const sch = schetchik('Схема «Общая сторона и равные углы»');
  const rnd = zerno(18005);
  let n = 0;
  while (n < N) {
    const A = [rnd() * 8 - 2, rnd() * 6 - 2];
    const C = [rnd() * 8 - 2, rnd() * 6 - 2];
    const B = [rnd() * 8 - 2, rnd() * 6 - 2];
    if (dist(A, C) < 0.5 || Math.abs(orient(A, C, B)) / dist(A, C) < 0.2) continue;
    const phi = (ugol(A, B, C) * Math.PI) / 180;
    if (phi < 0.1 || phi > Math.PI - 0.1) continue;
    const znak = Math.sign(orient(A, C, B));
    const M = tochkaPodUglom(A, C, 0.05 + rnd() * (Math.PI - phi - 0.15), phi, znak);
    if (M === null || dist(M, B) < 0.05) continue;
    n += 1;
    const tag = `A=${A.map((x) => x.toFixed(3))} B=${B.map((x) => x.toFixed(3))} C=${C.map((x) => x.toFixed(3))}`;
    const o = opisannaya(A, B, C);
    sch.fakt(
      'построение проверки: ∠AMC = ∠ABC, M по ту же сторону',
      blizko(ugol(A, M, C), ugol(A, B, C), 1e-6) && Math.sign(orient(A, C, M)) === znak,
      tag,
    );
    sch.fakt('M на окружности ABC', blizko(dist(o.c, M), o.r, 1e-6), tag);
    sch.fakt('R = AC / (2 sin φ)', blizko(o.r, dist(A, C) / (2 * Math.sin(phi))), tag);
    sch.fakt('∠BAM = ∠BCM', blizko(ugol(B, A, M), ugol(B, C, M), 1e-5), tag);
    const storonaO = Math.sign(orient(A, C, o.c));
    if (Math.abs(phi - Math.PI / 2) > 1e-3) {
      sch.fakt(
        'центр с той же стороны, что B, ⇔ φ острый',
        (storonaO === znak) === phi < Math.PI / 2,
        tag,
      );
    }
    /* Случайная точка X по ту же сторону: внутри — больше, вне — меньше. */
    const X = [rnd() * 12 - 4, rnd() * 10 - 4];
    if (Math.sign(orient(A, C, X)) === znak && Math.abs(dist(X, o.c) - o.r) > 1e-3) {
      const uX = ugol(A, X, C);
      const uB = ugol(A, B, C);
      sch.fakt('X внутри круга ⇔ ∠AXC > ∠ABC', dist(X, o.c) < o.r === uX > uB, tag);
    }
  }
  /* Сцена. */
  let tesno = 0;
  for (let i = 0; i < 400; i += 1) {
    const t = RAVNYE_UGLY.sluchaynaya(rnd);
    sch.fakt('сцена: случайное положение — M на окружности', polozhenieM(t) === 'na');
    sch.fakt(
      'сцена: случайное положение допустимо',
      ['A', 'B', 'C', 'M'].every((k) => RAVNYE_UGLY.ogranichit(k, t[k], t) !== null),
    );
    sch.fakt('сцена: углы при B и M равны', blizko(ugol(t.A, t.B, t.C), ugol(t.A, t.M, t.C), 1e-6));
    /* Тянем B: если положение принято, M остаётся на окружности. */
    const B2 = [t.B[0] + (rnd() - 0.5) * 0.8, t.B[1] + (rnd() - 0.5) * 0.8];
    const q = RAVNYE_UGLY.ogranichit('B', B2, t);
    if (q !== null) {
      const s = RAVNYE_UGLY.prisposobit({ ...t, B: q }, t, 'B');
      if (s !== null)
        sch.fakt('сцена: тянем B — M остаётся на окружности', polozhenieM(s) === 'na');
    }
    const lit = [[], ['okr'], ['radius'], ['vpisannye'], ['gmt'], ['sinusy']][i % 6];
    tesno += proveritEkran(RAVNYE_UGLY, t, rnd, sch, lit);
  }
  sch.fakt(
    'начальное положение допустимо, M на окружности',
    polozhenieM(RAVNYE_UGLY.nachalo) === 'na' &&
      ['A', 'B', 'C', 'M'].every(
        (k) => RAVNYE_UGLY.ogranichit(k, RAVNYE_UGLY.nachalo[k], RAVNYE_UGLY.nachalo) !== null,
      ),
  );
  const plokho = sch.itog();
  console.log(`  подписи в тесноте: ${tesno} на 400 экранах`);
  return { plokho, tesno, ekranov: 400 };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(proverit(Number(process.argv[2] ?? 1000)).plokho === 0 ? 0 : 1);
}
