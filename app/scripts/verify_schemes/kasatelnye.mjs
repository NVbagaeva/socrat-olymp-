/* scripts/verify_schemes/kasatelnye.mjs — схемы 12–15 (касательные).
   12: T на окружности, OT ⊥ MT, ∠MTB = ∠TAB = ∠TOB/2, △MTB ∼ △MAT, MT² = MA·MB.
   13: AK = AN, BK = BL, CL = CN; AK = p − BC; AK₁ = AN₁ = p; описанный
       четырёхугольник (случайный, касательный по построению): AB + CD = BC + AD.
   14: O₁, T, O₂ на прямой, T на обеих окружностях, O₁O₂ = R ± r.
   15: M, N — точки касания общей прямой (радиусы ⊥ MN), MN = √(a² − (R − r)²),
       PQ = √(a² − (R + r)²), O₁, O₂ по разные стороны PQ. */

import { requireSrc } from '../lib/load-ts.mjs';
import { blizko, dist, orient, proveritEkran, schetchik, skal, ugol, zerno } from './obshchee.mjs';

export function proverit(N = 1000) {
  const { KASATELNAYA, tochkiKasatelnoy } = requireSrc('lib/zadanie18/skhemy/kasatelnaya');
  const { OTREZKI_KASATELNYH, tochkiKasatelnyh } = requireSrc(
    'lib/zadanie18/skhemy/otrezkiKasatelnyh',
  );
  const { KASAYUSHCHIESYA, tochkiKasaniya } = requireSrc('lib/zadanie18/skhemy/kasayushchiesya');
  const { OBSHCHAYA_KASATELNAYA, tochkiObshchey } = requireSrc(
    'lib/zadanie18/skhemy/obshchayaKasatelnaya',
  );
  const sch = schetchik('Схемы 12–15 «Касательные»');
  const rnd = zerno(18012);
  let tesno = 0;
  const O = [0, 0];
  for (let n = 0; n < N; n += 1) {
    const ekran = n < 200;
    /* 12 */
    const t = KASATELNAYA.sluchaynaya(rnd);
    const { M, A, B, T } = tochkiKasatelnoy(t);
    sch.fakt(
      '12: T на окружности, OT ⊥ MT',
      blizko(dist(O, T), 3) && Math.abs(skal(O, T, M, T)) < 1e-6,
    );
    sch.fakt(
      '12: ∠MTB = ∠TAB = ∠TOB/2',
      blizko(ugol(M, T, B), ugol(T, A, B), 1e-6) && blizko(ugol(M, T, B), ugol(T, O, B) / 2, 1e-6),
    );
    sch.fakt(
      '12: △MTB ∼ △MAT',
      blizko(dist(M, T) / dist(M, A), dist(M, B) / dist(M, T)) &&
        blizko(dist(T, B) / dist(A, T), dist(M, T) / dist(M, A)),
    );
    sch.fakt('12: MT² = MA·MB', blizko(dist(M, T) ** 2, dist(M, A) * dist(M, B)));
    if (ekran)
      tesno += proveritEkran(
        KASATELNAYA,
        t,
        rnd,
        sch,
        [[], ['radius'], ['ugol'], ['podobie'], ['kvadrat']][n % 5],
      );
    /* 13 */
    const s = OTREZKI_KASATELNYH.sluchaynaya(rnd);
    const k = tochkiKasatelnyh(s);
    const p = (dist(k.A, k.B) + dist(k.B, k.C) + dist(k.A, k.C)) / 2;
    sch.fakt(
      '13: K, L, N на сторонах и на вписанной окружности',
      [k.K, k.L, k.N].every((x) => blizko(dist(x, k.I), k.r)) &&
        blizko(dist(k.A, k.K) + dist(k.K, k.B), dist(k.A, k.B)),
    );
    sch.fakt(
      '13: AK = AN, BK = BL, CL = CN',
      blizko(dist(k.A, k.K), dist(k.A, k.N)) &&
        blizko(dist(k.B, k.K), dist(k.B, k.L)) &&
        blizko(dist(k.C, k.L), dist(k.C, k.N)),
    );
    sch.fakt('13: AK = p − BC', blizko(dist(k.A, k.K), p - dist(k.B, k.C)));
    sch.fakt(
      '13: AK₁ = AN₁ = p, K₁ на продолжении AB за B',
      blizko(dist(k.A, k.K1), p) &&
        blizko(dist(k.A, k.N1), p) &&
        blizko(dist(k.A, k.B) + dist(k.B, k.K1), dist(k.A, k.K1)),
    );
    if (ekran)
      tesno += proveritEkran(
        OTREZKI_KASATELNYH,
        s,
        rnd,
        sch,
        [[], ['ravnye'], ['p-bc'], ['vnevp']][n % 4],
      );
    /* 13: описанный четырёхугольник — касательные к единичной окружности в четырёх точках. */
    const ug4 = [0, 1, 2, 3].map((i) => (i * Math.PI) / 2 + (rnd() - 0.5) * 1.2);
    const kas = (a, b) => {
      /* Пересечение касательных в точках с углами a и b: r / cos((b − a)/2) в направлении (a + b)/2. */
      const m = (a + b) / 2;
      const d = 1 / Math.cos((b - a) / 2);
      return [d * Math.cos(m), d * Math.sin(m)];
    };
    const Q = [
      kas(ug4[3] - 2 * Math.PI, ug4[0]),
      kas(ug4[0], ug4[1]),
      kas(ug4[1], ug4[2]),
      kas(ug4[2], ug4[3]),
    ];
    sch.fakt(
      '13: описанный четырёхугольник: AB + CD = BC + AD',
      blizko(dist(Q[0], Q[1]) + dist(Q[2], Q[3]), dist(Q[1], Q[2]) + dist(Q[3], Q[0])),
    );
    /* 14 */
    const u = KASAYUSHCHIESYA.sluchaynaya(rnd);
    const c = tochkiKasaniya(u);
    sch.fakt('14: O₁, T, O₂ на прямой', Math.abs(orient(c.O1, c.O2, c.T)) < 1e-6);
    sch.fakt(
      '14: T на обеих окружностях',
      blizko(dist(c.O1, c.T), c.R) && blizko(dist(c.O2, c.T), c.r),
    );
    sch.fakt(
      '14: O₁O₂ = R + r (внешнее) или R − r (внутреннее)',
      blizko(c.d, c.vneshnee ? c.R + c.r : c.R - c.r),
    );
    if (ekran)
      tesno += proveritEkran(
        KASAYUSHCHIESYA,
        u,
        rnd,
        sch,
        [[], ['pryamaya'], ['rasstoyanie'], ['kasatelnaya']][n % 4],
      );
    /* 15 */
    const w = OBSHCHAYA_KASATELNAYA.sluchaynaya(rnd);
    const g = tochkiObshchey(w);
    sch.fakt(
      '15: M, N на окружностях, радиусы ⊥ MN',
      blizko(dist(g.O1, g.M), g.R) &&
        blizko(dist(g.O2, g.N), g.r) &&
        Math.abs(skal(g.O1, g.M, g.M, g.N)) < 1e-6 &&
        Math.abs(skal(g.O2, g.N, g.M, g.N)) < 1e-6,
    );
    sch.fakt(
      '15: MN = √(a² − (R − r)²)',
      blizko(dist(g.M, g.N), Math.sqrt(g.a ** 2 - (g.R - g.r) ** 2)),
    );
    sch.fakt(
      '15: P, Q на окружностях, радиусы ⊥ PQ, центры по разные стороны',
      blizko(dist(g.O1, g.P), g.R) &&
        blizko(dist(g.O2, g.Q), g.r) &&
        Math.abs(skal(g.O1, g.P, g.P, g.Q)) < 1e-6 &&
        Math.abs(skal(g.O2, g.Q, g.P, g.Q)) < 1e-6 &&
        Math.sign(orient(g.P, g.Q, g.O1)) !== Math.sign(orient(g.P, g.Q, g.O2)),
    );
    sch.fakt(
      '15: PQ = √(a² − (R + r)²)',
      blizko(dist(g.P, g.Q), Math.sqrt(g.a ** 2 - (g.R + g.r) ** 2)),
    );
    if (ekran)
      tesno += proveritEkran(
        OBSHCHAYA_KASATELNAYA,
        w,
        rnd,
        sch,
        [[], ['vneshnyaya'], ['vnutrennyaya']][n % 3],
      );
    for (const [sk, tt] of [
      [KASATELNAYA, t],
      [OTREZKI_KASATELNYH, s],
      [KASAYUSHCHIESYA, u],
      [OBSHCHAYA_KASATELNAYA, w],
    ]) {
      sch.fakt(
        'сцены: случайные положения допустимы',
        sk.podvizhnye.every((q) => sk.ogranichit(q, tt[q], tt) !== null),
      );
    }
  }
  for (const sk of [KASATELNAYA, OTREZKI_KASATELNYH, KASAYUSHCHIESYA, OBSHCHAYA_KASATELNAYA]) {
    sch.fakt(
      'сцены: начальные положения допустимы',
      sk.podvizhnye.every((q) => sk.ogranichit(q, sk.nachalo[q], sk.nachalo) !== null),
    );
  }
  const plokho = sch.itog();
  console.log(`  подписи в тесноте: ${tesno} на 800 экранах`);
  return { plokho };
}

if (import.meta.url === `file://${process.argv[1]}`)
  process.exit(proverit(Number(process.argv[2] ?? 1000)).plokho === 0 ? 0 : 1);
