/* scripts/verify_schemes/sredlin.mjs — средние линии треугольника и трапеции.
   Треугольник: MN ∥ AC, MN = AC/2, △MBN ∼ △ABC (k = 1/2, площадь 1/4),
   прямая через M ∥ AC пересекает BC в середине (признак), N₁ ≠ N даёт
   непараллельную MN₁; четыре треугольника равны.
   Трапеция: MN ∥ AD, MN = (AD + BC)/2; △BCN = △EDN, DE = BC, N —
   середина BE; признак; KL = (AD − BC)/2; сцена держит BC ∥ AD. */

import { requireSrc } from '../lib/load-ts.mjs';
import { blizko, dist, mid, orient, proveritEkran, schetchik, zerno } from './obshchee.mjs';

const parall = (a, b, c, d) =>
  Math.abs(orient([0, 0], [b[0] - a[0], b[1] - a[1]], [d[0] - c[0], d[1] - c[1]])) <
  1e-6 * (dist(a, b) * dist(c, d) + 1);
const ploshchad = (a, b, c) => Math.abs(orient(a, b, c)) / 2;

export function proverit(N = 1000) {
  const { SREDLIN_TREUG, tochkiSredlinTreug } = requireSrc('lib/zadanie18/skhemy/sredlinTreug');
  const { SREDLIN_TRAP, tochkiSredlinTrap } = requireSrc('lib/zadanie18/skhemy/sredlinTrap');
  const sch = schetchik('Схемы «Средняя линия треугольника» и «трапеции»');
  const rnd = zerno(18010);
  let tesno = 0;
  for (let n = 0; n < N; n += 1) {
    const t = SREDLIN_TREUG.sluchaynaya(rnd);
    const { A, B, C, M, N: Nn, K, N1 } = tochkiSredlinTreug(t);
    sch.fakt('тр.: MN ∥ AC, MN = AC/2', parall(M, Nn, A, C) && blizko(dist(M, Nn), dist(A, C) / 2));
    sch.fakt('тр.: S(MBN) = S(ABC)/4', blizko(ploshchad(M, B, Nn), ploshchad(A, B, C) / 4));
    /* Признак: пересечение прямой через M ∥ AC с BC — середина BC. */
    const d = [C[0] - A[0], C[1] - A[1]];
    const den = orient([0, 0], d, [C[0] - B[0], C[1] - B[1]]);
    const s = orient([0, 0], [B[0] - M[0], B[1] - M[1]], [C[0] - B[0], C[1] - B[1]]) / den;
    const X = [M[0] + d[0] * s, M[1] + d[1] * s];
    sch.fakt(
      'тр.: признак — прямая через M ∥ AC проходит через середину BC',
      blizko(dist(X, Nn), 0, 1e-6) || dist(X, Nn) < 1e-7,
    );
    sch.fakt('тр.: MN₁ не параллельна AC при N₁ ≠ N', !parall(M, N1, A, C));
    const st = [dist(M, Nn), dist(Nn, K), dist(K, M)].sort((a, b) => a - b);
    const bol = [dist(A, B), dist(B, C), dist(A, C)].map((x) => x / 2).sort((a, b) => a - b);
    sch.fakt(
      'тр.: четыре треугольника равны (стороны — половины сторон)',
      st.every((x, i) => blizko(x, bol[i])) && blizko(ploshchad(A, M, K), ploshchad(M, Nn, K)),
    );
    if (n < 300)
      tesno += proveritEkran(
        SREDLIN_TREUG,
        t,
        rnd,
        sch,
        [[], ['opredelenie'], ['svoystvo'], ['podobie'], ['priznak', 'protivnoe'], ['chetyre']][
          n % 6
        ],
      );

    const q = SREDLIN_TRAP.sluchaynaya(rnd);
    const T = tochkiSredlinTrap(q);
    const ad = dist(T.A, T.D);
    const bc = dist(T.B, T.C);
    sch.fakt('трап.: BC ∥ AD в сцене', parall(T.B, T.C, T.A, T.D));
    sch.fakt(
      'трап.: MN ∥ AD, MN = (AD + BC)/2',
      parall(T.M, T.N, T.A, T.D) && blizko(dist(T.M, T.N), (ad + bc) / 2),
    );
    sch.fakt(
      'трап.: DE = BC, N — середина BE',
      (blizko(dist(T.D, T.E), bc) && blizko(dist(mid(T.B, T.E), T.N), 0, 1e-6)) ||
        dist(mid(T.B, T.E), T.N) < 1e-7,
    );
    sch.fakt('трап.: KL = (AD − BC)/2', blizko(dist(T.K, T.L), (ad - bc) / 2));
    sch.fakt(
      'трап.: K, L — середины AC и BD',
      dist(T.K, mid(T.A, T.C)) < 1e-7 && dist(T.L, mid(T.B, T.D)) < 1e-7,
    );
    sch.fakt('трап.: MN₁ не параллельна AD', !parall(T.M, T.N1, T.A, T.D));
    const qa = SREDLIN_TRAP.ogranichit('A', [q.A[0] + rnd() - 0.5, q.A[1] + rnd() - 0.5], q);
    if (qa !== null) {
      const s2 = SREDLIN_TRAP.prisposobit({ ...q, A: qa }, q, 'A');
      if (s2 !== null)
        sch.fakt('трап.: тянем A — BC остаётся параллельной AD', parall(s2.B, s2.C, s2.A, s2.D));
    }
    if (n < 300)
      tesno += proveritEkran(
        SREDLIN_TRAP,
        q,
        rnd,
        sch,
        [[], ['opredelenie'], ['svoystvo', 'dok'], ['priznak', 'protivnoe'], ['diagonali']][n % 5],
      );
  }
  const plokho = sch.itog();
  console.log(`  подписи в тесноте: ${tesno} на 600 экранах`);
  return { plokho };
}

if (import.meta.url === `file://${process.argv[1]}`)
  process.exit(proverit(Number(process.argv[2] ?? 1000)).plokho === 0 ? 0 : 1);
