/* scripts/verify_schemes/vpisannyy.mjs — «Вписанный четырёхугольник».
   Случайные четыре точки на окружности по порядку: ∠A + ∠C = ∠B + ∠D
   = 180°; внешний угол при C = ∠A; ∠BAC = ∠BDC. Обратное: точка C
   внутри / вне круга ABD ⇒ ∠A + ∠C больше / меньше 180°. */

import { requireSrc } from '../lib/load-ts.mjs';
import { blizko, dist, opisannaya, proveritEkran, schetchik, ugol, zerno } from './obshchee.mjs';

export function proverit(N = 1000) {
  const { VPISANNYY } = requireSrc('lib/zadanie18/skhemy/vpisannyy');
  const sch = schetchik('Схема «Вписанный четырёхугольник»');
  const rnd = zerno(18009);
  let tesno = 0;
  for (let n = 0; n < N; n += 1) {
    const t = VPISANNYY.sluchaynaya(rnd);
    const { A, B, C, D } = t;
    sch.fakt('∠A + ∠C = 180°', blizko(ugol(D, A, B) + ugol(B, C, D), 180, 1e-6));
    sch.fakt('∠B + ∠D = 180°', blizko(ugol(A, B, C) + ugol(C, D, A), 180, 1e-6));
    const E = [C[0] + (C[0] - D[0]), C[1] + (C[1] - D[1])];
    sch.fakt('внешний угол при C = ∠A', blizko(ugol(B, C, E), ugol(D, A, B), 1e-6));
    sch.fakt('∠BAC = ∠BDC', blizko(ugol(B, A, C), ugol(B, D, C), 1e-6));
    /* Обратное: сдвигаем C к центру отрезка BD или наружу. */
    const o = opisannaya(A, B, D);
    const k = 0.7 + rnd() * 0.6;
    const C2 = [o.c[0] + (C[0] - o.c[0]) * k, o.c[1] + (C[1] - o.c[1]) * k];
    if (Math.abs(k - 1) > 0.02 && dist(C2, B) > 0.3 && dist(C2, D) > 0.3) {
      const s = ugol(D, A, B) + ugol(B, C2, D);
      sch.fakt('обратное: C внутри ⇒ сумма > 180°, вне ⇒ < 180°', k < 1 ? s > 180 : s < 180);
    }
    tesno += proveritEkran(
      VPISANNYY,
      t,
      rnd,
      sch,
      [[], ['summa'], ['vneshniy'], ['diagonal']][n % 4],
    );
    sch.fakt(
      'сцена: положение допустимо',
      ['A', 'B', 'C', 'D'].every((q) => VPISANNYY.ogranichit(q, t[q], t) !== null),
    );
  }
  const plokho = sch.itog();
  console.log(`  подписи в тесноте: ${tesno}`);
  return { plokho };
}

if (import.meta.url === `file://${process.argv[1]}`)
  process.exit(proverit(Number(process.argv[2] ?? 1000)).plokho === 0 ? 0 : 1);
