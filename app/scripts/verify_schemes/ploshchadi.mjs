/* scripts/verify_schemes/ploshchadi.mjs — схемы 20–23 (площади).
   20: BC·AH_a = AC·BH_b; S = pr; h = ab/c в прямоугольном.
   21: S(ABD)/S(ADC) = BD/DC; медиана — пополам; шесть частей от
       медиан равны; G делит медиану 2:1.
   22: S(AB₁C₁)/S(ABC) = AB₁·AC₁/(AB·AC); то же при угле 180° − A.
   23: S(ABC) = S(ABD) при CD ∥ AB; обратное при равных площадях. */

import { requireSrc } from '../lib/load-ts.mjs';
import { blizko, dist, orient, proveritEkran, schetchik, zerno } from './obshchee.mjs';

const S = (a, b, c) => Math.abs(orient(a, b, c)) / 2;

export function proverit(N = 1000) {
  const P = requireSrc('lib/zadanie18/skhemy/ploshchadi');
  const sch = schetchik('Схемы 20–23 «Площади»');
  const rnd = zerno(18020);
  let tesno = 0;
  for (let n = 0; n < N; n += 1) {
    const ekran = n < 150;
    const t = P.METOD_PLOSHCHADEY.sluchaynaya(rnd);
    const m = P.tochkiMetoda(t);
    const a = dist(m.B, m.C);
    const b = dist(m.A, m.C);
    const c = dist(m.A, m.B);
    sch.fakt(
      '20: BC·AH_a = AC·BH_b = 2S',
      blizko(a * dist(m.A, m.Ha), b * dist(m.B, m.Hb)) &&
        blizko(a * dist(m.A, m.Ha), 2 * S(m.A, m.B, m.C)),
    );
    sch.fakt('20: S = pr', blizko(S(m.A, m.B, m.C), ((a + b + c) / 2) * m.r));
    const k1 = 1 + rnd() * 4;
    const k2 = 1 + rnd() * 4;
    sch.fakt(
      '20: прямоугольный: h = ab/c',
      blizko(
        (S([0, 0], [k1, 0], [0, k2]) * 2) / Math.hypot(k1, k2),
        (k1 * k2) / Math.hypot(k1, k2),
      ),
    );
    if (ekran)
      tesno += proveritEkran(P.METOD_PLOSHCHADEY, t, rnd, sch, [[], ['dva-sposoba'], ['r']][n % 3]);

    const u = P.OBSHCHAYA_VYSOTA.sluchaynaya(rnd);
    const v = P.tochkiVysoty(u);
    sch.fakt('21: D на BC', blizko(dist(v.B, v.D) + dist(v.D, v.C), dist(v.B, v.C)));
    sch.fakt(
      '21: S(ABD)/S(ADC) = BD/DC',
      blizko(S(v.A, v.B, v.D) / S(v.A, v.D, v.C), dist(v.B, v.D) / dist(v.D, v.C)),
    );
    sch.fakt('21: медиана — пополам', blizko(S(v.A, v.B, v.Ma), S(v.A, v.Ma, v.C)));
    const shest = [
      [v.G, v.B, v.Ma],
      [v.G, v.Ma, v.C],
      [v.G, v.C, v.Mb],
      [v.G, v.Mb, v.A],
      [v.G, v.A, v.Mc],
      [v.G, v.Mc, v.B],
    ].map((x) => S(...x));
    const vse = S(v.A, v.B, v.C);
    sch.fakt(
      '21: шесть частей по S/6',
      shest.every((x) => blizko(x, vse / 6)),
    );
    sch.fakt(
      '21: G на всех медианах, AG : GM = 2 : 1',
      blizko(dist(v.A, v.G), 2 * dist(v.G, v.Ma)) &&
        Math.abs(orient(v.B, v.Mb, v.G)) < 1e-6 &&
        Math.abs(orient(v.C, v.Mc, v.G)) < 1e-6,
    );
    if (ekran)
      tesno += proveritEkran(
        P.OBSHCHAYA_VYSOTA,
        u,
        rnd,
        sch,
        [[], ['cheviana'], ['mediana'], ['shest']][n % 4],
      );

    const w = P.OBSHCHIY_UGOL.sluchaynaya(rnd);
    sch.fakt(
      '22: S(AB₁C₁)/S(ABC) = AB₁·AC₁/(AB·AC)',
      blizko(
        S(w.A, w.B1, w.C1) / S(w.A, w.B, w.C),
        (dist(w.A, w.B1) * dist(w.A, w.C1)) / (dist(w.A, w.B) * dist(w.A, w.C)),
      ),
    );
    /* Смежный угол: B₂ на продолжении BA за A. */
    const B2 = [2 * w.A[0] - w.B1[0], 2 * w.A[1] - w.B1[1]];
    sch.fakt(
      '22: угол 180° − A — та же формула',
      blizko(
        S(w.A, B2, w.C1) / S(w.A, w.B, w.C),
        (dist(w.A, B2) * dist(w.A, w.C1)) / (dist(w.A, w.B) * dist(w.A, w.C)),
      ),
    );
    if (ekran) tesno += proveritEkran(P.OBSHCHIY_UGOL, w, rnd, sch, [[], ['otnoshenie']][n % 2]);

    const r = P.RELSY.sluchaynaya(rnd);
    sch.fakt('23: CD ∥ AB ⇒ S(ABC) = S(ABD)', blizko(S(r.A, r.B, r.C), S(r.A, r.B, r.D)));
    const Dy = [r.D[0], r.C[1] * (0.5 + rnd())];
    const ravny = blizko(S(r.A, r.B, r.C), S(r.A, r.B, Dy), 1e-9);
    sch.fakt(
      '23: обратное — равные площади (по одну сторону) ⇔ D на рельсе',
      ravny === blizko(Dy[1], r.C[1], 1e-9),
    );
    if (ekran)
      tesno += proveritEkran(P.RELSY, r, rnd, sch, [[], ['ravny'], ['obratno'], ['trap']][n % 4]);
    for (const [sk, tt] of [
      [P.METOD_PLOSHCHADEY, t],
      [P.OBSHCHAYA_VYSOTA, u],
      [P.OBSHCHIY_UGOL, w],
      [P.RELSY, r],
    ]) {
      sch.fakt(
        'сцены: случайные положения допустимы',
        sk.podvizhnye.every((q) => sk.ogranichit(q, tt[q], tt) !== null),
      );
    }
  }
  for (const sk of [P.METOD_PLOSHCHADEY, P.OBSHCHAYA_VYSOTA, P.OBSHCHIY_UGOL, P.RELSY]) {
    sch.fakt(
      'сцены: начальные положения допустимы',
      sk.podvizhnye.every((q) => sk.ogranichit(q, sk.nachalo[q], sk.nachalo) !== null),
    );
  }
  const plokho = sch.itog();
  console.log(`  подписи в тесноте: ${tesno} на 600 экранах`);
  return { plokho };
}

if (import.meta.url === `file://${process.argv[1]}`)
  process.exit(proverit(Number(process.argv[2] ?? 1000)).plokho === 0 ? 0 : 1);
