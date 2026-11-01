/* scripts/verify_schemes/stepenTochki.mjs — «Степень точки».
   Для случайных M (внутри и вне) и случайных прямых через M:
   MA·MB = |MO² − R²|; вне — MT² = MO² − R², OT ⊥ MT; через центр —
   MU·MV = |d² − R²|; две разные прямые дают одно произведение. */

import { requireSrc } from '../lib/load-ts.mjs';
import { blizko, dist, orient, proveritEkran, schetchik, skal, zerno } from './obshchee.mjs';

export function proverit(N = 1000) {
  const { STEPEN_TOCHKI, tochkiStepeni } = requireSrc('lib/zadanie18/skhemy/stepenTochki');
  const sch = schetchik('Схема «Степень точки»');
  const rnd = zerno(18024);
  const O = [0, 0];
  const R = 3;
  let tesno = 0;
  let vne = 0;
  for (let n = 0; n < N; n += 1) {
    const t = STEPEN_TOCHKI.sluchaynaya(rnd);
    const s = tochkiStepeni(t);
    const st = s.d * s.d - R * R;
    if (s.vne) vne += 1;
    sch.fakt(
      'A, B на окружности и на прямой MP',
      blizko(dist(O, s.A), R) && blizko(dist(O, s.B), R) && Math.abs(orient(s.M, s.A, s.B)) < 1e-6,
    );
    sch.fakt('MA·MB = |MO² − R²|', blizko(dist(s.M, s.A) * dist(s.M, s.B), Math.abs(st)));
    sch.fakt(
      'через центр: MU·MV = |d² − R²|',
      blizko(dist(s.M, s.U) * dist(s.M, s.V), Math.abs(st)),
    );
    if (s.vne)
      sch.fakt(
        'вне: MT² = MO² − R², OT ⊥ MT',
        blizko(dist(s.M, s.T) ** 2, st) && Math.abs(skal(O, s.T, s.M, s.T)) < 1e-6,
      );
    /* Другая прямая через M — то же произведение. */
    const t2 = { ...t, P: [R * Math.cos(n), R * Math.sin(n)] };
    if (STEPEN_TOCHKI.ogranichit('P', t2.P, t) !== null) {
      const s2 = tochkiStepeni(t2);
      sch.fakt(
        'две прямые через M — одно произведение',
        blizko(dist(s.M, s.A) * dist(s.M, s.B), dist(s2.M, s2.A) * dist(s2.M, s2.B)),
      );
    }
    if (n < 300)
      tesno += proveritEkran(
        STEPEN_TOCHKI,
        t,
        rnd,
        sch,
        [[], ['opredelenie'], ['proizv'], ['kasatelnaya'], ['diametr']][n % 5],
      );
    sch.fakt(
      'сцена: случайное положение допустимо',
      ['M', 'P'].every((k) => STEPEN_TOCHKI.ogranichit(k, t[k], t) !== null),
    );
  }
  sch.fakt(
    'сцена: начальное положение допустимо',
    ['M', 'P'].every(
      (k) => STEPEN_TOCHKI.ogranichit(k, STEPEN_TOCHKI.nachalo[k], STEPEN_TOCHKI.nachalo) !== null,
    ),
  );
  const plokho = sch.itog();
  console.log(`  M вне: ${vne} из ${N}; подписи в тесноте: ${tesno} на 300 экранах`);
  return { plokho };
}

if (import.meta.url === `file://${process.argv[1]}`)
  process.exit(proverit(Number(process.argv[2] ?? 1000)).plokho === 0 ? 0 : 1);
