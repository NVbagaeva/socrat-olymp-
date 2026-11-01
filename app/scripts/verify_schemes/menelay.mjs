/* scripts/verify_schemes/menelay.mjs — теоремы Менелая и Чевы.
   Менелай: B₁ на прямой C₁A₁ и на продолжении AC; произведение = 1;
   шаги доказательства через точку T (CT ∥ AB). Обратная: точка на
   продолжении AC с тем же отношением совпадает с B₁. Чева: A₂, B₂, C₂
   на сторонах, произведение = 1, отношения равны отношениям площадей.
   Обратная Чевы: чевианы с произведением 1 пересекаются в одной точке. */

import { requireSrc } from '../lib/load-ts.mjs';
import { blizko, dist, orient, proveritEkran, schetchik, zerno } from './obshchee.mjs';

const S = (a, b, c) => Math.abs(orient(a, b, c)) / 2;
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function peresech(a, b, c, d) {
  const r = [b[0] - a[0], b[1] - a[1]];
  const s = [d[0] - c[0], d[1] - c[1]];
  const den = r[0] * s[1] - r[1] * s[0];
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den;
  return [a[0] + r[0] * t, a[1] + r[1] * t];
}

export function proverit(N = 1000) {
  const { MENELAY, tochkiMenelaya } = requireSrc('lib/zadanie18/skhemy/menelay');
  const sch = schetchik('Схема «Теоремы Менелая и Чевы»');
  const rnd = zerno(18019);
  let tesno = 0;
  for (let n = 0; n < N; n += 1) {
    const t = MENELAY.sluchaynaya(rnd);
    const { A, B, C, C1, A1, B1, P, A2, B2, C2 } = tochkiMenelaya(t);
    sch.fakt(
      'построение: B₁ на прямой C₁A₁, вне отрезка AC',
      Math.abs(orient(C1, A1, B1)) < 1e-6 &&
        Math.abs(orient(A, C, B1)) < 1e-6 &&
        !blizko(dist(A, B1) + dist(B1, C), dist(A, C)),
    );
    const men =
      (dist(A, C1) / dist(C1, B)) * (dist(B, A1) / dist(A1, C)) * (dist(C, B1) / dist(B1, A));
    sch.fakt('Менелай: произведение = 1', blizko(men, 1));
    const T = peresech(C, [C[0] + B[0] - A[0], C[1] + B[1] - A[1]], C1, A1);
    sch.fakt(
      'доказательство: BA₁/A₁C = C₁B/CT и CB₁/B₁A = CT/AC₁',
      blizko(dist(B, A1) / dist(A1, C), dist(C1, B) / dist(C, T)) &&
        blizko(dist(C, B1) / dist(B1, A), dist(C, T) / dist(A, C1)),
    );
    /* Обратная: точка X на продолжении AC с CX/XA = CB₁/B₁A совпадает с B₁. */
    const q = dist(C, B1) / dist(B1, A);
    /* X = A + s(C − A) вне отрезка: CX/XA = q даёт s = 1/(1 − q) в обоих случаях. */
    const X = lerp(A, C, 1 / (1 - q));
    sch.fakt('обратная Менелая: точка с тем же отношением = B₁', dist(X, B1) < 1e-6);
    const che =
      (dist(A, C2) / dist(C2, B)) * (dist(B, A2) / dist(A2, C)) * (dist(C, B2) / dist(B2, A));
    sch.fakt(
      'Чева: A₂, B₂, C₂ на сторонах',
      blizko(dist(B, A2) + dist(A2, C), dist(B, C)) &&
        blizko(dist(A, B2) + dist(B2, C), dist(A, C)) &&
        blizko(dist(A, C2) + dist(C2, B), dist(A, B)),
    );
    sch.fakt('Чева: произведение = 1', blizko(che, 1));
    sch.fakt(
      'Чева: AC₂/C₂B = S(APC)/S(BPC)',
      blizko(dist(A, C2) / dist(C2, B), S(A, P, C) / S(B, P, C)),
    );
    /* Обратная Чевы: берём A₂, B₂ случайно, C₂ из условия произведения = 1 — чевианы пересекаются в одной точке. */
    const ta = 0.2 + rnd() * 0.6;
    const tb = 0.2 + rnd() * 0.6;
    const a2 = lerp(B, C, ta);
    const b2 = lerp(C, A, tb);
    const x = 1 / ((ta / (1 - ta)) * (tb / (1 - tb)));
    const c2 = lerp(A, B, x / (1 + x));
    const p1 = peresech(A, a2, B, b2);
    sch.fakt(
      'обратная Чевы: CC₂ проходит через точку AA₂ ∩ BB₂',
      Math.abs(orient(C, c2, p1)) < 1e-6,
    );
    if (n < 300)
      tesno += proveritEkran(
        MENELAY,
        t,
        rnd,
        sch,
        [[], ['menelay'], ['menelay-dok'], ['cheva'], ['cheva-dok']][n % 5],
      );
    sch.fakt(
      'сцена: случайное положение допустимо',
      MENELAY.podvizhnye.every((k) => MENELAY.ogranichit(k, t[k], t) !== null),
    );
  }
  sch.fakt(
    'сцена: начальное положение допустимо',
    MENELAY.podvizhnye.every(
      (k) => MENELAY.ogranichit(k, MENELAY.nachalo[k], MENELAY.nachalo) !== null,
    ),
  );
  const plokho = sch.itog();
  console.log(`  подписи в тесноте: ${tesno} на 300 экранах`);
  return { plokho };
}

if (import.meta.url === `file://${process.argv[1]}`)
  process.exit(proverit(Number(process.argv[2] ?? 1000)).plokho === 0 ? 0 : 1);
