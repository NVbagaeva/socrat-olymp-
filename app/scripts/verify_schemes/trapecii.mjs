/* scripts/verify_schemes/trapecii.mjs — схемы 16–18.
   16: △AOD ∼ △COB, AO/OC = DO/OB = AD/BC; S(AOB) = S(COD);
       S(AOB)² = S(AOD)·S(BOC); S = (√S₁ + √S₂)².
   17: P, E, O, F на одной прямой (E, F — середины оснований).
   18: AB = CD, ∠A = ∠D, AC = BD; AH = (AD − BC)/2, AH₁ = (AD + BC)/2;
       при h = √(AD·BC): AB = (AD + BC)/2, окружность (0, h/2) касается
       всех четырёх сторон. */

import { requireSrc } from '../lib/load-ts.mjs';
import { blizko, dist, orient, proveritEkran, schetchik, ugol, zerno } from './obshchee.mjs';

const S = (a, b, c) => Math.abs(orient(a, b, c)) / 2;
const doPryamoy = (p, a, b) => Math.abs(orient(a, b, p)) / dist(a, b);

export function proverit(N = 1000) {
  const { BABOCHKA, tochkiBabochki } = requireSrc('lib/zadanie18/skhemy/babochka');
  const { CHETYRE_TOCHKI, tochkiChetyreh } = requireSrc('lib/zadanie18/skhemy/chetyreTochki');
  const { RAVNOBOKAYA, tochkiRavnobokoy } = requireSrc('lib/zadanie18/skhemy/ravnobokaya');
  const sch = schetchik('Схемы 16–18 «Трапеция»');
  const rnd = zerno(18016);
  let tesno = 0;
  let vpis = 0;
  for (let n = 0; n < N; n += 1) {
    const ekran = n < 200;
    const t = BABOCHKA.sluchaynaya(rnd);
    const { A, B, C, D, O } = tochkiBabochki(t);
    const k = dist(A, D) / dist(B, C);
    sch.fakt(
      '16: AO/OC = DO/OB = AD/BC, ∠OAD = ∠OCB',
      blizko(dist(A, O) / dist(O, C), k) &&
        blizko(dist(D, O) / dist(O, B), k) &&
        blizko(ugol(O, A, D), ugol(O, C, B), 1e-6),
    );
    sch.fakt('16: S(AOB) = S(COD)', blizko(S(A, O, B), S(C, O, D)));
    sch.fakt(
      '16: S(AOB)² = S(AOD)·S(BOC), S(AOD)/S(BOC) = k²',
      blizko(S(A, O, B) ** 2, S(A, O, D) * S(B, O, C)) && blizko(S(A, O, D) / S(B, O, C), k * k),
    );
    sch.fakt(
      '16: S(ABCD) = (√S₁ + √S₂)²',
      blizko(S(A, B, C) + S(A, C, D), (Math.sqrt(S(A, O, D)) + Math.sqrt(S(B, O, C))) ** 2),
    );
    if (ekran)
      tesno += proveritEkran(
        BABOCHKA,
        t,
        rnd,
        sch,
        [[], ['podobie'], ['bokovye'], ['ploshchadi'], ['bokovye-dok']][n % 5],
      );
    const u = CHETYRE_TOCHKI.sluchaynaya(rnd);
    const c = tochkiChetyreh(u);
    sch.fakt(
      '17: E и O на прямой PF',
      doPryamoy(c.E, c.P, c.F) < 1e-7 && doPryamoy(c.O, c.P, c.F) < 1e-7,
    );
    if (ekran)
      tesno += proveritEkran(CHETYRE_TOCHKI, u, rnd, sch, [[], ['pryamaya'], ['p'], ['o']][n % 4]);
    const w = RAVNOBOKAYA.sluchaynaya(rnd);
    const r = tochkiRavnobokoy(w);
    const ad = 2 * r.a;
    const bc = 2 * r.b;
    sch.fakt(
      '18: AB = CD, ∠A = ∠D, AC = BD',
      blizko(dist(r.A, r.B), dist(r.C, r.D)) &&
        blizko(ugol(r.D, r.A, r.B), ugol(r.C, r.D, r.A), 1e-6) &&
        blizko(dist(r.A, r.C), dist(r.B, r.D)),
    );
    sch.fakt(
      '18: AH = (AD − BC)/2, AH₁ = (AD + BC)/2',
      blizko(dist(r.A, r.H), (ad - bc) / 2) && blizko(dist(r.A, r.H2), (ad + bc) / 2),
    );
    if (r.vpisana) {
      vpis += 1;
      const I = [0, r.h / 2];
      const ok = [
        [r.A, r.B],
        [r.B, r.C],
        [r.C, r.D],
        [r.D, r.A],
      ].every(([p, q]) => blizko(doPryamoy(I, p, q), r.h / 2));
      sch.fakt(
        '18: вписанная: окружность касается сторон, AB = (AD+BC)/2, h = √(AD·BC)',
        ok && blizko(r.bok, (ad + bc) / 2) && blizko(r.h, Math.sqrt(ad * bc)),
      );
    }
    if (ekran)
      tesno += proveritEkran(
        RAVNOBOKAYA,
        w,
        rnd,
        sch,
        [[], ['ravenstvo'], ['proekcii'], ['vpisannaya']][n % 4],
      );
    for (const [sk, tt] of [
      [BABOCHKA, t],
      [CHETYRE_TOCHKI, u],
      [RAVNOBOKAYA, w],
    ]) {
      sch.fakt(
        'сцены: случайные положения допустимы',
        sk.podvizhnye.every((q) => sk.ogranichit(q, tt[q], tt) !== null),
      );
    }
  }
  for (const sk of [BABOCHKA, CHETYRE_TOCHKI, RAVNOBOKAYA]) {
    sch.fakt(
      'сцены: начальные положения допустимы',
      sk.podvizhnye.every((q) => sk.ogranichit(q, sk.nachalo[q], sk.nachalo) !== null),
    );
  }
  const plokho = sch.itog();
  console.log(`  с вписанной окружностью: ${vpis}; подписи в тесноте: ${tesno} на 600 экранах`);
  return { plokho };
}

if (import.meta.url === `file://${process.argv[1]}`)
  process.exit(proverit(Number(process.argv[2] ?? 1000)).plokho === 0 ? 0 : 1);
